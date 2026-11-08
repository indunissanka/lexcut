"""Background job queue: one worker thread (one model instance), with cache, cancel and retry."""
import hashlib
import json
import queue
import re
import shutil
import threading
import time

from . import adapters, config, db, media
from .adapters.base import STYLES, Cancelled

_q = queue.Queue()
_current = {"id": None}
_started = False
_start_lock = threading.Lock()
clamp = lambda v, lo, hi: max(lo, min(hi, v))


def apply_lexicon(text: str, lex: dict) -> str:
    """Pronunciation corrections: replace words/phrases with a respelling the engine reads correctly."""
    for word in sorted(lex, key=len, reverse=True):
        if word.strip():
            text = re.sub(r"(?<!\w)" + re.escape(word) + r"(?!\w)", lex[word], text, flags=re.I)
    return text


def resolve(voice: dict, p: dict) -> dict:
    """Merge profile defaults with request overrides into the final engine request (and cache identity)."""
    s = json.loads(voice["settings"] or "{}")
    style = p.get("style") or voice["style"] or "natural"
    st = STYLES.get(style, STYLES["natural"])
    speed = float(p.get("speed", s.get("speed", 1.0)))
    sim = float(p.get("similarity", s.get("similarity", 60)))
    emo = float(p.get("emotion", s.get("emotion", 50)))
    lex = {**json.loads(voice["lexicon"] or "{}"), **(p.get("lexicon") or {})}
    text = apply_lexicon(str(p["text"]).strip(), lex)
    return {
        "text": text, "language": p.get("language") or voice["language"],
        "speed": clamp(speed * st["speed"], 0.6, 1.5),
        "temperature": clamp(0.85 - 0.5 * sim / 100 + st["rand"] + (emo - 50) / 100 * 0.3, 0.2, 1.0),
        "pitch": clamp(float(p.get("pitch", s.get("pitch", 0))), -6, 6),
        "fit_dur": float(p["fit_dur"]) if p.get("fit_dur") else None,
        "variant": int(p.get("variant", 0)), "style": style,
        "pauses": {"sentence": st["sentence_pause"], "paragraph": st["paragraph_pause"]},
    }


def cache_key(voice, eng, r) -> str:
    ident = {k: r[k] for k in ("text", "language", "speed", "temperature", "pitch", "fit_dur", "variant")}
    ident.update(voice=voice["id"], version=voice["version"], engine=eng.id, model=eng.model)
    return hashlib.sha256(json.dumps(ident, sort_keys=True).encode()).hexdigest()[:32]


def out_file(key):
    return config.data_dir() / "out" / f"{key}.wav"


def submit_tts(voice: dict, p: dict) -> dict:
    _startup()
    eng = adapters.get(voice["provider"])
    if voice["status"] != "ready":
        raise ValueError("This voice has not been cloned yet. Create the voice clone first.")
    if not str(p.get("text", "")).strip():
        raise ValueError("No text to speak.")
    if len(p["text"]) > 5000:
        raise ValueError("Text is too long for one request (max 5000 characters). Split it into sentences.")
    lang = p.get("language") or voice["language"]
    if lang not in {l["code"] for l in eng.capabilities()["languages"]}:
        raise ValueError(f"{eng.name} does not support language '{lang}'.")
    r = resolve(voice, p)
    key = cache_key(voice, eng, r)
    jid = db.new_id()
    now = time.time()
    cached = out_file(key).exists()
    db.run("INSERT INTO jobs(id,voice_id,text_len,params,cache_key,status,created_at,finished_at,cached,out_path,duration,kind) VALUES(?,?,?,?,?,?,?,?,?,?,?,'tts')",
           (jid, voice["id"], len(p["text"]), json.dumps({**p, "_r": r}), key, "done" if cached else "queued", now,
            now if cached else None, int(cached), str(out_file(key)) if cached else "", media.duration(out_file(key)) if cached else 0))
    db.audit("tts.generate", voice["id"], job=jid, chars=len(p["text"]), sha=hashlib.sha256(p["text"].encode()).hexdigest()[:12], cached=cached)
    if not cached:
        _enqueue(jid)
    return job_view(jid)


def submit_clone(voice: dict) -> dict:
    _startup()
    if not db.q("SELECT id FROM samples WHERE voice_id=?", (voice["id"],)):
        raise ValueError("Add at least one voice sample first.")
    jid = db.new_id()
    db.run("INSERT INTO jobs(id,voice_id,params,status,created_at,kind) VALUES(?,?,?,?,?,'clone')", (jid, voice["id"], "{}", "queued", time.time()))
    db.run("UPDATE voices SET status='cloning' WHERE id=?", (voice["id"],))
    _enqueue(jid)
    return job_view(jid)


def _startup():
    """Once per server run, before any job is created: jobs left over from a previous run can never finish."""
    global _started
    with _start_lock:
        if not _started:
            db.run("UPDATE jobs SET status='failed', error='Interrupted by a server restart.' WHERE status IN ('queued','running')")
            db.run("UPDATE voices SET status='draft' WHERE status='cloning'")
            threading.Thread(target=_worker, daemon=True, name="voice-worker").start()
            _started = True


def _enqueue(jid):
    _q.put(jid)


def _worker():
    while True:
        jid = _q.get()
        job = db.one("SELECT * FROM jobs WHERE id=?", (jid,))
        if not job or job["status"] != "queued":
            continue
        _current["id"] = jid
        db.run("UPDATE jobs SET status='running', started_at=?, error='' WHERE id=?", (time.time(), jid))
        try:
            voice = db.one("SELECT * FROM voices WHERE id=?", (job["voice_id"],))
            if not voice:
                raise RuntimeError("Voice no longer exists.")
            eng = adapters.get(voice["provider"])
            wd = config.data_dir()
            if job["kind"] == "clone":
                samples = [s["path"] for s in db.q("SELECT path FROM samples WHERE voice_id=?", (voice["id"],))]
                eng.prepare_voice(voice, samples, wd)
                db.run("UPDATE voices SET status='ready', updated_at=? WHERE id=? AND version=?", (time.time(), voice["id"], voice["version"]))
                db.run("UPDATE jobs SET status='done', finished_at=? WHERE id=?", (time.time(), jid))
                db.audit("voice.cloned", voice["id"], job=jid, samples=len(samples))
            else:
                r = json.loads(job["params"])["_r"]
                raw = wd / "tmp" / f"{jid}.raw.wav"
                eng.synthesize(voice, r, raw, wd)
                final = out_file(job["cache_key"])
                meta = {"comment": f"AI-generated speech (OpenCut AI Voice Studio, {eng.name}). Voice profile: {voice['name']}.",
                        "artist": "AI-generated voice", "title": "AI-generated"}
                media.post_process(raw, final, r["pitch"], r["fit_dur"], meta)
                raw.unlink(missing_ok=True)
                db.run("UPDATE jobs SET status='done', out_path=?, duration=?, finished_at=? WHERE id=?",
                       (str(final), media.duration(final), time.time(), jid))
        except Cancelled:
            db.run("UPDATE jobs SET status='cancelled', finished_at=? WHERE id=?", (time.time(), jid))
            _reset_voice_if_cloning(job)
        except Exception as e:
            db.run("UPDATE jobs SET status='failed', error=?, finished_at=? WHERE id=?", (str(e)[:500], time.time(), jid))
            _reset_voice_if_cloning(job, failed=True)
        finally:
            _current["id"] = None


def _reset_voice_if_cloning(job, failed=False):
    if job["kind"] == "clone":
        db.run("UPDATE voices SET status='draft' WHERE id=? AND status='cloning'", (job["voice_id"],))


def cancel(jid) -> dict:
    job = db.one("SELECT * FROM jobs WHERE id=?", (jid,))
    if not job:
        raise KeyError("job")
    if job["status"] == "queued":
        db.run("UPDATE jobs SET status='cancelled', finished_at=? WHERE id=?", (time.time(), jid))
        _reset_voice_if_cloning(job)
    elif job["status"] == "running" and _current["id"] == jid:
        voice = db.one("SELECT provider FROM voices WHERE id=?", (job["voice_id"],))
        if voice:
            adapters.get(voice["provider"]).cancel()
    return job_view(jid)


def retry(jid) -> dict:
    _startup()
    job = db.one("SELECT * FROM jobs WHERE id=?", (jid,))
    if not job:
        raise KeyError("job")
    if job["status"] not in ("failed", "cancelled"):
        raise ValueError("Only failed or cancelled jobs can be retried.")
    if out_file(job["cache_key"] or "x").exists() and job["kind"] == "tts":
        db.run("UPDATE jobs SET status='done', cached=1, out_path=? WHERE id=?", (str(out_file(job["cache_key"])), jid))
        return job_view(jid)
    db.run("UPDATE jobs SET status='queued', error='', finished_at=NULL WHERE id=?", (jid,))
    if job["kind"] == "clone":
        db.run("UPDATE voices SET status='cloning' WHERE id=?", (job["voice_id"],))
    _enqueue(jid)
    return job_view(jid)


def job_view(jid) -> dict:
    j = db.one("SELECT * FROM jobs WHERE id=?", (jid,))
    if not j:
        return None
    ahead = db.one("SELECT COUNT(*) n FROM jobs WHERE status IN ('queued','running') AND created_at<?", (j["created_at"],))["n"] if j["status"] == "queued" else 0
    return {"id": j["id"], "voice_id": j["voice_id"], "kind": j["kind"], "status": j["status"], "error": j["error"],
            "duration": j["duration"], "cached": bool(j["cached"]), "queue_position": ahead}


def purge_voice_outputs(voice_id):
    for j in db.q("SELECT cache_key FROM jobs WHERE voice_id=? AND kind='tts'", (voice_id,)):
        if j["cache_key"]:
            out_file(j["cache_key"]).unlink(missing_ok=True)
