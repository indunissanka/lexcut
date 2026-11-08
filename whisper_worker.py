"""Transcribe 16 kHz mono 16-bit PCM from stdin with mlx-whisper; print segments as JSON.

Usage: .venv/bin/python whisper_worker.py MODEL_REPO [LANGUAGE_CODE] < audio.pcm
"""
import json
import sys

import numpy as np
import mlx_whisper

repo = sys.argv[1]
lang = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
audio = np.frombuffer(sys.stdin.buffer.read(), dtype=np.int16).astype(np.float32) / 32768.0
# condition_on_previous_text=False stops one bad passage from derailing the rest (common on low-resource languages)
res = mlx_whisper.transcribe(audio, path_or_hf_repo=repo, language=lang, condition_on_previous_text=False, verbose=None)
print(json.dumps([{"start": s["start"], "end": s["end"], "text": s["text"].strip()} for s in res["segments"] if s["text"].strip()]))
