"""Coqui XTTS-v2 running locally in its own Python environment (~/.opencut/venv-tts).

A persistent worker process keeps the model loaded between sentences. Cancelling kills the worker
(it restarts on the next request), so cancel is immediate and safe.
"""
import json
import os
import subprocess
import threading
from pathlib import Path

from platform_util import venv_python

from .. import config
from .base import STYLES, Cancelled, VoiceEngine

VENV_PY = venv_python(os.environ.get("LEXCUT_TTS_VENV") or config.HOME / "venv-tts")
WORKER = Path(__file__).resolve().parent.parent / "xtts_worker.py"
SI_WORKER = Path(__file__).resolve().parent.parent / "sinhala_worker.py"
PIPER_MODEL = Path(__file__).resolve().parents[2] / "models" / "piper" / "si_LK-sinhala-medium.onnx"
MODEL_HOME = Path(__file__).resolve().parents[2] / "models" / "tts"

LANGS = [
    ("en", "English", ""), ("zh-cn", "Simplified Chinese", "Spoken Mandarin"),
    ("zh-tw", "Traditional Chinese", "Spoken Mandarin; text is converted to Simplified internally"),
    ("ja", "Japanese", ""), ("ko", "Korean", ""), ("ar", "Arabic", ""),
    ("es", "Spanish", ""), ("fr", "French", ""), ("de", "German", ""), ("it", "Italian", ""),
    ("pt", "Portuguese", ""), ("pl", "Polish", ""), ("tr", "Turkish", ""), ("ru", "Russian", ""),
    ("nl", "Dutch", ""), ("cs", "Czech", ""), ("hu", "Hungarian", ""), ("hi", "Hindi", ""),
    ("si", "Sinhala", "Piper voice converted to this voice"),
]
UNSUPPORTED = []


class XttsEngine(VoiceEngine):
    id = "xtts"
    name = "Coqui XTTS-v2 (local)"
    model = "xtts_v2"
    kind = "local"

    def __init__(self):
        self._proc = None
        self._lock = threading.Lock()      # one request at a time (single model instance)
        self._cancel = threading.Event()
        self._stderr_tail = []
        self._si = SinhalaVoice()

    def capabilities(self):
        installed = VENV_PY.exists()
        cfg = config.load()
        return {
            "id": self.id, "name": self.name, "model": self.model, "kind": self.kind,
            "installed": installed, "ready": installed and bool(cfg.get("license_accepted")),
            "license": {"name": "Coqui Public Model License (CPML)", "noncommercial": True, "accepted": bool(cfg.get("license_accepted")),
                        "url": "https://coqui.ai/cpml"},
            "languages": [{"code": c, "name": n, "note": note} for c, n, note in LANGS],
            "unsupported": UNSUPPORTED,
            "controls": {"speed": [0.6, 1.5], "pitch": True, "similarity": True, "emotion": "style-preset",
                         "gender": False, "pronunciation": True, "voice_conversion": False},
            "styles": {k: v["label"] for k, v in STYLES.items()},
            "style_defaults": {k: {"sentence_pause": v["sentence_pause"], "paragraph_pause": v["paragraph_pause"], "speed": v["speed"]} for k, v in STYLES.items()},
        }

    # ---- worker process ----
    def _start(self):
        if self._proc and self._proc.poll() is None:
            return
        if not VENV_PY.exists():
            raise RuntimeError("XTTS environment is missing (~/.opencut/venv-tts).")
        cfg = config.load()
        if not cfg.get("license_accepted"):
            raise RuntimeError("Accept the XTTS-v2 model license (non-commercial) in AI Voice Studio first.")
        env = {**os.environ, "TTS_HOME": str(MODEL_HOME), "COQUI_TOS_AGREED": "1",
               "OPENCUT_TTS_DEVICE": cfg.get("device", "auto"), "PYTORCH_ENABLE_MPS_FALLBACK": "1", "TOKENIZERS_PARALLELISM": "false"}
        self._proc = subprocess.Popen([str(VENV_PY), str(WORKER)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE, text=True, bufsize=1, env=env)
        self._stderr_tail = []
        def drain(p=self._proc):
            for line in p.stderr:
                self._stderr_tail = (self._stderr_tail + [line.rstrip()])[-12:]
        threading.Thread(target=drain, daemon=True).start()

    def _call(self, msg: dict, timeout=900):
        with self._lock:
            self._cancel.clear()
            self._start()
            p = self._proc
            timer = threading.Timer(timeout, p.kill)
            timer.start()
            try:
                p.stdin.write(json.dumps(msg) + "\n")
                p.stdin.flush()
                line = p.stdout.readline()
            except (BrokenPipeError, ValueError):
                line = ""
            finally:
                timer.cancel()
            if self._cancel.is_set():
                raise Cancelled()
            if not line:
                tail = " | ".join(self._stderr_tail[-4:])
                self._proc = None
                raise RuntimeError("Voice engine stopped unexpectedly. " + tail[-300:])
            res = json.loads(line)
            if not res.get("ok"):
                raise RuntimeError(res.get("error", "voice engine error"))
            return res

    def cancel(self):
        self._si.cancel()
        self._cancel.set()
        p = self._proc
        if p and p.poll() is None:
            p.kill()
        self._proc = None

    def prepare_voice(self, voice, sample_paths, workdir):
        self._call({"op": "prepare", "samples": [str(s) for s in sample_paths], "latents": str(self._latents(voice, workdir))})

    def _latents(self, voice, workdir):
        return Path(workdir) / "samples" / voice["id"] / f"latents_v{voice['version']}.pt"

    def synthesize(self, voice, req, out_path, workdir):
        if req["language"] == "si":
            return self._si.synthesize(voice, req, out_path, workdir)
        self._call({"op": "synth", "latents": str(self._latents(voice, workdir)), "text": req["text"], "language": req["language"],
                    "speed": req["speed"], "temperature": req["temperature"], "top_p": req.get("top_p", 0.85), "out": str(out_path)})

    def delete_voice(self, voice, workdir):
        pass  # latents live inside the voice's sample folder, which the API deletes


class SinhalaVoice:
    """Sinhala, which XTTS cannot speak: Piper speaks the text, then OpenVoice v2 converts it to the voice's own sound.
    Uses its own worker process (voice/sinhala_worker.py) in the same environment, so XTTS is not loaded for it."""

    def __init__(self):
        self._proc = None
        self._lock = threading.Lock()
        self._cancel = threading.Event()
        self._stderr_tail = []

    def _start(self):
        if self._proc and self._proc.poll() is None:
            return
        if not VENV_PY.exists():
            raise RuntimeError("The voice environment is missing (~/.opencut/venv-tts). Run ./install.sh.")
        if not PIPER_MODEL.exists():
            raise RuntimeError("The Sinhala voice model is missing (models/piper). Run ./install.sh.")
        env = {**os.environ, "TTS_HOME": str(MODEL_HOME), "COQUI_TOS_AGREED": "1", "LEXCUT_PIPER_MODEL": str(PIPER_MODEL),
               "PYTORCH_ENABLE_MPS_FALLBACK": "1", "TOKENIZERS_PARALLELISM": "false"}
        self._proc = subprocess.Popen([str(VENV_PY), str(SI_WORKER)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE, text=True, bufsize=1, env=env)
        self._stderr_tail = []
        def drain(p=self._proc):
            for line in p.stderr:
                self._stderr_tail = (self._stderr_tail + [line.rstrip()])[-12:]
        threading.Thread(target=drain, daemon=True).start()

    def synthesize(self, voice, req, out_path, workdir):
        folder = Path(workdir) / "samples" / voice["id"]
        samples = sorted(str(p) for p in folder.glob("*.wav") if not p.name.startswith("._"))
        if not samples:
            raise RuntimeError("This voice has no samples to copy the sound from.")
        msg = {"op": "synth", "text": req["text"], "speed": req["speed"], "samples": samples, "out": str(out_path)}
        with self._lock:
            self._cancel.clear()
            self._start()
            p = self._proc
            timer = threading.Timer(900, p.kill)
            timer.start()
            try:
                p.stdin.write(json.dumps(msg) + "\n")
                p.stdin.flush()
                line = p.stdout.readline()
            except (BrokenPipeError, ValueError):
                line = ""
            finally:
                timer.cancel()
            if self._cancel.is_set():
                raise Cancelled()
            if not line:
                self._proc = None
                raise RuntimeError("Sinhala voice engine stopped unexpectedly. " + " | ".join(self._stderr_tail[-4:])[-300:])
            res = json.loads(line)
            if not res.get("ok"):
                raise RuntimeError(res.get("error", "Sinhala voice error"))

    def cancel(self):
        self._cancel.set()
        p = self._proc
        if p and p.poll() is None:
            p.kill()
        self._proc = None
