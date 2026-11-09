"""Transcribe 16 kHz mono 16-bit PCM from stdin; print segments as JSON.

Apple Silicon uses mlx-whisper. Windows and Linux use faster-whisper (an NVIDIA GPU with CUDA if there is one, else the CPU).

Usage: .venv/bin/python whisper_worker.py MODEL [LANGUAGE_CODE] < audio.pcm
"""
import json
import os
import sys

import numpy as np

repo = sys.argv[1]
lang = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
audio = np.frombuffer(sys.stdin.buffer.read(), dtype=np.int16).astype(np.float32) / 32768.0

try:
    import mlx_whisper
except ImportError:
    mlx_whisper = None

if mlx_whisper is not None:
    # condition_on_previous_text=False stops one bad passage from derailing the rest (common on low-resource languages)
    res = mlx_whisper.transcribe(audio, path_or_hf_repo=repo, language=lang, condition_on_previous_text=False, verbose=None)
    segs = res["segments"]
else:
    import ctranslate2
    from faster_whisper import WhisperModel
    dev = os.environ.get("LEXCUT_ASR_DEVICE") or ("cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu")
    try:
        model = WhisperModel(repo, device=dev, compute_type="float16" if dev == "cuda" else "int8")
    except Exception:   # CUDA found but its libraries (cuBLAS/cuDNN) are missing: fall back to the CPU
        model = WhisperModel(repo, device="cpu", compute_type="int8")
    it, _ = model.transcribe(audio, language=lang, condition_on_previous_text=False, vad_filter=True)
    segs = [{"start": s.start, "end": s.end, "text": s.text} for s in it]

print(json.dumps([{"start": s["start"], "end": s["end"], "text": s["text"].strip()} for s in segs if s["text"].strip()]))
