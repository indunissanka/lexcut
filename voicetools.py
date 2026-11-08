"""Voice Studio extras that run on this Mac: ready-made male and female voices (macOS system voices) with speed, pitch and tone.

Tone presets only change speed and pitch (and pauses); they are not emotion modelling.
"""
import re
import subprocess
import tempfile
from pathlib import Path

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


def list_voices():
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
    if pause != 1.0:   # longer or shorter pauses after sentences
        text = re.sub(r"([.!?。！？])\s+", lambda m: m.group(1) + f" [[slnc {int(250 * (pause - 1) + 0)}]] " if pause > 1 else m.group(1) + " ", text)
    if abs(semis) >= 0.5:
        text = f"[[pbas {semis:+.0f}]] " + text
    with tempfile.TemporaryDirectory() as d:
        aiff, wav = Path(d) / "o.aiff", Path(d) / "o.wav"
        r = subprocess.run(["say", "-v", voice, "-r", str(wpm), "-o", str(aiff), "-f", "-"], input=text, capture_output=True, text=True, timeout=600)
        if r.returncode or not aiff.exists():
            raise RuntimeError((r.stderr or "say failed").strip()[:300])
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-y", "-i", str(aiff), "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(wav)], capture_output=True, text=True, timeout=600)
        if r.returncode or not wav.exists():
            raise RuntimeError("Could not convert the speech.")
        return wav.read_bytes()
