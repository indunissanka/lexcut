"""Transcribe Sinhala speech: 16 kHz mono 16-bit PCM on stdin, segments as JSON on stdout.

Runs in the voice environment (~/.opencut/venv-tts) with a Whisper model fine-tuned on Sinhala
(SinhaSpeech/whisper-small-sinhala-run12-best, Apache-2.0). Whisper large-v3 loops on Sinhala; this one does not.
Usage: python sinhala_asr_worker.py MODEL_REPO < audio.pcm
"""
import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")
proto = sys.stdout
sys.stdout = sys.stderr   # keep stdout clean for the JSON result

import numpy as np
import torch
from transformers import pipeline

repo = sys.argv[1]
audio = np.frombuffer(sys.stdin.buffer.read(), dtype=np.int16).astype(np.float32) / 32768.0
dev = os.environ.get("LEXCUT_ASR_DEVICE") or ("mps" if torch.backends.mps.is_available() else "cpu")
asr = pipeline("automatic-speech-recognition", model=repo, device=dev,
               torch_dtype=torch.float16 if dev == "mps" else torch.float32)
gen = {"language": "sinhala", "task": "transcribe", "no_repeat_ngram_size": 4, "max_new_tokens": 200}
SR = 16000


def phrases(a, max_len=12.0, min_pause=0.3):
    """Split at pauses: 30 ms frames, a frame is speech when louder than the noise floor + 12 dB.
    Fine-tuned Whisper models lose timestamp prediction, so each phrase gives its own timestamps."""
    hop = int(0.03 * SR)
    n = len(a) // hop
    if n == 0:
        return []
    rms = np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-10)
    db = 20 * np.log10(rms)
    floor = np.percentile(db, 10)
    speech = db > max(floor + 12, -55)
    out, i = [], 0
    while i < n:
        if not speech[i]:
            i += 1
            continue
        j, quiet = i, 0
        while j < n and (speech[j] or quiet * 0.03 < min_pause) and (j - i) * 0.03 < max_len:
            quiet = 0 if speech[j] else quiet + 1
            j += 1
        out.append((max(0, i - 3) * hop, min(n, j - quiet + 3) * hop))
        i = j
    merged = []                              # join tiny phrases with their neighbour so Whisper has context
    for s0, e0 in out:
        if merged and (e0 - merged[-1][0]) / SR <= max_len and ((e0 - s0) / SR < 1.5 or (merged[-1][1] - merged[-1][0]) / SR < 1.5):
            merged[-1] = (merged[-1][0], e0)
        else:
            merged.append((s0, e0))
    return merged


spans = phrases(audio)
texts = asr([audio[s:e] for s, e in spans], batch_size=4, generate_kwargs=gen) if spans else []
segs = [{"start": s / SR, "end": e / SR, "text": t["text"].replace("\ufffd", "").strip()} for (s, e), t in zip(spans, texts)]
dur = len(audio) / 16000
for s in segs:
    if s["end"] is None or s["end"] <= s["start"]:
        s["end"] = min(dur, s["start"] + 5)
proto.write(json.dumps([s for s in segs if s["text"]]) + "\n")
