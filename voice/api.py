"""HTTP API for AI Voice Studio. Returns (status, content_type, body_bytes). Called from server.py."""
import hashlib
import json
import re
import shutil
import time
from pathlib import Path

from . import adapters, config, db, jobs, media

MAX_SAMPLE = 80_000_000
MAX_SAMPLES = 20
CONSENT_TEXT = "I confirm this is my own voice, or that I have the explicit permission of the voice's owner to clone it, and I will not use it to impersonate or deceive anyone."
EXT = {".mp3", ".wav", ".m4a", ".aac", ".webm", ".ogg", ".oga", ".opus", ".flac", ".mp4", ".mov", ".caf", ".aiff"}
PREVIEW = {"en": "Hello! This is a short preview of my cloned voice.", "zh-cn": "你好，这是我克隆声音的简短试听。", "zh-tw": "你好，這是我複製聲音的簡短試聽。",
           "ja": "こんにちは。これは私のクローン音声の短い試聴です。", "ko": "안녕하세요. 제 복제 음성의 짧은 미리듣기입니다.",
           "ar": "مرحبا، هذا مقطع قصير لمعاينة صوتي المستنسخ."}


class ApiError(Exception):
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code


def _clean(o):
    """Browsers reject NaN/Infinity in JSON; turn them into null."""
    if isinstance(o, float) and (o != o or o in (float("inf"), float("-inf"))):
        return None
    if isinstance(o, dict):
        return {k: _clean(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_clean(v) for v in o]
    return o


def _json(code, obj):
    return code, "application/json", json.dumps(_clean(obj), allow_nan=False).encode()


def voice_view(v, with_samples=True):
    out = {k: v[k] for k in ("id", "name", "project", "language", "gender", "style", "provider", "model", "status", "version", "created_at", "updated_at", "consent_by", "consent_at")}
    out["settings"] = json.loads(v["settings"] or "{}")
    out["lexicon"] = json.loads(v["lexicon"] or "{}")
    if with_samples:
        out["samples"] = [{**s, "quality": json.loads(s["quality"] or "{}")} for s in db.q("SELECT id,filename,duration,quality,created_at FROM samples WHERE voice_id=? ORDER BY created_at", (v["id"],))]
        out["quality"] = overall_quality(out["samples"])
    try:
        caps = adapters.get(v["provider"]).capabilities()
        out["supported_languages"] = [l["code"] for l in caps["languages"]]
    except Exception:
        out["supported_languages"] = []
    return out


def overall_quality(samples):
    if not samples:
        return {"score": 0, "label": "No samples", "duration": 0, "tips": ["Upload or record at least one voice sample."]}
    total = sum(s["duration"] or 0 for s in samples)
    avg = sum((s["quality"].get("score", 0)) * (s["duration"] or 0) for s in samples) / max(total, 0.1)
    score = int(avg)
    tips = []
    if total < 6: score = min(score, 40); tips.append("Total sample time is under 6 seconds. Add more speech.")
    elif total < 15: score = min(score, 70); tips.append("Add more samples: 15–60 seconds in total works best.")
    seen = set()
    for s in samples:
        for t in s["quality"].get("tips", []):
            if t not in seen and not t.startswith("Use only one speaker"):
                seen.add(t); tips.append(t)
    tips.append("Use only one speaker, with no music or other voices in the recordings.")
    return {"score": score, "label": "Good" if score >= 75 else "Fair" if score >= 50 else "Poor", "duration": round(total, 1), "tips": tips[:6]}


def get_voice(vid):
    v = db.one("SELECT * FROM voices WHERE id=?", (vid,))
    if not v:
        raise ApiError(404, "Voice not found.")
    return v


def _invalidate(v):
    """Samples changed: the clone must be rebuilt, and old generated audio no longer matches this voice."""
    d = config.data_dir() / "samples" / v["id"]
    for f in d.glob("latents_v*.pt"):
        f.unlink(missing_ok=True)
    db.run("UPDATE voices SET status='draft', version=version+1, updated_at=? WHERE id=?", (time.time(), v["id"]))


def _settings(d):
    s = d or {}
    clean = {}
    for k, lo, hi in (("speed", 0.6, 1.5), ("pitch", -6, 6), ("similarity", 0, 100), ("emotion", 0, 100)):
        if k in s:
            clean[k] = max(lo, min(hi, float(s[k])))
    return clean


def handle(method, path, query, read_body):
    try:
        return _route(method, path, query, read_body)
    except ApiError as e:
        return _json(e.code, {"error": str(e)})
    except ValueError as e:
        return _json(400, {"error": str(e)})
    except KeyError:
        return _json(404, {"error": "Not found."})
    except Exception as e:
        return _json(500, {"error": str(e)[:500]})


def _body_json(read_body):
    try:
        return json.loads(read_body(2_000_000) or b"{}")
    except ValueError:
        raise ApiError(400, "Bad JSON.")


def _route(method, path, query, read_body):
    parts = [p for p in path.split("/") if p][2:]       # strip "api", "voice"
    q1 = lambda k, d="": (query.get(k) or [d])[0]
    eng = lambda: adapters.get()

    if parts == ["capabilities"] and method == "GET":
        caps = eng().capabilities()
        caps["consent_text"] = CONSENT_TEXT
        caps["preview_text"] = PREVIEW
        return _json(200, caps)
    if parts == ["license"] and method == "POST":
        if _body_json(read_body).get("accept") is True:
            config.update(license_accepted=True)
            db.audit("license.accepted", "", engine=eng().id)
        return _json(200, eng().capabilities())

    if parts == ["voices"] and method == "GET":
        project = q1("project")
        rows = db.q("SELECT * FROM voices WHERE (?='' OR project=?) ORDER BY created_at DESC", (project, project))
        return _json(200, {"voices": [voice_view(v) for v in rows], "projects": sorted({v["project"] for v in db.q("SELECT project FROM voices") if v["project"]})})
    if parts == ["voices"] and method == "POST":
        b = _body_json(read_body)
        c = b.get("consent") or {}
        if c.get("confirmed") is not True or not str(c.get("by", "")).strip():
            raise ApiError(403, "Voice cloning requires confirming that you own this voice or have the owner's explicit permission, and entering the owner's name.")
        name = str(b.get("name", "")).strip()[:80]
        if not name:
            raise ApiError(400, "Give the voice a name.")
        e = eng()
        lang = b.get("language", "en")
        if lang not in {l["code"] for l in e.capabilities()["languages"]}:
            raise ApiError(400, f"{e.name} does not support language '{lang}'.")
        vid = db.new_id(); now = time.time()
        db.run("INSERT INTO voices(id,name,project,language,gender,style,provider,model,status,settings,lexicon,consent_by,consent_at,consent_text,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
               (vid, name, str(b.get("project", ""))[:80], lang, str(b.get("gender", ""))[:20], b.get("style", "natural"), e.id, e.model, "draft",
                json.dumps(_settings(b.get("settings"))), json.dumps(b.get("lexicon") or {}), str(c["by"])[:120], now, CONSENT_TEXT, now, now))
        db.audit("voice.create", vid, name=name, consent_by=str(c["by"])[:120], provider=e.id)
        return _json(200, voice_view(get_voice(vid)))

    if len(parts) >= 2 and parts[0] == "voices":
        v = get_voice(parts[1])
        rest = parts[2:]
        if not rest and method == "GET":
            return _json(200, voice_view(v))
        if not rest and method == "DELETE":
            return _delete_voice(v)
        if rest == ["update"] and method == "POST":
            b = _body_json(read_body)
            sets, args = [], []
            for k, mx in (("name", 80), ("project", 80), ("gender", 20), ("style", 30), ("language", 10)):
                if k in b:
                    val = str(b[k]).strip()[:mx]
                    if k == "name" and not val:
                        raise ApiError(400, "Name cannot be empty.")
                    sets.append(f"{k}=?"); args.append(val)
            if "settings" in b: sets.append("settings=?"); args.append(json.dumps(_settings(b["settings"])))
            if "lexicon" in b: sets.append("lexicon=?"); args.append(json.dumps({str(k)[:60]: str(x)[:80] for k, x in (b["lexicon"] or {}).items()}))
            if sets:
                db.run(f"UPDATE voices SET {','.join(sets)}, updated_at=? WHERE id=?", (*args, time.time(), v["id"]))
                db.audit("voice.update", v["id"], fields=[s.split("=")[0] for s in sets])
            return _json(200, voice_view(get_voice(v["id"])))
        if rest == ["samples"] and method == "POST":
            return _add_sample(v, query, read_body)
        if len(rest) == 2 and rest[0] == "samples" and method == "DELETE":
            s = db.one("SELECT * FROM samples WHERE id=? AND voice_id=?", (rest[1], v["id"]))
            if not s: raise ApiError(404, "Sample not found.")
            Path(s["path"]).unlink(missing_ok=True)
            db.run("DELETE FROM samples WHERE id=?", (s["id"],))
            _invalidate(v)
            db.audit("sample.delete", v["id"], sample=s["id"])
            return _json(200, voice_view(get_voice(v["id"])))
        if len(rest) == 3 and rest[0] == "samples" and rest[2] == "audio" and method == "GET":
            s = db.one("SELECT * FROM samples WHERE id=? AND voice_id=?", (rest[1], v["id"]))
            if not s: raise ApiError(404, "Sample not found.")
            return 200, "audio/wav", Path(s["path"]).read_bytes()
        if rest == ["clone"] and method == "POST":
            if v["status"] == "cloning":
                raise ApiError(409, "This voice is already being created.")
            return _json(200, jobs.submit_clone(v))

    if parts == ["generate"] and method == "POST":
        b = _body_json(read_body)
        v = get_voice(str(b.get("voice_id", "")))
        return _json(200, jobs.submit_tts(v, b))
    if len(parts) >= 2 and parts[0] == "jobs":
        jid = parts[1]
        if len(parts) == 2 and method == "GET":
            j = jobs.job_view(jid)
            if not j: raise ApiError(404, "Job not found.")
            return _json(200, j)
        if parts[2:] == ["cancel"] and method == "POST":
            return _json(200, jobs.cancel(jid))
        if parts[2:] == ["retry"] and method == "POST":
            return _json(200, jobs.retry(jid))
        if parts[2:] == ["audio"] and method == "GET":
            j = db.one("SELECT * FROM jobs WHERE id=?", (jid,))
            if not j or j["status"] != "done" or not j["out_path"] or not Path(j["out_path"]).exists():
                raise ApiError(404, "Audio is not available.")
            return 200, "audio/wav", Path(j["out_path"]).read_bytes()
    if parts == ["audit"] and method == "GET":
        vid = q1("voice_id")
        rows = db.q("SELECT ts,action,voice_id,detail FROM audit WHERE (?='' OR voice_id=?) ORDER BY id DESC LIMIT 200", (vid, vid))
        return _json(200, {"events": [{**r, "detail": json.loads(r["detail"] or "{}")} for r in rows]})
    if parts == ["audit"] and method == "POST":
        b = _body_json(read_body)
        if b.get("action") not in ("timeline.insert", "timeline.replace", "export.with_ai_voice"):
            raise ApiError(400, "Unknown audit action.")
        get_voice(str(b.get("voice_id", "")))
        db.audit(b["action"], b["voice_id"], **{k: b[k] for k in ("clips", "seconds") if k in b})
        return _json(200, {"ok": True})
    raise ApiError(404, "Not found.")


def _add_sample(v, query, read_body):
    if db.one("SELECT COUNT(*) n FROM samples WHERE voice_id=?", (v["id"],))["n"] >= MAX_SAMPLES:
        raise ApiError(400, f"At most {MAX_SAMPLES} samples per voice.")
    fname = (query.get("filename") or ["recording.webm"])[0]
    ext = Path(fname).suffix.lower() or ".webm"
    if ext not in EXT:
        raise ApiError(400, "Unsupported file type. Use MP3, WAV, M4A, WebM or OGG.")
    data = read_body(MAX_SAMPLE)
    if not data:
        raise ApiError(400, "Empty file.")
    sid = db.new_id()
    d = config.data_dir() / "samples" / v["id"]
    d.mkdir(mode=0o700, parents=True, exist_ok=True)
    raw, dst = config.data_dir() / "tmp" / f"{sid}{ext}", d / f"{sid}.wav"
    raw.write_bytes(data)
    try:
        media.convert_sample(raw, dst, denoise=(query.get("denoise") or ["0"])[0] == "1")
        qual = media.analyze_quality(dst)
    except Exception as e:
        dst.unlink(missing_ok=True)
        raise ApiError(400, f"Could not read this audio: {str(e)[-200:]}")
    finally:
        raw.unlink(missing_ok=True)
    db.run("INSERT INTO samples(id,voice_id,filename,path,duration,quality,created_at) VALUES(?,?,?,?,?,?,?)",
           (sid, v["id"], Path(fname).name[:120], str(dst), qual["duration"], json.dumps(qual), time.time()))
    _invalidate(v)
    db.audit("sample.add", v["id"], sample=sid, seconds=qual["duration"], denoise=(query.get("denoise") or ["0"])[0] == "1")
    return _json(200, voice_view(get_voice(v["id"])))


def _delete_voice(v):
    running = db.one("SELECT id FROM jobs WHERE voice_id=? AND status='running'", (v["id"],))
    if running:
        jobs.cancel(running["id"])
    jobs.purge_voice_outputs(v["id"])
    shutil.rmtree(config.data_dir() / "samples" / v["id"], ignore_errors=True)
    try:
        adapters.get(v["provider"]).delete_voice(v, config.data_dir())
    except Exception:
        pass
    for t in ("samples", "jobs"):
        db.run(f"DELETE FROM {t} WHERE voice_id=?", (v["id"],))
    db.run("DELETE FROM voices WHERE id=?", (v["id"],))
    db.audit("voice.delete", v["id"], name=v["name"])
    return _json(200, {"deleted": v["id"]})
