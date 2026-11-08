"""Sinhala speech for Voice Studio. Runs inside ~/.opencut/venv-tts. JSON lines on stdin/stdout like xtts_worker.py.

1. Piper (models/piper/si_LK-sinhala-medium.onnx, MIT, trained on OpenSLR 30) speaks the Sinhala text.
2. OpenVoice v2 voice conversion (built into coqui-tts, MIT) changes that speech to sound like the voice's samples.
Both models are loaded once and kept in memory.
"""
import json
import os
import sys
import wave

proto = sys.stdout
sys.stdout = sys.stderr   # keep stdout clean for the protocol

PIPER_MODEL = os.environ["LEXCUT_PIPER_MODEL"]
_piper = None
_vc = None


def piper():
    global _piper
    if _piper is None:
        from piper import PiperVoice
        _piper = PiperVoice.load(PIPER_MODEL)
    return _piper


def vc():
    global _vc
    if _vc is None:
        from TTS.api import TTS
        _vc = TTS("voice_conversion_models/multilingual/multi-dataset/openvoice_v2").to("cpu")
    return _vc


def handle(m):
    if m["op"] != "synth":
        raise ValueError("unknown op")
    from piper import SynthesisConfig
    cfg = SynthesisConfig(length_scale=1.0 / max(0.5, float(m.get("speed", 1.0))))
    base = m["out"] + ".piper.wav" if m.get("samples") else m["out"]
    with wave.open(base, "wb") as w:
        piper().synthesize_wav(m["text"], w, syn_config=cfg)
    if m.get("samples"):
        try:
            vc().voice_conversion_to_file(source_wav=base, target_wav=m["samples"], file_path=m["out"])
        finally:
            os.unlink(base)
    return {}


for line in sys.stdin:
    try:
        res = {"ok": True, **handle(json.loads(line))}
    except Exception as e:
        res = {"ok": False, "error": f"{type(e).__name__}: {e}"[:400]}
    proto.write(json.dumps(res) + "\n")
    proto.flush()
