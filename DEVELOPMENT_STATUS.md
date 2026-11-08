# LexCut: development status

Last updated: 2026-11-02. Single-user browser video editor (vanilla JS) with a small Python server. No git; backups are listed at the bottom.

## Run and stop
- **Start:** click `~/Applications/LexCut.app` (starts the server if needed, opens http://localhost:8765/ in Chrome). Manual equivalent: `cd /Volumes/Lexar/OpenCut && python3 server.py 8765`.
- **Stop:** click `~/Applications/Stop LexCut.app` (asks first), or `pkill -f "server.py 8765"`.
- Server log: `/tmp/opencut.log`. The Lexar drive must be plugged in.
- Your project autosaves in the browser (IndexedDB, origin `127.0.0.1:8765`); use File → Save project for a file copy.

## Architecture
| Piece | Where |
|---|---|
| Editor UI (timeline, clips, export) | `app.js`, `index.html`, `style.css` |
| Server: static files, `/api/claude`, `/api/vision`, `/api/transcribe`, `/api/voice/*` | `server.py` |
| Local Whisper transcription (mlx-whisper, Large-v3) | `whisper_worker.py`, `.venv`, `models/` |
| AI Voice Studio UI | `voice.js`, `voice.css` |
| AI Voice Studio backend | `voice/` (`api.py`, `jobs.py`, `db.py`, `media.py`, `config.py`, `xtts_worker.py`, `adapters/`) |
| Grammar/style fix with Claude | `polish.js` |
| Voice engine environment (Coqui XTTS-v2) | `~/.opencut/venv-tts` (internal disk: the Lexar exFAT `._*` files break pip) |
| Voice data (samples, db, generated audio), admin config | `~/.opencut/voice_data`, `~/.opencut/voice_config.json` |

## Done
1. **AI Voice Studio** (AI menu): voice library, upload and record samples (noise reduction option, quality meter), create clone, text-to-speech with per-sentence generate/regenerate, styles, speed/pitch/similarity/expressiveness, pronunciation corrections, pauses, insert into timeline (at playhead, at caption times, or replace a selected clip), "AI Voice" layer created automatically, AI badge, per-clip regenerate in the Inspector, activity log.
2. **Security and consent:** owner-consent confirmation and owner name required to create a voice, model-license gate, localhost-only requests (Origin and Host checks), audit log, delete removes samples and generated audio, API keys never reach the browser.
3. **Adapter architecture:** `voice/adapters/base.py` interface; only `xtts` is implemented. Add a provider by writing a class and registering it in `voice/adapters/__init__.py`.
4. **Jobs:** background worker, cache (same inputs reuse audio), cancel, retry, ordered queue.
5. **Layer drag:** drag the `⋮⋮` grip on a layer label up or down (order saved with the project; not undoable).
6. **Fix grammar & style with Claude:** Transcript dialog (with Restore original) and AI → Claude AI action for timeline captions. Timestamps and line count never change.
7. **Speaker labels in the transcript** (Person 1, Person 2…): `diarize_worker.py` (runs in `~/.opencut/venv-tts`) clusters voice fingerprints per segment; `/api/diarize` in `server.py`; checkbox + people count in the Transcript dialog; "Check speakers with Claude" (`polish.js`) corrects labels from conversation context. Tested on synthetic macOS voices only (1, 2 and 3 speakers). Engine: Resemblyzer speaker embeddings (installed by the user in `~/.opencut/venv-tts`; `webrtcvad` is stubbed in the worker) with MFCC fallback. Saved Voice Studio voices are matched by cosine similarity (>= 0.76); names can also be set by hand in the Who is who box. Same voice on a different mic can score only ~0.5-0.7, so add samples recorded like the video. Backups: `*.before-speakers`, `*.before-neural`.
8. **Launcher and Stop apps** in `~/Applications`.

12. **Claude connector (MCP)** (`opencut_mcp.py`, bridge in `server.py` `/api/bridge/*` and `BRIDGE_OPS` in `app.js`): Claude Code / Desktop (Claude Pro login, no API key) can read and edit the project open in the browser: tools `opencut_get_state`, `opencut_help`, `opencut_edit` (same actions as the chat box), `opencut_screenshot`, `opencut_undo`, `opencut_redo`. Token in `~/.opencut/bridge_token` (0600). Register: `claude mcp add opencut -- python3 /Volumes/Lexar/OpenCut/opencut_mcp.py`. Needs the editor open in a tab. Backups: `*.before-bridge`.

## Verified working
Clone, generation in English, Simplified and Traditional Chinese, Japanese, Korean, Arabic (transcribed back with Whisper), cache, cancel, retry, delete, insert, regenerate one clip, undo/redo, export containing the narration, layer drag and reload persistence, transcript polish (including Chinese and Sinhala left in their own language), launcher start from stopped server.

9. **Editor features added 2026-11-02** (all in `app.js`, UI in the right-hand Inspector, `transitions.js` for the transition dialog): transitions between clips, keyframe animation, merge, Speaker field on text clips, LUT import (.cube, WebGL, stored in IndexedDB key `luts`), green screen key (WebGL), speed ramp (speed keyframes; source position = integral of speed), stabilization (frame-by-frame motion estimate stored as `kf.stabx/staby`). Backups: `*.before-transitions`, `*.before-kf`, `*.before-fx`.

10. **Audio tools** (`audio.js`, sound chain in `app.js` connectAudio/audioApply, `/api/audio/process` in `server.py`): per-clip EQ (bass/middle/treble), rumble filter and compressor (live, Web Audio, also in the export); noise removal and voice enhancement (ffmpeg afftdn with the noise floor measured automatically; replaces the clip's sound with a cleaned WAV, Undo restores); audio mixer dialog (per-layer volume up to 200%, pan, mute, solo, level meters, master volume saved in localStorage `oc-master`); background music dialog (loops to fill the timeline, fades, automatic ducking under speech written as volume keyframes); sync by sound (GCC-PHAT, first 60 s of each clip). Backups: `*.before-audio`.

11. **Text and titles** (`titles.js`; hooks in `drawText` in `app.js`): text animation in/out per text clip (fade, slide, pop, zoom, blur, wipe, typewriter, word by word; Inspector "Animation" section with preview); Add > Titles & lower thirds (6 animated titles, 3 lower-third styles on a "Titles" layer; lower thirds have a second line and accent colour); custom fonts (.ttf/.otf/.woff/.woff2 via Inspector "Add font file", stored in IndexedDB key `fonts`, not inside the saved project file); File > Export captions (SRT/VTT) per text layer, including "Translation:" layers. Already existed: automatic subtitles (transcribe), subtitle translation (Claude AI), SRT/VTT import. Tested in Chrome on port 8799 (preset insert, typewriter, lower-third render, export dialog); the font upload itself and a real export with animations were not click-tested. Backups: `*.before-titles`.

12. **Smart tools** (`aitools.js`, `/api/analyze` in `server.py`, AI menu > Smart tools): scene detection (ffmpeg scdet; markers, optional split), silence removal (ffmpeg silencedetect with the threshold from the measured noise floor; cuts and closes gaps on the clip and its linked sound; text layers are not shifted), highlight detection (loudness per second + timeline captions, ranked by the claude CLI; markers, "Keep only the highlights"). The chat assistant (Claude CLI) has actions `detect_scenes`, `remove_silence`, `find_highlights`. Tested on port 8799 with a synthetic clip and a real Claude call. **Not built (needs generative or vision models that are not installed):** video generation, background removal, face enhancement, eye contact. Backups: `*.before-aitools`.

13. **AI Cloud tools (paid, Replicate)** (`cloud.py`, `aicloud.js`; AI menu > AI Cloud tools): video generation (text or the picture at the playhead), background removal (result is green-screen video; the key colour is sampled from it and the Green screen key is switched on), face enhancement, eye contact. **Setup:** open the dialog, Settings, paste your Replicate API key (stored in `~/.opencut/ai_config.json`, mode 600, never sent back to the browser), tick the upload/cost box. Each feature is a slot with a changeable Replicate model name; "Check" reads the model's real input fields from your account. Defaults (UNVERIFIED, I had no key): `wan-video/wan-2.2-t2v-fast`, `wan-video/wan-2.2-i2v-fast`, `arielreplicate/robust_video_matting`, `pollinations/codeformer-video` (its page says non-commercial), eye contact: no default model, enter one. Input names are matched from the model schema; fixed extra inputs can be set in the config file (`slots.<name>.extra`). Clips are trimmed to the used range, scaled to max 1280 wide and sent without sound; the result replaces the clip's picture (sound stays). Tested only against a local mock of the Replicate API (plumbing, key handling, origin check), not the real service. Backups: `*.before-cloud`.

14. **Voice tools** (AI Voice Studio > Voice tools tab; `voicetools.py`, `voicetools.js`, slots in `cloud.py`): **ready-made male/female voices**, free and local, from the 166 usable macOS system voices (about 39 languages, gender from a name list so some are "unspecified"), speed, pitch, and tone presets (speed/pitch/pauses only, not real emotion), preview and add to the "AI Voice" layer. **Speech to speech, voice isolation, lip sync** are paid Replicate slots (same key and consent as AI Cloud tools): isolation default `ryan5453/demucs` (stem vocals), lip sync default `sync/lipsync-2`, speech to speech has NO default model (enter one in AI Cloud settings; the target voice is a Voice Studio voice's first sample or an uploaded recording). All model names/inputs unverified against the real service (mock-tested only). Already in Voice Studio: cloning with sample management, multiple profiles, TTS, speed/pitch, styles, 18 languages (XTTS), and timestamped transcription (Transcript dialog). Backups: `*.before-voice`, `voice.js.before-tools`.

15. **Effects library** (`effects.js`; hooks in `drawMedia`/`drawText`/`renderInspector` in `app.js`; Add > Effects & graphics; Inspector sections on picture clips). All local, no paid API. **Picture in picture** (corner/half presets with rounded corners, border, shadow). **Masks** (rectangle, rounded, circle, diamond, triangle, star, heart; soft edge, invert, keyframable position). **3D flip** (rotY/rotX by perspective strips). **Motion tracking** (template matching on 320-px frames every 0.1 s; pick a point, track, then make a text/picture clip or the mask follow it; works best with a box about the object's size; ignores rotation and zoom of the object). **Transitions** added: circle reveal, spin, 3D flip, whip pan (13 total). **Animation presets** for picture clips (in, out, loops, 4 logo animations) written as keyframes. **Effect clips** (text-layer clips with `fxType`, text empty, drawn from the clock so export matches): particles (snow, rain, confetti, sparks, fireflies, bubbles), lens flare (3 + sweep), light leak, cinematic (letterbox, bloom, RGB split, glitch, shake, film grain, old film, vignette; these change everything on the layers below the Effects layer), graphics (rectangle, rounded box, circle, ring, underline, arrow, progress bar, counter) with the title animations. **Custom effect presets** (saved in localStorage `oc-fxpresets`, optional keyframes, export/import JSON). Green screen and colour looks already existed. Tested in Chrome on port 8799 (all 26 effect types draw without errors, mask/PiP/flare/snow screenshot checked, tracking within 2-6 px on a synthetic clip); export of these effects and real footage not tested. Backups: `*.before-fxlib`.

16. **Sinhala voice and transcription** (2026-11-08). Voice: "Sinhala" is a language of every XTTS voice; `voice/adapters/xtts.py` sends it to `SinhalaVoice` / `voice/sinhala_worker.py` (same venv-tts): Piper `models/piper/si_LK-sinhala-medium.onnx` (MIT, OpenSLR 30) speaks, then Coqui's built-in OpenVoice v2 converts to the voice's samples. Measured: Nissanka similarity 0.57 (plain Piper) -> 0.80 after conversion; about 3 s for the first line, under 0.5 s after. Similarity/expressiveness sliders do nothing for Sinhala; speed and pitch work. Transcription: model `local:sinhala` = `SinhaSpeech/whisper-small-sinhala-run12-best` (Apache-2.0) via `sinhala_asr_worker.py` in venv-tts (MPS fp16); it lost Whisper timestamps, so the worker splits at pauses (max 12 s phrases). Picked automatically when the language is Sinhala (Transcript dialog and chat). Tested: large-v3 loops on Sinhala ("අපි අපි අපි..."); kasunw/whisper-large-v3-sinhala was slower and less accurate; the Piper sample transcribes almost perfectly; the converted voice transcribes well on most words. Claude polish rule 7 fixes misheard words (tested: "අන්ධ කාලගුණයෙහි ඉතාම සුනදරයි" -> "අද කාලගුණය ඉතාම සුන්දරයි"). Rejected: facebook/mms-tts-sin (does not exist), tharushaudana MMS models (need romanised text). Backups: `*.before-sinhala`.

## Known limits
- XTTS-v2: no Sinhala (handled by Piper + OpenVoice instead, see 16), no voice conversion, no real emotion control (styles change pacing/variation), **non-commercial licence (CPML)**.
- LUTs are not inside the saved project file (File > Save project); they live in the browser database. Clips with keyframes cannot be merged. Stabilization uses the picture's overall motion, so large moving subjects can fool it.
- Export is real-time WebM (takes as long as the video) and carries no AI-generated tag; the tag is in the generated audio files and the on-screen badge.
- Multi-user accounts/permissions were not built (single-user localhost app); safeguards are consent, audit log and localhost-only access.
- `Stop LexCut.app` dialogs were not click-tested by me.
- LexCut.app signature is intentionally not intact (script was patched in place to keep macOS file-access permission).

## Open items / next
- **XTTS weights missing:** `models/tts/tts/tts_models--multilingual--multi-dataset--xtts_v2/` is empty, so voice generation will re-download ~2 GB on first use (verify).
- Speaker labels are per clip (numbering restarts for each clip); real-speech accuracy untested.
- **Microphone recording:** the user reported "mic not working"; the code path and server work (a 33 s recording was cloned), cause never found. Ask what was seen (poor clone? silent? forgot "Use this recording"). Idea: play back before saving and warn on low level.
- Voice conversion (needs an engine that supports it).
- Optional: undo for layer moves.

## Rules for testing (important)
- Never accept the XTTS licence or tick owner consent on the user's behalf; the user does these.
- Test on an isolated server: `OPENCUT_VOICE_DATA=<scratch dir> python3 server.py 8799`; the real project lives in the browser on port 8765 and autosave would change it. Delete test data afterwards.
- Do not pkill test apps quickly while a macOS "removable volume" prompt may be showing.

## Backups
`/Volumes/Lexar/OpenCut-backup-pre-voice/`: original app files before voice work, plus `app.js.before-lane-drag` and `style.css.before-lane-drag`.
