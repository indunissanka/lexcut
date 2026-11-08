"""Runs inside ~/.opencut/venv-tts. JSON lines on stdin/stdout; all library noise goes to stderr."""
import json
import os
import sys

proto = sys.stdout
sys.stdout = sys.stderr   # keep stdout clean for the protocol

import torch
from TTS.api import TTS

dev = os.environ.get("OPENCUT_TTS_DEVICE", "auto")
if dev == "auto":
    dev = "cpu"   # measured: CPU is as fast or faster than MPS for sentence-sized requests and avoids MPS op gaps
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
tts.to(dev)
model = tts.synthesizer.tts_model

try:
    from opencc import OpenCC
    t2s = OpenCC("t2s")
except Exception:
    t2s = None

_lat_cache = {}


def latents(path):
    if path not in _lat_cache:
        d = torch.load(path, map_location=dev)
        _lat_cache.clear()
        _lat_cache[path] = (d["gpt"], d["spk"])
    return _lat_cache[path]


def handle(m):
    if m["op"] == "prepare":
        gpt, spk = model.get_conditioning_latents(audio_path=m["samples"], gpt_cond_len=30, gpt_cond_chunk_len=4, max_ref_length=60)
        os.makedirs(os.path.dirname(m["latents"]), exist_ok=True)
        torch.save({"gpt": gpt.cpu(), "spk": spk.cpu()}, m["latents"])
        _lat_cache.pop(m["latents"], None)
        return {}
    if m["op"] == "synth":
        gpt, spk = latents(m["latents"])
        lang, text = m["language"], m["text"]
        if lang == "zh-tw":
            lang = "zh-cn"
            if t2s:
                text = t2s.convert(text)
        out = model.inference(text, lang, gpt, spk, temperature=m["temperature"], top_p=m["top_p"], speed=m["speed"], enable_text_splitting=True)
        import soundfile as sf
        wav = out["wav"]
        wav = wav.cpu().numpy() if hasattr(wav, "cpu") else wav
        sf.write(m["out"], wav, 24000, subtype="PCM_16")
        return {}
    raise ValueError("unknown op")


for line in sys.stdin:
    try:
        res = {"ok": True, **handle(json.loads(line))}
    except Exception as e:
        res = {"ok": False, "error": f"{type(e).__name__}: {e}"[:400]}
    proto.write(json.dumps(res) + "\n")
    proto.flush()
