# Generate every line with Kokoro at normal speed and report durations.
import json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
VOICE = {"N": ("af_heart", 1.06), "M": ("am_puck", 1.16), "C": ("am_onyx", 1.0)}
lines = json.load(open("script.json"))
out = []
for i, (cue, who, text) in enumerate(lines):
    v, sp = VOICE[who]
    audio, sr = k.create(text, voice=v, speed=sp, lang="en-us")
    f = f"raw_{i:02d}_{who}.wav"; sf.write(f, audio, sr)
    out.append({"i": i, "cue": cue, "who": who, "file": f, "dur": len(audio) / sr, "sr": sr})
    print(i, cue, who, round(len(audio) / sr, 2))
json.dump(out, open("raw.json", "w"), indent=1)
