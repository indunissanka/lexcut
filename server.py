"""LexCut server: serves the editor and relays AI requests to the local `claude` CLI,
so they run on your Claude Pro/Max login instead of an API key.

Usage: python3 server.py [port]
"""
import json
import os
import shutil
import subprocess
import sys
import secrets
import tempfile
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# Windows: run in Python's UTF-8 mode, so files, the claude CLI and the worker processes all use UTF-8
# (the default Windows code page cannot hold Sinhala, Chinese and other scripts).
if __name__ == "__main__" and os.name == "nt" and not sys.flags.utf8_mode:
    os.environ["PYTHONUTF8"] = "1"
    try:
        sys.exit(subprocess.call([sys.executable, "-X", "utf8", *sys.argv]))
    except KeyboardInterrupt:
        sys.exit(0)

sys.path.insert(0, str(Path(__file__).parent))
from voice import api as voice_api
import cloud
import voicetools
from platform_util import IS_MAC, venv_python, which

HERE = Path(__file__).parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
ALLOWED_HOSTS = {f"127.0.0.1:{PORT}", f"localhost:{PORT}"}
MAX_BODY = 1_000_000
MAX_VISION = 16_000_000  # a few dozen small JPEG frames as base64
MAX_AUDIO = 300_000_000  # 16 kHz 16-bit mono is about 115 MB per hour
VENV_PY = venv_python(HERE / ".venv")
# Apple Silicon uses mlx-whisper; Windows and Linux use faster-whisper (CPU, or an NVIDIA GPU with CUDA).
USE_MLX = IS_MAC and __import__("platform").machine() == "arm64"
WHISPER_MODELS = {"large-v3": "mlx-community/whisper-large-v3-mlx" if USE_MLX else "large-v3",
                  "large-v3-turbo": "mlx-community/whisper-large-v3-turbo" if USE_MLX else "large-v3-turbo",
                  "sinhala": "SinhaSpeech/whisper-small-sinhala-run12-best"}   # Whisper fine-tuned on Sinhala (Apache-2.0), runs in the voice environment


# ---- Bridge: lets an outside program (the MCP connector, opencut_mcp.py) drive the editor open in the browser.
# The page long-polls /api/bridge/next, runs each command and posts the answer to /api/bridge/result.
# Outside callers use POST /api/bridge/call with the token from ~/.opencut/bridge_token (never sent to the page).
BRIDGE_TOKEN_FILE = Path.home() / ".opencut" / "bridge_token"
BRIDGE = {"cv": threading.Condition(), "cmds": [], "results": {}, "seen": 0.0, "n": 0}


def bridge_token() -> str:
    if not BRIDGE_TOKEN_FILE.exists():
        BRIDGE_TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        BRIDGE_TOKEN_FILE.write_text(secrets.token_urlsafe(32))
        BRIDGE_TOKEN_FILE.chmod(0o600)
    return BRIDGE_TOKEN_FILE.read_text().strip()


def bridge_next(wait: float = 20.0):
    """Called by the page: the next queued command, or None after `wait` seconds."""
    end = time.time() + wait
    with BRIDGE["cv"]:
        while True:
            BRIDGE["seen"] = time.time()
            if BRIDGE["cmds"]:
                return BRIDGE["cmds"].pop(0)
            left = end - time.time()
            if left <= 0:
                return None
            BRIDGE["cv"].wait(min(left, 5))


def bridge_call(op: str, args: dict, timeout: float = 120.0) -> dict:
    with BRIDGE["cv"]:
        if time.time() - BRIDGE["seen"] > 40:
            raise RuntimeError("LexCut is not open in a browser tab (open http://localhost:%d/)." % PORT)
        BRIDGE["n"] += 1
        cid = BRIDGE["n"]
        BRIDGE["cmds"].append({"id": cid, "op": op, "args": args})
        BRIDGE["cv"].notify_all()
        end = time.time() + timeout
        while cid not in BRIDGE["results"]:
            left = end - time.time()
            if left <= 0:
                raise TimeoutError("The editor did not answer in time.")
            BRIDGE["cv"].wait(left)
        return BRIDGE["results"].pop(cid)


def find_claude():
    return which("claude")


def run_claude(system: str, prompt: str) -> str:
    exe = find_claude()
    if not exe:
        raise RuntimeError("The `claude` command was not found. Install Claude Code and run `claude` once to log in.")
    r = subprocess.run(
        [exe, "-p", "--system-prompt", system, "--tools", "", "--no-session-persistence"],
        input=prompt, capture_output=True, text=True, timeout=300, cwd=tempfile.gettempdir(),
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip()[:500] or "claude exited with an error (are you logged in?)")
    return r.stdout.strip()


def run_claude_vision(system: str, prompt: str, images: list) -> str:
    """Ask Claude about still frames. Each image is {"label": str, "b64": str, "mime": str}."""
    exe = find_claude()
    if not exe:
        raise RuntimeError("The `claude` command was not found. Install Claude Code and run `claude` once to log in.")
    content = []
    for im in images[:60]:
        if im.get("label"):
            content.append({"type": "text", "text": str(im["label"])})
        content.append({"type": "image", "source": {"type": "base64", "media_type": im.get("mime", "image/jpeg"), "data": im["b64"]}})
    content.append({"type": "text", "text": prompt})
    msg = json.dumps({"type": "user", "message": {"role": "user", "content": content}}) + "\n"
    r = subprocess.run(
        [exe, "-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
         "--system-prompt", system, "--tools", "", "--no-session-persistence"],
        input=msg, capture_output=True, text=True, timeout=300, cwd=tempfile.gettempdir(),
    )
    result = None
    for line in r.stdout.splitlines():
        try:
            o = json.loads(line)
        except ValueError:
            continue
        if o.get("type") == "result":
            result = o
    if not result or result.get("is_error"):
        raise RuntimeError(((result or {}).get("result") or r.stderr or r.stdout).strip()[:500] or "claude exited with an error (are you logged in?)")
    return str(result.get("result", "")).strip()


def run_whisper(pcm: bytes, model: str, lang: str):
    if model == "sinhala":
        if not TTS_PY.exists():
            raise RuntimeError("Sinhala transcription needs the voice environment (~/.opencut/venv-tts). Run the installer again.")
        r = subprocess.run([str(TTS_PY), str(HERE / "sinhala_asr_worker.py"), WHISPER_MODELS[model]],
                           input=pcm, capture_output=True, timeout=3 * 3600,
                           env={**os.environ, "HF_HUB_CACHE": str(HERE / "models" / "hub"), "PYTORCH_ENABLE_MPS_FALLBACK": "1"})
        if r.returncode != 0:
            raise RuntimeError(r.stderr.decode(errors="replace").strip()[-500:] or "Sinhala transcription failed")
        return json.loads(r.stdout.decode().strip().splitlines()[-1])
    if not VENV_PY.exists():
        raise RuntimeError("Whisper is not installed (missing .venv). Run the installer again.")
    r = subprocess.run([str(VENV_PY), str(HERE / "whisper_worker.py"), WHISPER_MODELS[model], lang],
                       input=pcm, capture_output=True, timeout=3 * 3600,
                       env={**os.environ, "HF_HOME": str(HERE / "models")})  # keep the 3 GB model on this drive
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode(errors="replace").strip()[-500:] or "whisper failed")
    return json.loads(r.stdout.decode().strip().splitlines()[-1])


def noise_floor_db(ffmpeg: str, src: Path) -> float:
    """Loudness of the background noise: the quietest 10% of 50 ms windows of the recording, in dBFS."""
    import array
    import math
    r = subprocess.run([ffmpeg, "-hide_banner", "-nostdin", "-loglevel", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                       capture_output=True, timeout=3600)
    a = array.array("h"); a.frombytes(r.stdout[: len(r.stdout) // 2 * 2])
    win, levels = 800, []
    for i in range(0, len(a) - win, win):
        ss = sum(x * x for x in a[i:i + win]) / win
        levels.append(10 * math.log10(ss / (32768.0 ** 2) + 1e-12))
    if not levels:
        return -45.0
    levels.sort()
    return max(-80.0, min(-20.0, levels[max(0, len(levels) // 10)]))


def audio_filter(preset: str, nf: float) -> str:
    nf = round(max(-80.0, min(-20.0, nf + 5)))   # a little above the measured floor removes the noise much more cleanly
    if preset == "denoise":   # rumble + steady background noise (hiss, fans, hum)
        return f"highpass=f=70,afftdn=nr=20:nf={nf}"
    # enhance: clean, warmer and clearer speech: noise reduction, a little mud cut, presence boost, gentle compression, even loudness
    return (f"highpass=f=80,afftdn=nr=20:nf={nf},equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1:g=3,"
            "acompressor=threshold=0.089:ratio=3:attack=15:release=250:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=11")


AUDIO_PRESETS = ("denoise", "enhance")


def run_audio_process(data: bytes, preset: str) -> bytes:
    """Clean up the sound of a media file with ffmpeg; returns a WAV with the same timing as the original."""
    from voice import media
    with tempfile.TemporaryDirectory() as d:
        src, dst = Path(d) / "in.bin", Path(d) / "out.wav"
        src.write_bytes(data)
        nf = noise_floor_db(media.FFMPEG, src)
        r = subprocess.run([media.FFMPEG, "-hide_banner", "-nostdin", "-y", "-i", str(src), "-vn", "-af", audio_filter(preset, nf),
                            "-c:a", "pcm_s16le", "-ar", "48000", str(dst)], capture_output=True, text=True, timeout=3600)
        if r.returncode != 0 or not dst.exists():
            raise RuntimeError((r.stderr or "ffmpeg failed").strip()[-400:])
        return dst.read_bytes()


EXPORT_FORMATS = {
    # fmt: (extension, mime, ffmpeg output args, has_video)
    "mp4-h264": ("mp4", "video/mp4", ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"], True),
    "mp4-h265": ("mp4", "video/mp4", ["-c:v", "libx265", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-tag:v", "hvc1", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"], True),
    "mov": ("mov", "video/quicktime", ["-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le", "-c:a", "pcm_s16le"], True),
    "webm": ("webm", "video/webm", ["-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus"], True),
    "avi": ("avi", "video/x-msvideo", ["-c:v", "mpeg4", "-q:v", "3", "-c:a", "libmp3lame", "-q:a", "2"], True),
    "mkv": ("mkv", "video/x-matroska", ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"], True),
    "gif": ("gif", "image/gif", ["-an", "-filter_complex", "[0:v]{PRE}fps=15,scale='min(640,iw)':-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse", "-loop", "0"], True),
    "mp3": ("mp3", "audio/mpeg", ["-vn", "-c:a", "libmp3lame", "-b:a", "256k"], False),
    "wav": ("wav", "audio/wav", ["-vn", "-c:a", "pcm_s16le", "-ar", "48000"], False),
}


def run_export(data: bytes, fmt: str, w: int = 0, h: int = 0, fps: int = 0) -> tuple:
    """Convert a browser-recorded WebM into the requested export format with ffmpeg.
    w/h (> 0): scale to fit inside w x h and pad with black; fps (> 0): resample the frame rate."""
    from voice import media
    ext, mime, args, has_video = EXPORT_FORMATS[fmt]
    pre = []
    if has_video:
        if w > 0 and h > 0:
            w, h = w - w % 2, h - h % 2
            pre.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1")
        if fps > 0 and fmt != "gif":
            pre.append(f"fps={fps}")
    if any("{PRE}" in a for a in args):
        args = [a.replace("{PRE}", "".join(p + "," for p in pre)) for a in args]
    elif pre:
        args = ["-vf", ",".join(pre), *args]
    with tempfile.TemporaryDirectory() as d:
        src, dst = Path(d) / "in.webm", Path(d) / f"out.{ext}"
        src.write_bytes(data)
        # MediaRecorder WebM has no duration/seek info; regenerate timestamps while decoding.
        r = subprocess.run([media.FFMPEG, "-hide_banner", "-nostdin", "-y", "-fflags", "+genpts", "-i", str(src), *args, str(dst)],
                           capture_output=True, text=True, timeout=7200)
        if r.returncode != 0 or not dst.exists():
            raise RuntimeError((r.stderr or "ffmpeg failed").strip()[-400:])
        return dst.read_bytes(), mime


def run_analyze(data: bytes, kind: str, q: dict) -> dict:
    """Local ffmpeg analysis of a media file: silences, scene cuts, or loudness per second. Times are in seconds of the file."""
    import re
    from voice import media
    ff = media.FFMPEG
    with tempfile.TemporaryDirectory() as d:
        src = Path(d) / "in.bin"
        src.write_bytes(data)
        base = [ff, "-hide_banner", "-nostdin", "-i", str(src)]
        if kind == "silence":
            floor = noise_floor_db(ff, src)
            db = float(q.get("db", [0])[0]) or max(-55.0, min(-28.0, (floor if floor is not None else -60.0) + 10))
            mind = max(0.1, float(q.get("min", [0.5])[0]))
            r = subprocess.run(base + ["-vn", "-af", f"silencedetect=noise={db}dB:d={mind}", "-f", "null", "-"], capture_output=True, text=True, timeout=3600)
            out, start = [], None
            for line in r.stderr.splitlines():
                m = re.search(r"silence_start: (-?[\d.]+)", line)
                if m:
                    start = max(0.0, float(m.group(1)))
                m = re.search(r"silence_end: ([\d.]+)", line)
                if m and start is not None:
                    out.append([start, float(m.group(1))]); start = None
            if start is not None:   # silent until the end of the file
                m = re.findall(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
                if m:
                    h, mi, se = m[0]; out.append([start, int(h) * 3600 + int(mi) * 60 + float(se)])
            return {"silences": out, "threshold_db": db}
        if kind == "scenes":
            thr = float(q.get("t", [0.3])[0])
            r = subprocess.run(base + ["-an", "-vf", f"scale=320:-2,select='gt(scene,{thr})',showinfo", "-f", "null", "-"], capture_output=True, text=True, timeout=3600)
            return {"cuts": [float(x) for x in re.findall(r"pts_time:([\d.]+)", r.stderr)]}
        if kind == "energy":
            r = subprocess.run(base + ["-vn", "-af", "aresample=8000,asetnsamples=n=8000:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-", "-f", "null", "-"], capture_output=True, text=True, timeout=3600)
            t, out = None, []
            for line in r.stdout.splitlines():
                m = re.search(r"pts_time:([\d.]+)", line)
                if m:
                    t = float(m.group(1))
                m = re.search(r"RMS_level=(-?[\d.]+|-inf)", line)
                if m and t is not None:
                    out.append([t, -90.0 if m.group(1) == "-inf" else max(-90.0, float(m.group(1)))])
            return {"levels": out}
    raise ValueError("unknown analysis")


TTS_PY = venv_python(os.environ.get("LEXCUT_TTS_VENV") or Path.home() / ".opencut" / "venv-tts")


def enrolled_voices():
    """{voice name: [sample wav paths]} from AI Voice Studio, so detected people can be named after saved voices."""
    try:
        from voice import db
        out = {}
        for v in db.q("SELECT id,name FROM voices ORDER BY name"):
            files = [r["path"] for r in db.q("SELECT path FROM samples WHERE voice_id=?", (v["id"],)) if r["path"] and Path(r["path"]).exists()]
            if files:
                out[v["name"]] = files
        return out
    except Exception:
        return {}


def prints_path():
    from voice import config
    return config.data_dir() / "speaker_prints.json"


def load_prints():
    try:
        return json.loads(prints_path().read_text())
    except Exception:
        return {}


def remember_print(name: str, vec: list):
    """Keep a voice print the user confirmed (Who is who), so later videos on the same mic match it."""
    if not isinstance(name, str) or not name.strip() or len(name) > 60 or not isinstance(vec, list) or len(vec) != 256:
        raise ValueError("bad voice print")
    vec = [float(x) for x in vec]
    data = load_prints()
    data.setdefault(name.strip(), []).append(vec)
    data[name.strip()] = data[name.strip()][-12:]      # latest 12 per person
    p = prints_path(); p.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    p.write_text(json.dumps(data)); p.chmod(0o600)
    return len(data[name.strip()])


def run_diarize(pcm: bytes, segs: list, speakers: int):
    """Label who speaks each segment. Uses the librosa/scikit-learn environment made for the voice studio."""
    if not TTS_PY.exists():
        raise RuntimeError("Speaker detection needs the voice environment (~/.opencut/venv-tts), which is missing.")
    with tempfile.TemporaryDirectory() as d:
        (Path(d) / "a.pcm").write_bytes(pcm)
        (Path(d) / "s.json").write_text(json.dumps([{"start": float(s["start"]), "end": float(s["end"])} for s in segs]))
        (Path(d) / "v.json").write_text(json.dumps({"voices": enrolled_voices(), "prints": load_prints()}))
        r = subprocess.run([str(TTS_PY), str(HERE / "diarize_worker.py"), str(Path(d) / "a.pcm"), str(Path(d) / "s.json"), str(speakers), str(Path(d) / "v.json")],
                           capture_output=True, text=True, timeout=900, cwd=d)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip()[-400:] or "speaker detection failed")
    return json.loads(r.stdout.strip().splitlines()[-1])


class Handler(SimpleHTTPRequestHandler):
    # Fixed types: on Windows the registry can map .js to text/plain, and the browser then refuses the module scripts.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
                      ".html": "text/html", ".json": "application/json", ".svg": "image/svg+xml", ".wasm": "application/wasm"}

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(HERE), **kw)

    def _reply(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _allowed(self):
        # Only this page may use the subscription: reject other sites (CSRF) and DNS-rebinding hosts.
        origin = self.headers.get("Origin")
        return self.headers.get("Host") in ALLOWED_HOSTS and not (origin and origin.split("//")[-1] not in ALLOWED_HOSTS)

    def _voice(self, method, url):
        if not self._allowed():
            return self._reply(403, {"error": "forbidden"})
        def read_body(limit):
            n = int(self.headers.get("Content-Length", 0))
            if n > limit:
                raise ValueError("Request too large.")
            return self.rfile.read(n)
        code, ctype, body = voice_api.handle(method, url.path, parse_qs(url.query), read_body)
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _vt(self, method, url):
        if not self._allowed():
            return self._reply(403, {"error": "forbidden"})
        q = parse_qs(url.query)
        g = lambda k, d="": (q.get(k) or [d])[0]
        try:
            if url.path == "/api/vt/voices" and method == "GET":
                return self._reply(200, {"voices": voicetools.list_voices(), "tones": list(voicetools.TONES)})
            if url.path == "/api/vt/speak" and method == "POST":
                n = int(self.headers.get("Content-Length", 0))
                if n > 100_000:
                    return self._reply(413, {"error": "text too long"})
                wav = voicetools.speak(g("voice"), self.rfile.read(n).decode("utf-8", "replace"), float(g("speed", "1")), float(g("pitch", "0")), g("tone", "neutral"))
                self.send_response(200)
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(wav)))
                self.end_headers()
                self.wfile.write(wav)
                return
        except ValueError as e:
            return self._reply(400, {"error": str(e)})
        except Exception as e:
            return self._reply(500, {"error": str(e)})
        self._reply(404, {"error": "not found"})

    def _cloud(self, method, url):
        if not self._allowed():
            return self._reply(403, {"error": "forbidden"})
        def read_body(limit):
            n = int(self.headers.get("Content-Length", 0))
            if n > limit:
                raise ValueError("Request too large.")
            return self.rfile.read(n)
        code, ctype, body = cloud.handle(method, url.path, parse_qs(url.query), read_body)
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_DELETE(self):
        url = urlparse(self.path)
        if url.path.startswith("/api/voice/"):
            return self._voice("DELETE", url)
        self._reply(404, {"error": "not found"})

    def do_POST(self):
        origin = self.headers.get("Origin")
        if not self._allowed():
            return self._reply(403, {"error": "forbidden"})
        url = urlparse(self.path)
        if url.path.startswith("/api/vt/"):
            return self._vt("POST", url)
        if url.path.startswith("/api/cloud/"):
            return self._cloud("POST", url)
        if url.path.startswith("/api/voice/"):
            return self._voice("POST", url)
        if url.path == "/api/transcribe":
            return self._transcribe(parse_qs(url.query))
        if url.path == "/api/analyze":
            try:
                kind = parse_qs(url.query).get("kind", [""])[0]
                n = int(self.headers.get("Content-Length", 0))
                if n > 800_000_000:
                    return self._reply(413, {"error": "file too large"})
                return self._reply(200, run_analyze(self.rfile.read(n), kind, parse_qs(url.query)))
            except subprocess.TimeoutExpired:
                return self._reply(504, {"error": "Analysis took too long."})
            except Exception as e:
                return self._reply(500, {"error": str(e)})
        if url.path == "/api/audio/process":
            try:
                preset = parse_qs(url.query).get("preset", [""])[0]
                if preset not in AUDIO_PRESETS:
                    return self._reply(400, {"error": "unknown preset"})
                n = int(self.headers.get("Content-Length", 0))
                if n > 800_000_000:
                    return self._reply(413, {"error": "file too large"})
                body = run_audio_process(self.rfile.read(n), preset)
                self.send_response(200)
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            except subprocess.TimeoutExpired:
                return self._reply(504, {"error": "Processing took too long."})
            except Exception as e:
                return self._reply(500, {"error": str(e)})
        if url.path == "/api/bridge/result":   # from the page
            try:
                b = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
                with BRIDGE["cv"]:
                    BRIDGE["results"][int(b["id"])] = {"ok": bool(b.get("ok")), "result": b.get("result"), "error": b.get("error")}
                    BRIDGE["cv"].notify_all()
                return self._reply(200, {"ok": True})
            except Exception as e:
                return self._reply(400, {"error": str(e)})
        if url.path == "/api/bridge/call":   # from the MCP connector: token required, browsers (which send Origin) refused
            if origin or not secrets.compare_digest(self.headers.get("X-OpenCut-Token", ""), bridge_token()):
                return self._reply(403, {"error": "forbidden"})
            try:
                b = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
                return self._reply(200, bridge_call(str(b["op"]), b.get("args") or {}))
            except Exception as e:
                return self._reply(500, {"ok": False, "error": str(e)})
        if url.path == "/api/export":
            try:
                fmt = parse_qs(url.query).get("fmt", [""])[0]
                if fmt not in EXPORT_FORMATS:
                    return self._reply(400, {"error": "unknown format"})
                n = int(self.headers.get("Content-Length", 0))
                if n > 2_000_000_000:
                    return self._reply(413, {"error": "recording too large"})
                q = parse_qs(url.query)
                dim = lambda k, hi: max(0, min(hi, int(q.get(k, ["0"])[0] or 0)))
                body, mime = run_export(self.rfile.read(n), fmt, dim("w", 7680), dim("h", 7680), dim("fps", 120))
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            except subprocess.TimeoutExpired:
                return self._reply(504, {"error": "Conversion took too long."})
            except Exception as e:
                return self._reply(500, {"error": str(e)})
        if url.path == "/api/diarize/remember":
            try:
                n = int(self.headers.get("Content-Length", 0))
                if n > 20000:
                    return self._reply(413, {"error": "request too large"})
                b = json.loads(self.rfile.read(n))
                return self._reply(200, {"saved": remember_print(b.get("name"), b.get("print"))})
            except Exception as e:
                return self._reply(400, {"error": str(e)})
        if url.path == "/api/diarize":
            return self._diarize(parse_qs(url.query))
        if url.path == "/api/vision":
            try:
                n = int(self.headers.get("Content-Length", 0))
                if n > MAX_VISION:
                    return self._reply(413, {"error": "request too large"})
                data = json.loads(self.rfile.read(n))
                text = run_claude_vision(str(data["system"]), str(data["prompt"]), list(data["images"]))
                return self._reply(200, {"text": text})
            except subprocess.TimeoutExpired:
                return self._reply(504, {"error": "Claude took too long (over 5 minutes)."})
            except Exception as e:
                return self._reply(500, {"error": str(e)})
        if url.path != "/api/claude":
            return self._reply(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > MAX_BODY:
                return self._reply(413, {"error": "request too large"})
            data = json.loads(self.rfile.read(n))
            text = run_claude(str(data["system"]), str(data["prompt"]))
            self._reply(200, {"text": text})
        except subprocess.TimeoutExpired:
            self._reply(504, {"error": "Claude took too long (over 5 minutes)."})
        except Exception as e:
            self._reply(500, {"error": str(e)})

    def _diarize(self, q):
        # Body: one JSON line [{"start","end"},...] followed by 16 kHz mono 16-bit PCM.
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > MAX_AUDIO:
                return self._reply(413, {"error": "audio too long"})
            body = self.rfile.read(n)
            head, _, pcm = body.partition(b"\n")
            segs = json.loads(head)
            k = int((q.get("speakers", ["0"])[0]) or 0)
            if not isinstance(segs, list) or not 0 <= k <= 6:
                return self._reply(400, {"error": "bad request"})
            self._reply(200, run_diarize(pcm, segs, k))
        except subprocess.TimeoutExpired:
            self._reply(504, {"error": "Speaker detection took too long."})
        except Exception as e:
            self._reply(500, {"error": str(e)})

    def _transcribe(self, q):
        try:
            model = q.get("model", ["large-v3"])[0]
            lang = q.get("lang", [""])[0]
            if model not in WHISPER_MODELS or not (lang == "" or (lang.isalpha() and len(lang) <= 3)):
                return self._reply(400, {"error": "bad model or language"})
            n = int(self.headers.get("Content-Length", 0))
            if n > MAX_AUDIO:
                return self._reply(413, {"error": "audio too long"})
            self._reply(200, {"segments": run_whisper(self.rfile.read(n), model, lang)})
        except Exception as e:
            self._reply(500, {"error": str(e)})

    def do_GET(self):
        url = urlparse(self.path)
        if url.path.startswith("/api/vt/"):
            return self._vt("GET", url)
        if url.path.startswith("/api/cloud/"):
            return self._cloud("GET", url)
        if url.path.startswith("/api/voice/"):
            return self._voice("GET", url)
        if url.path == "/api/bridge/next":
            if not self._allowed():
                return self._reply(403, {"error": "forbidden"})
            cmd = bridge_next()
            if cmd is None:
                self.send_response(204)
                self.end_headers()
                return
            return self._reply(200, cmd)
        if url.path == "/api/status":
            return self._reply(200, {"whisper": VENV_PY.exists(), "speakers": TTS_PY.exists(), "sinhala": TTS_PY.exists()})
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    bridge_token()
    print(f"LexCut on http://127.0.0.1:{PORT}  (claude: {find_claude() or 'NOT FOUND'})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
