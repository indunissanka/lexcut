"""Paid cloud AI through Replicate: video generation, background removal, face enhancement, eye contact.

The API key lives in ~/.opencut/ai_config.json (mode 600) and is never sent to the browser.
Each feature is a "slot" with a Replicate model name you can change. Input field names differ between models,
so they are read from the model's own schema (GET /v1/models/{model}) and matched by name; "extra" inputs override.
Jobs run in background threads: start -> status -> result (the finished file), with cancel.
"""
import json
import mimetypes
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from platform_util import which

FFMPEG = which("ffmpeg") or "ffmpeg"

HOME = Path.home() / ".opencut"
CONFIG = Path(os.environ.get("OPENCUT_AI_CONFIG", HOME / "ai_config.json"))
BASE = os.environ.get("OPENCUT_REPLICATE_BASE", "https://api.replicate.com").rstrip("/")
MAX_UPLOAD = 800_000_000
# Starting points: the names are what I believe exist on Replicate. Use "Check model" in the editor to confirm each one with your key.
DEFAULT_SLOTS = {
    "video": {"label": "Text to video", "model": "wan-video/wan-2.2-t2v-fast", "extra": {}},
    "image2video": {"label": "Image to video", "model": "wan-video/wan-2.2-i2v-fast", "extra": {}},
    "background": {"label": "Remove video background", "model": "arielreplicate/robust_video_matting", "extra": {"output_type": "green-screen"}},
    "face": {"label": "Face enhancement", "model": "pollinations/codeformer-video", "extra": {}},
    "eyes": {"label": "Eye contact", "model": "", "extra": {}},
    "s2s": {"label": "Speech to speech", "model": "", "extra": {}},
    "isolate": {"label": "Voice isolation", "model": "ryan5453/demucs", "extra": {"stem": "vocals"}},
    "lipsync": {"label": "Lip sync", "model": "sync/lipsync-2", "extra": {}},
}
_lock = threading.Lock()
JOBS = {}
AUX = {}   # staged second files: id -> (time, path)


def load():
    with _lock:
        try:
            cfg = json.loads(CONFIG.read_text())
        except (OSError, ValueError):
            cfg = {}
    slots = {k: {**v, **(cfg.get("slots", {}).get(k) or {})} for k, v in DEFAULT_SLOTS.items()}
    return {"token": cfg.get("token", ""), "slots": slots}


def save(token=None, slots=None):
    cfg = load()
    if token is not None:
        cfg["token"] = token.strip()
    if slots:
        for k, v in slots.items():
            if k in cfg["slots"] and isinstance(v, dict):
                if "model" in v:
                    cfg["slots"][k]["model"] = str(v["model"]).strip()
                if isinstance(v.get("extra"), dict):
                    cfg["slots"][k]["extra"] = v["extra"]
    with _lock:
        HOME.mkdir(parents=True, exist_ok=True)
        CONFIG.write_text(json.dumps({"token": cfg["token"], "slots": cfg["slots"]}, indent=1))
        os.chmod(CONFIG, 0o600)


def public_config():
    c = load()
    return {"configured": bool(c["token"]), "slots": c["slots"], "provider": "Replicate"}


def _req(method, url, token, body=None, headers=None, raw=False, timeout=120):
    h = {"Authorization": f"Bearer {token}", **(headers or {})}
    data = None
    if body is not None:
        if isinstance(body, (bytes, bytearray)):
            data = bytes(body)
        else:
            data = json.dumps(body).encode()
            h.setdefault("Content-Type", "application/json")
    rq = urllib.request.Request(url if url.startswith("http") else BASE + url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(rq, timeout=timeout) as r:
            out = r.read()
            return out if raw else (json.loads(out) if out else {})
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8", "replace")
        try:
            detail = json.loads(txt).get("detail") or txt
        except ValueError:
            detail = txt
        if e.code == 401:
            raise RuntimeError("Replicate rejected the API key (401). Paste the key again in the AI Cloud settings.")
        if e.code == 402:
            raise RuntimeError("Replicate says payment is needed (402): add billing credit to your Replicate account.")
        if e.code == 404:
            raise RuntimeError("Replicate does not know this model or file (404). Check the model name in the settings.")
        raise RuntimeError(f"Replicate error {e.code}: {str(detail)[:300]}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Could not reach Replicate: {e.reason}")


def model_info(slug, token):
    if not re.fullmatch(r"[\w.\-]+/[\w.\-]+", slug or ""):
        raise RuntimeError("Set the model name for this feature first (format owner/name).")
    m = _req("GET", f"/v1/models/{slug}", token)
    v = m.get("latest_version") or {}
    props = (((v.get("openapi_schema") or {}).get("components") or {}).get("schemas") or {}).get("Input", {}).get("properties", {})
    return {"slug": slug, "version": v.get("id"), "props": props, "description": m.get("description", "")}


def _pick(props, pats, uri=None):
    for pat in pats:
        for k, v in props.items():
            if re.search(pat, k) and (uri is None or (v.get("format") == "uri") == uri):
                return k
    return None


def build_input(info, role, values, extra):
    """Map our roles (video file, image file, prompt, duration, aspect) onto this model's own input names."""
    props, inp, used = info["props"], {}, set()
    for r, val in values.items():
        if val is None:
            continue
        if r == "video":
            k = _pick(props, [r"^(input_)?video(_path|_url|_file)?$", r"video", r"^input$"], True)
        elif r == "audio":
            k = _pick(props, [r"^(input_)?audio(_path|_url|_file)?$", r"^(source|song)_?(audio|input)?$", r"audio", r"^input$"], True)
        elif r == "ref":
            k = _pick({a: b for a, b in props.items() if a not in used}, [r"reference|target|speaker|voice|timbre|style"], True)
        elif r == "image":
            k = _pick(props, [r"^(input_)?image$", r"start_image|first_frame|init_image", r"image|img"], True)
        elif r == "prompt":
            k = _pick(props, [r"^prompt$"])
        elif r == "aspect":
            k = _pick(props, [r"^aspect_ratio$"])
        elif r == "duration":
            k = _pick(props, [r"^duration$"])
            if k:
                p = props[k]
                if p.get("enum"):
                    val = min(p["enum"], key=lambda x: abs(float(x) - float(val)))
                else:
                    val = float(val)
                    if p.get("minimum") is not None:
                        val = max(val, float(p["minimum"]))
                    if p.get("maximum") is not None:
                        val = min(val, float(p["maximum"]))
                if p.get("type") == "integer":
                    val = int(round(float(val)))
            else:
                k = _pick(props, [r"^num_frames$"])
                if k:
                    p = props[k]
                    val = int(round(float(val) * 16)) + 1
                    val = max(int(p.get("minimum", 1)), min(int(p.get("maximum", val)), val))
        else:
            k = None
        if k:
            inp[k] = val
            used.add(k)
        elif r in ("video", "image", "prompt", "audio", "ref"):
            raise RuntimeError(f"The model {info['slug']} has no input I can use for the {r}. Its inputs are: {', '.join(props) or '(unknown)'}. Choose another model in the settings.")
    inp.update(extra or {})
    return inp


def _upload(path, token, ctype):
    boundary = uuid.uuid4().hex
    data = path.read_bytes()
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"content\"; filename=\"{path.name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()
    j = _req("POST", "/v1/files", token, body, {"Content-Type": f"multipart/form-data; boundary={boundary}"}, timeout=1800)
    url = (j.get("urls") or {}).get("get")
    if not url:
        raise RuntimeError("Replicate accepted the upload but returned no file address.")
    return url


def _first_url(out):
    if isinstance(out, str):
        return out
    if isinstance(out, list):
        for x in out:
            u = _first_url(x)
            if u:
                return u
    if isinstance(out, dict):
        for key in sorted(out, key=lambda k: 0 if "vocal" in str(k).lower() else 1):
            x = out[key]
            u = _first_url(x)
            if u:
                return u
    return None


def _run(job, slot, data, q):
    cfg = load()
    token = cfg["token"]
    try:
        s = cfg["slots"][slot]
        info = model_info(s["model"], token)
        work = Path(tempfile.mkdtemp(prefix="oc-cloud-"))
        job["dir"] = work
        values = {"prompt": q.get("prompt") or None, "aspect": q.get("aspect") or None, "duration": q.get("duration") or None}
        if slot in ("background", "face", "eyes"):
            src, out = work / "in.bin", work / "clip.mp4"
            src.write_bytes(data)
            job["state"] = "preparing"
            args = [FFMPEG, "-hide_banner", "-nostdin", "-y"]
            if q.get("ss"):
                args += ["-ss", q["ss"]]
            args += ["-i", str(src)]
            if q.get("t"):
                args += ["-t", q["t"]]
            args += ["-an", "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
            r = subprocess.run(args, capture_output=True, text=True, timeout=1800)
            if r.returncode or not out.exists():
                raise RuntimeError("Could not prepare the clip: " + (r.stderr or "")[-200:])
            job["state"] = "uploading"
            values["video"] = _upload(out, token, "video/mp4")
        elif slot in ("s2s", "isolate", "lipsync"):
            def audio_of(path, ss, t, name):
                outp = work / name
                a = [FFMPEG, "-hide_banner", "-nostdin", "-y"] + (["-ss", ss] if ss else []) + ["-i", str(path)] + (["-t", t] if t else []) + ["-vn", "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", str(outp)]
                r = subprocess.run(a, capture_output=True, text=True, timeout=1800)
                if r.returncode or not outp.exists():
                    raise RuntimeError("Could not prepare the sound: " + (r.stderr or "")[-200:])
                return outp
            src = work / "in.bin"
            src.write_bytes(data)
            aux = q.get("aux_path")
            job["state"] = "preparing"
            if slot == "lipsync":
                if not aux:
                    raise RuntimeError("Choose the sound to lip sync to.")
                vid = work / "clip.mp4"
                r = subprocess.run([FFMPEG, "-hide_banner", "-nostdin", "-y"] + (["-ss", q["ss"]] if q.get("ss") else []) + ["-i", str(src)] + (["-t", q["t"]] if q.get("t") else [])
                                   + ["-an", "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(vid)], capture_output=True, text=True, timeout=1800)
                if r.returncode or not vid.exists():
                    raise RuntimeError("Could not prepare the clip: " + (r.stderr or "")[-200:])
                aud = audio_of(aux, q.get("ass"), q.get("at") or q.get("t"), "audio.wav")
                job["state"] = "uploading"
                values["video"] = _upload(vid, token, "video/mp4")
                values["audio"] = _upload(aud, token, "audio/wav")
            else:
                aud = audio_of(src, q.get("ss"), q.get("t"), "audio.wav")
                job["state"] = "uploading"
                values["audio"] = _upload(aud, token, "audio/wav")
                if slot == "s2s":
                    if not aux:
                        raise RuntimeError("Choose the target voice (a voice with samples, or a reference recording).")
                    values["ref"] = _upload(audio_of(aux, None, "60", "ref.wav"), token, "audio/wav")
        elif slot == "image2video":
            img = work / "start.png"
            img.write_bytes(data)
            job["state"] = "uploading"
            values["image"] = _upload(img, token, "image/png")
        inp = build_input(info, slot, values, s.get("extra"))
        job["state"] = "starting"
        p = _req("POST", "/v1/predictions", token, {"version": info["version"], "input": inp})
        job["cancel"] = (p.get("urls") or {}).get("cancel")
        deadline = time.time() + 3600
        while p.get("status") not in ("succeeded", "failed", "canceled"):
            if job.get("cancelled"):
                raise RuntimeError("Cancelled.")
            if time.time() > deadline:
                raise RuntimeError("Replicate took over an hour.")
            time.sleep(3)
            p = _req("GET", (p.get("urls") or {}).get("get") or f"/v1/predictions/{p['id']}", token)
            job["state"] = "processing" if p.get("status") == "processing" else "starting"
            job["logs"] = (p.get("logs") or "")[-300:]
        if p["status"] != "succeeded":
            raise RuntimeError(str(p.get("error") or "Replicate cancelled the job.")[:400])
        url = _first_url(p.get("output"))
        if not url:
            raise RuntimeError("The model finished but returned no video file.")
        job["state"] = "downloading"
        blob = _req("GET", url, token, raw=True, timeout=1800)
        res = work / "result.bin"
        res.write_bytes(blob)
        job["file"], job["ctype"] = res, mimetypes.guess_type(url.split("?")[0])[0] or "video/mp4"
        job["state"] = "succeeded"
    except Exception as e:
        job["state"], job["error"] = "failed", str(e)


def _gc():
    now = time.time()
    for k in [k for k, (t0, f) in AUX.items() if now - t0 > 7200]:
        shutil.rmtree(AUX.pop(k)[1].parent, ignore_errors=True)
    for k in [k for k, j in JOBS.items() if now - j["t"] > 7200]:
        d = JOBS.pop(k).get("dir")
        if d:
            shutil.rmtree(d, ignore_errors=True)


def handle(method, path, q, read_body):
    """Returns (status, content type, bytes). q is parse_qs output."""
    g = lambda k, d="": (q.get(k) or [d])[0]
    j = lambda code, o: (code, "application/json", json.dumps(o).encode())
    try:
        if path == "/api/cloud/config" and method == "GET":
            return j(200, public_config())
        if path == "/api/cloud/config" and method == "POST":
            b = json.loads(read_body(100_000))
            save(token=b.get("token"), slots=b.get("slots"))
            return j(200, public_config())
        cfg = load()
        if not cfg["token"]:
            return j(400, {"error": "Add your Replicate API key first (AI → AI Cloud tools → Settings)."})
        if path == "/api/cloud/check" and method == "GET":
            slot = g("slot")
            if slot not in cfg["slots"]:
                return j(400, {"error": "unknown feature"})
            info = model_info(cfg["slots"][slot]["model"], cfg["token"])
            return j(200, {"ok": True, "model": info["slug"], "description": info["description"][:200], "inputs": {k: v.get("type", "") + (" (file)" if v.get("format") == "uri" else "") for k, v in info["props"].items()}})
        if path == "/api/cloud/aux" and method == "POST":
            data = read_body(MAX_UPLOAD)
            d = Path(tempfile.mkdtemp(prefix="oc-aux-"))
            f = d / "aux.bin"
            f.write_bytes(data)
            aid = uuid.uuid4().hex[:12]
            AUX[aid] = (time.time(), f)
            return j(200, {"id": aid})
        if path == "/api/cloud/start" and method == "POST":
            slot = g("slot")
            if slot not in cfg["slots"]:
                return j(400, {"error": "unknown feature"})
            data = read_body(MAX_UPLOAD) if slot != "video" else b""
            _gc()
            jid = uuid.uuid4().hex[:12]
            job = JOBS[jid] = {"state": "queued", "t": time.time(), "slot": slot}
            qq = {k: g(k) for k in ("prompt", "aspect", "duration", "ss", "t", "ass", "at")}
            if g("aux") in AUX:
                qq["aux_path"] = AUX[g("aux")][1]
            elif g("ref_voice"):   # a voice from AI Voice Studio: its first saved sample is the target voice
                from voice import db
                rows = [r["path"] for r in db.q("SELECT path FROM samples WHERE voice_id=? ORDER BY created_at", (g("ref_voice"),)) if r["path"] and Path(r["path"]).exists()]
                if not rows:
                    return j(400, {"error": "That voice has no samples."})
                qq["aux_path"] = rows[0]
            threading.Thread(target=_run, args=(job, slot, data, qq), daemon=True).start()
            return j(200, {"id": jid})
        if path == "/api/cloud/status" and method == "GET":
            job = JOBS.get(g("id"))
            if not job:
                return j(404, {"error": "unknown job"})
            return j(200, {"state": job["state"], "error": job.get("error"), "logs": job.get("logs", "")})
        if path == "/api/cloud/result" and method == "GET":
            job = JOBS.get(g("id"))
            if not job or job["state"] != "succeeded":
                return j(404, {"error": "no result"})
            return 200, job["ctype"], job["file"].read_bytes()
        if path == "/api/cloud/cancel" and method == "POST":
            job = JOBS.get(g("id"))
            if job:
                job["cancelled"] = True
                if job.get("cancel"):
                    try:
                        _req("POST", job["cancel"], cfg["token"])
                    except Exception:
                        pass
            return j(200, {"ok": True})
        return j(404, {"error": "not found"})
    except Exception as e:
        return j(500, {"error": str(e)})
