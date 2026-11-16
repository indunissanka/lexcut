---
name: cartoon-story
description: Turn a story or an SRT subtitle script into a narrated cartoon video. The characters, jungle/river world and camera shots are drawn in code, with burned-in subtitles, separate voices for the narrator and each character, original background music, sound effects and multiple camera angles, rendered to MP4. The example is "The Clever Monkey and the Greedy Crocodile". Use when the user wants an animated story video, a fable, a kids' story with voices, or changes to the monkey-and-crocodile video.
---

# Cartoon story video

This skill was built with the **girl** skill's approach (code-drawn cartoon, ink outlines, gradients, parallax, IK limbs, frozen-time rendering). Read that skill's rules too: they apply to every character.

## Files

| File | What it is |
|---|---|
| `assets/monkey-crocodile.html` | The finished story. It's a single HTML file with the characters, world, story timeline, subtitles and camera shot list. It plays live in a browser, and `renderAt(t)` draws any moment. |
| `assets/monkey-crocodile.srt` | The final subtitles (39 lines, timed to the narration). |
| `voice/script.json` | Who says each line: `[cue, "N"/"M"/"C", text]`. N = narrator, M = monkey, C = crocodile. |
| `voice/synth.py` | Text-to-speech with **Kokoro** (offline, free). Voices: narrator `af_heart`, monkey `am_puck`, crocodile `am_onyx`. |
| `voice/process_voices.sh` | Gives each character its own sound: the monkey is pitched up, the crocodile pitched down with a slight echo. |
| `voice/schedule.py` | Builds the new timeline. Any subtitle that needs more time for natural speech is stretched. It writes `timeline.json` and a new `.srt`. |
| `voice/apply_timeline.py` | Writes that timeline and the exact speaking windows (for mouth movement) into the HTML. |
| `voice/audio.py` | Mixes the voices with original synthesized music (a mood per scene) and sound effects. Music is quieter under speech. Writes `soundtrack.wav`. |
| `scripts/storyboard.js` | Saves frozen frames at given times as one contact sheet. Use it to check scenes and shots. |
| `scripts/closeups.js` | Close-ups of the monkey at given times, to check poses and gestures. |
| `scripts/render-part.js`, `scripts/make_video.sh` | Renders the video in 4 parallel parts at 1080p and 30 fps, joins them, adds the soundtrack and makes a small web copy. |

## Workflow

Work in a scratch folder, never inside this skill folder. Copy `assets/monkey-crocodile.html` there as `story.html`.

1. **Story and subtitles:** edit the `SRT` text inside the HTML and `voice/script.json` together. To remove a line, delete it from both. Cue numbers can have gaps.
2. **Voices.** Set this up once per session:

   ```bash
   python3 -m venv venv
   ```

   ```bash
   ./venv/bin/pip install kokoro-onnx soundfile numpy
   ```

   ```bash
   curl -L -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
   ```

   ```bash
   curl -L -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
   ```

   Then, in the work folder:

   ```bash
   ./venv/bin/python <skill>/voice/synth.py
   ```

   `synth.py` expects `script.json` in the work folder, so copy it there first.

   ```bash
   bash <skill>/voice/process_voices.sh
   ```

3. **Timeline:**

   ```bash
   python3 <skill>/voice/schedule.py story.html
   ```

   ```bash
   python3 <skill>/voice/apply_timeline.py story.html timeline.json
   ```

4. **Soundtrack:**

   ```bash
   ./venv/bin/python <skill>/voice/audio.py
   ```

   Music moods and sound-effect times are listed in `SECTIONS` and the `place(sfx, …)` calls, in **story time**: the original SRT seconds before stretching.
5. **Check:** use `storyboard.js` on the middle of every shot, and `closeups.js` for the monkey's poses. Fix what you see, then check again.
6. **Render:**

   ```bash
   bash <skill>/scripts/make_video.sh story.html timeline.json soundtrack.wav story
   ```

   This takes about 30 minutes for 3 minutes of video on 4 cores, so run it in the background.

## How the HTML is organised

- **Two clocks:** `renderAt(T)` gets the video time `T`. `storyTime(T)` maps it through `WARP` to the original story time `t`, which drives the scenes. `RT` (real time) drives water, grass, blinking and mouth flaps, so stretched scenes never look like slow motion.
- `crocAt(t)` and `monkeyAt(t, croc)` set each character's position, pose and face at any moment. `MONKEY_TALK` and `CROC_TALK` hold the speaking windows.
- **`SHOTS`** is the camera shot list: `[start, end, fromView, toView]` in story time. Views can follow `MHEAD(c, m)`, `CHEAD(c)` or `CEYE(c)`. `r` is camera roll (dutch angle). Shots change with **hard cuts**. The special cases are the crash zoom (56.1), the fear shake (63.3) and the vine tracking shot (4.9).
- **The world:** `GY` is the bank's ground height and `WY` the water surface. The river runs from `RIVER_L` to `RIVER_R`, with the climbing tree at `TREE_X` and its branch at `BRANCH_Y`.

## Rules learned while making it

- **The crocodile floats with its back and head above the water.** Its `y` is about `WY-8` with scale 1. It stays far enough out (`NEARX=900`) that its snout doesn't hide behind the bank.
- **Draw order:** water, then the crocodile (plus the monkey when riding), then the semi-transparent front water, then the banks, then the monkey on land.
- **The monkey sits properly when riding:** use the `ride` pose with his legs forward along the crocodile's back, never down through it.
- **Arm reach is only about 42 units.** Raised-arm gestures must keep the hands **beside or below the face** (x ≥ 44 or y ≥ -50 when riding). Never aim a hand at a point it can't reach, or the arm ends up across the face.
- **Thought clouds:** the crocodile's dinner plate, the fat Auntie and the "×2" plate are drawn with `drawThought`. Auntie uses `fat:true` and `bow:true`.
- **Timing:** natural speech needs about 30–40% more time than tight subtitle windows. Stretch the timeline (`schedule.py`) rather than speeding the voices past about 1.15×.
- **The video size matters for the app:** very large MP4s (40 MB or more) may not play in the Claude app. Always also make the small web copy, about 18 MB at 1080p. You can publish it on a web page as a `video.mp4` file next to `index.html`.
- **No listening:** you can't hear the audio. Check levels with `volumedetect` (aim for a mean around -16 dB and a maximum below -1 dB), and ask the user to listen.
