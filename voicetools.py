"""Voice Studio extras that run on this computer: ready-made male and female voices with speed, pitch and tone.

macOS uses its system voices (`say`). Windows uses its built-in speech voices (System.Speech through PowerShell).
Tone presets only change speed and pitch (and pauses); they are not emotion modelling.
"""
import json
import math
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from platform_util import IS_WIN, which

FFMPEG = which("ffmpeg") or "ffmpeg"

NOVELTY = {"Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Wobble", "Good News", "Organ", "Superstar", "Trinoids", "Whisper",
           "Zarvox", "Jester", "Junior", "Ralph", "Princess", "Hysterical", "Deranged", "Pipe Organ", "Albert", "Fred", "Kathy"}
# Gender of well-known macOS voices (the system does not publish it). Unknown voices are shown as "unspecified".
FEMALE = {"Samantha", "Karen", "Moira", "Tessa", "Victoria", "Fiona", "Allison", "Ava", "Susan", "Zoe", "Kate", "Serena", "Veena", "Nicky", "Joelle",
          "Yuna", "Kyoko", "Ting-Ting", "Mei-Jia", "Sin-ji", "Amélie", "Anna", "Luciana", "Monica", "Paulina", "Alice", "Milena", "Kanya", "Lekha",
          "Samira", "Laura", "Ioana", "Zuzana", "Sara", "Ellen", "Melina", "Damayanti", "Amira", "Carmit", "Claire", "Ewa", "Joana", "Katya", "Lesya",
          "Mariska", "Nora", "Tünde", "Yelda", "Zosia", "Sandy", "Shelley", "Flo", "Grandma", "Meijia", "Isabella", "Soumya", "Geeta", "Aru", "Daria", "Alva", "Satu"}
MALE = {"Alex", "Daniel", "Tom", "Oliver", "Rishi", "Aaron", "Arthur", "Evan", "Gordon", "Lee", "Fred", "Jorge", "Diego", "Otoya", "Thomas", "Luca",
        "Yuri", "Tarik", "Maged", "Xander", "Eddy", "Reed", "Rocko", "Grandpa", "Markus", "Magnus", "Jacques", "Felipe", "Juan", "Aman", "Yannick", "Majed"}
TONES = {   # name: (speed factor, pitch semitone shift, pause factor)
    "neutral": (1.0, 0, 1.0), "cheerful": (1.1, 3, 0.8), "excited": (1.18, 4, 0.7), "calm": (0.9, -1, 1.3),
    "serious": (0.94, -3, 1.1), "sad": (0.84, -4, 1.4), "whisper-like": (0.9, -2, 1.2),
}


def _gender(name):
    base = name.split(" (")[0].strip()
    return "female" if base in FEMALE else "male" if base in MALE else ""


# ---- Windows: System.Speech (SAPI) voices, driven by a small PowerShell script ----
_WIN_PS = r"""
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$j = Get-Content -Raw -Encoding UTF8 $args[0] | ConvertFrom-Json
if ($j.op -eq 'list') {
  $lines = foreach ($v in $s.GetInstalledVoices()) { if ($v.Enabled) { $i = $v.VoiceInfo; "$($i.Name)`t$($i.Culture.Name)`t$($i.Gender)" } }
  [IO.File]::WriteAllLines($j.out, [string[]]@($lines), (New-Object Text.UTF8Encoding $false))
} else {
  $s.SelectVoice($j.voice)
  $s.Rate = [int]$j.rate
  $pb = New-Object System.Speech.Synthesis.PromptBuilder
  foreach ($p in $j.parts) { $pb.AppendText($p); if ($j.pause -gt 0) { $pb.AppendBreak([TimeSpan]::FromMilliseconds($j.pause)) } }
  $s.SetOutputToWaveFile($j.out)
  $s.Speak($pb)
}
$s.Dispose()
"""
_win_cache = {"t": 0.0, "voices": []}


def _win_run(req: dict, d: Path):
    ps = which("powershell") or which("pwsh")
    if not ps:
        raise RuntimeError("PowerShell was not found.")
    (d / "v.ps1").write_text(_WIN_PS, encoding="utf-8")
    (d / "req.json").write_text(json.dumps(req), encoding="utf-8")
    r = subprocess.run([ps, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", str(d / "v.ps1"), str(d / "req.json")],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout or "Windows speech failed").strip()[:300])


def _win_list_voices():
    if time.time() - _win_cache["t"] < 60:
        return _win_cache["voices"]
    out = []
    with tempfile.TemporaryDirectory() as d:
        try:
            _win_run({"op": "list", "out": str(Path(d) / "voices.txt")}, Path(d))
            lines = (Path(d) / "voices.txt").read_text(encoding="utf-8").splitlines()
        except Exception:
            lines = []
    for line in lines:
        parts = line.split("\t")
        if len(parts) < 3 or not parts[0].strip():
            continue
        name, loc, g = parts[0].strip(), parts[1].replace("-", "_"), parts[2].lower()
        out.append({"name": name, "locale": loc, "lang": loc.split("_")[0], "gender": g if g in ("male", "female") else "", "sample": ""})
    _win_cache.update(t=time.time(), voices=out)
    return out


def _win_speak(voice, text, wpm_factor, semis, pause, d: Path) -> Path:
    rate = int(max(-10, min(10, round(10 * math.log(max(0.1, wpm_factor)) / math.log(3)))))   # SAPI: +10 is about 3x the normal speed
    parts = [t for t in re.split(r"(?<=[.!?。！？])\s+", text) if t.strip()] if pause > 1 else [text]
    raw = d / "raw.wav"
    _win_run({"op": "speak", "voice": voice, "rate": rate, "parts": parts, "pause": int(250 * (pause - 1)) if pause > 1 else 0, "out": str(raw)}, d)
    if not raw.exists():
        raise RuntimeError("Windows speech made no audio.")
    return raw


def list_voices():
    if IS_WIN:
        return _win_list_voices()
    if not shutil.which("say"):
        return []   # Linux: no built-in system voices
    r = subprocess.run(["say", "-v", "?"], capture_output=True, text=True, timeout=30)
    out = []
    for line in r.stdout.splitlines():
        m = re.match(r"^(.+?)\s+([a-z]{2,3}_[A-Za-z]{2,4})\s+#\s*(.*)$", line)
        if not m:
            continue
        name, loc, sample = m.group(1).strip(), m.group(2), m.group(3)
        if name.split(" (")[0] in NOVELTY:
            continue
        if any(o["name"] == name and o["locale"] == loc for o in out):
            continue
        out.append({"name": name, "locale": loc, "lang": loc.split("_")[0], "gender": _gender(name), "sample": sample})
    return out


def speak(voice, text, speed=1.0, pitch=0.0, tone="neutral"):
    """Return WAV bytes (24 kHz mono) of text spoken by a system voice."""
    names = {v["name"] for v in list_voices()}
    if voice not in names:
        raise ValueError("Unknown voice.")
    text = (text or "").strip()
    if not text or len(text) > 20000:
        raise ValueError("Enter some text (up to 20000 characters).")
    sp, ps, pause = TONES.get(tone, TONES["neutral"])
    wpm = int(max(80, min(450, 175 * float(speed) * sp)))
    semis = max(-12, min(12, float(pitch) + ps))
    if IS_WIN:
        with tempfile.TemporaryDirectory() as d:
            raw, wav = _win_speak(voice, text, wpm / 175, semis, pause, Path(d)), Path(d) / "o.wav"
            af = "aresample=24000"
            if abs(semis) >= 0.5:   # SAPI has no reliable pitch control: shift the pitch with ffmpeg, keeping the speed
                f = 2 ** (semis / 12)
                af += f",asetrate={int(24000 * f)},aresample=24000,atempo={1 / f:.5f}"
            r = subprocess.run([FFMPEG, "-hide_banner", "-nostdin", "-y", "-i", str(raw), "-af", af, "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(wav)],
                               capture_output=True, text=True, errors="replace", timeout=600)
            if r.returncode or not wav.exists():
                raise RuntimeError("Could not convert the speech.")
            return wav.read_bytes()
    if pause != 1.0:   # longer or shorter pauses after sentences
        text = re.sub(r"([.!?。！？])\s+", lambda m: m.group(1) + f" [[slnc {int(250 * (pause - 1) + 0)}]] " if pause > 1 else m.group(1) + " ", text)
    if abs(semis) >= 0.5:
        text = f"[[pbas {semis:+.0f}]] " + text
    with tempfile.TemporaryDirectory() as d:
        aiff, wav = Path(d) / "o.aiff", Path(d) / "o.wav"
        r = subprocess.run(["say", "-v", voice, "-r", str(wpm), "-o", str(aiff), "-f", "-"], input=text, capture_output=True, text=True, timeout=600)
        if r.returncode or not aiff.exists():
            raise RuntimeError((r.stderr or "say failed").strip()[:300])
        r = subprocess.run([FFMPEG, "-hide_banner", "-nostdin", "-y", "-i", str(aiff), "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(wav)], capture_output=True, text=True, timeout=600)
        if r.returncode or not wav.exists():
            raise RuntimeError("Could not convert the speech.")
        return wav.read_bytes()
