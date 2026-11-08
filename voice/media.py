"""ffmpeg helpers: sample conversion, noise reduction, quality analysis, pitch/fit post-processing, tagging."""
import re
import shutil
import subprocess
from pathlib import Path

FFMPEG = shutil.which("ffmpeg", path="/opt/homebrew/bin:/usr/local/bin:/usr/bin") or "ffmpeg"
FFPROBE = shutil.which("ffprobe", path="/opt/homebrew/bin:/usr/local/bin:/usr/bin") or "ffprobe"


def _run(args, timeout=600):
    r = subprocess.run([FFMPEG, "-hide_banner", "-nostdin", *args], capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg failed: " + r.stderr.strip()[-400:])
    return r.stderr


def duration(path) -> float:
    r = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True, timeout=60)
    try:
        return float(r.stdout.strip())
    except ValueError:
        raise RuntimeError("Could not read this audio file.")


def convert_sample(src, dst, denoise=False):
    """Any uploaded/recorded audio -> mono 22.05 kHz 16-bit WAV (what XTTS conditions on)."""
    af = ["highpass=f=70"]
    if denoise:
        af += ["afftdn=nr=14:nf=-30:tn=1"]
    af += ["loudnorm=I=-20:TP=-2:LRA=11"]
    _run(["-y", "-i", str(src), "-vn", "-ac", "1", "-ar", "22050", "-af", ",".join(af), "-c:a", "pcm_s16le", str(dst)])


def analyze_quality(path) -> dict:
    """Heuristic suitability check for a voice sample. Returns score 0-100, label and tips."""
    dur = duration(path)
    err = _run(["-i", str(path), "-af", "volumedetect,silencedetect=n=-40dB:d=0.4,astats=metadata=0", "-f", "null", "-"])
    def num(pat, default=None):
        m = re.search(pat, err)
        return float(m.group(1)) if m else default
    mean = num(r"mean_volume:\s*(-?[\d.]+) dB", -60)
    peak = num(r"max_volume:\s*(-?[\d.]+) dB", -60)
    floor = num(r"Noise floor dB:\s*(-?[\d.]+|-inf)", None)
    trough = num(r"RMS trough dB:\s*(-?[\d.]+)", None)
    silence = sum(float(x) for x in re.findall(r"silence_duration:\s*([\d.]+)", err))
    silence_ratio = min(1.0, silence / dur) if dur else 1.0
    noise = trough if trough is not None else floor
    score, tips = 100, []
    if dur < 6: score -= 45; tips.append("Too short: use at least 6 seconds, ideally 15–60 seconds of clear speech.")
    elif dur < 12: score -= 15; tips.append("Short sample: 15–60 seconds of speech gives a more stable clone.")
    if peak > -0.5: score -= 20; tips.append("Audio is clipping (too loud). Re-record with the microphone further away.")
    if mean < -34: score -= 20; tips.append("Recording is very quiet. Speak closer to the microphone.")
    if noise is not None and noise > -50: score -= 25; tips.append("High background noise. Enable noise reduction or re-record in a quieter room.")
    elif noise is not None and noise > -58: score -= 10; tips.append("Some background noise. Noise reduction may help.")
    if silence_ratio > 0.5: score -= 20; tips.append("Mostly silence. Trim the sample to the spoken parts.")
    tips.append("Use only one speaker, with no music or other voices in the recording.")
    score = max(0, min(100, int(score)))
    label = "Good" if score >= 75 else "Fair" if score >= 50 else "Poor"
    fin = lambda v: v if v is not None and v == v and abs(v) != float("inf") else None
    return {"score": score, "label": label, "duration": round(dur, 2), "mean_db": fin(mean), "peak_db": fin(peak),
            "noise_db": fin(noise), "silence_ratio": round(silence_ratio, 2), "tips": tips}


def post_process(src, dst, pitch_semitones=0.0, fit_dur=None, meta=None):
    """Pitch shift, speed up to fit a time slot (max 1.3x), 24 kHz mono WAV, AI-generated metadata."""
    filters = []
    if abs(pitch_semitones) > 0.01:
        f = 2 ** (pitch_semitones / 12)
        filters += ["aresample=24000", f"asetrate={int(24000 * f)}", "aresample=24000", f"atempo={1 / f:.5f}" if 0.5 <= 1 / f <= 2 else "anull"]
    if fit_dur:
        cur = duration(src)
        if cur > fit_dur > 0.2:
            filters.append(f"atempo={min(cur / fit_dur, 1.3):.4f}")
    args = ["-y", "-i", str(src)]
    if filters: args += ["-af", ",".join(filters)]
    for k, v in (meta or {}).items():
        args += ["-metadata", f"{k}={v}"]
    _run(args + ["-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(dst)])


def convert_for_conversion(src, dst):
    _run(["-y", "-i", str(src), "-vn", "-ac", "1", "-ar", "22050", "-c:a", "pcm_s16le", str(dst)])
