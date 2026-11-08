# LexCut

A video editor that runs in your browser on a Mac, with AI voice, subtitles and effects built in. Everything runs on your own computer. A small Python server serves the editor on `localhost`, and your project autosaves in the browser.

> LexCut is a separate project. It is **not** related to [OpenCut](https://github.com/OpenCut-app/OpenCut) and shares no code with it.

## Features

**Editing**
- Multi-track timeline: trim, split, merge, layers you can drag to reorder, undo/redo
- Keyframe animation, speed ramps, stabilization
- 13 transitions, including circle reveal, spin, 3D flip and whip pan
- Picture in picture, masks (shapes, soft edge, invert), green screen key, LUT import (.cube), motion tracking
- Export as MP4, MOV, WebM, AVI, MKV, GIF, MP3 or WAV, plus SRT/VTT captions

**Text, titles and effects**
- Text animations (fade, slide, pop, typewriter, word by word…), animated titles and lower thirds, custom fonts
- Effect clips: particles (snow, rain, confetti…), lens flares, light leaks, film grain, glitch, letterbox, graphics. You can save your own presets.

**Audio**
- Per-clip EQ, rumble filter, compressor, noise removal and voice enhancement
- Mixer (volume, pan, mute, solo, meters), background music with automatic ducking, sync by sound

**AI, local and free**
- Automatic subtitles with local Whisper (large-v3), plus subtitle translation
- Speaker labels (Person 1, Person 2…) with voice matching
- **AI Voice Studio:** clone a voice from samples, text-to-speech in 18 languages (Coqui XTTS-v2), styles, pronunciation fixes, insert narration into the timeline. Ready-made macOS system voices are also included.
- Smart tools: scene detection, silence removal, highlight detection

**AI with Claude** (uses your Claude Code login, no API key)
- Chat assistant that edits the timeline, grammar and style fixes for captions, speaker checks
- **Claude connector (MCP):** Claude Code or Claude Desktop can read and edit the open project

**Paid cloud tools (optional, Replicate)**
- Video generation, background removal, face enhancement, eye contact, voice isolation, lip sync, speech to speech

## Requirements

- macOS on Apple Silicon (M1 or later)
- [Homebrew](https://brew.sh)
- Chrome
- About 6 GB of disk space for everything (about 3 GB without the voice features)
- Optional: [Claude Code](https://claude.com/claude-code) for the Claude features, and a [Replicate](https://replicate.com) key for the cloud tools

## Install

```bash
git clone https://github.com/indunissanka/lexcut.git
cd lexcut
./install.sh
```

The script installs Python 3.11 and ffmpeg (with Homebrew), the transcription environment (`.venv`), the voice environment (`~/.opencut/venv-tts`), and the `LexCut.app` and `Stop LexCut.app` launchers in `~/Applications`. You can run it again at any time; it only adds what is missing.

| Option | What it does |
|---|---|
| `--no-voice` | Skip the ~2 GB voice environment |
| `--no-launcher` | Do not create the launcher apps |
| `--download-models` | Download the Whisper model (~3 GB) now instead of on first use |
| `--mcp` | Register the Claude connector |

## Run

Open `~/Applications/LexCut.app`, or run:

```bash
python3 server.py 8765
```

Then open http://localhost:8765/ in Chrome. To stop it, open `Stop LexCut.app`.

## Claude connector (MCP)

```bash
claude mcp add opencut -- python3 /path/to/lexcut/opencut_mcp.py
```

Keep the editor open in a browser tab. Claude then gets the tools `opencut_get_state`, `opencut_edit`, `opencut_screenshot`, `opencut_undo`, `opencut_redo` and `opencut_help`. (The connector keeps its original `opencut` name so existing setups keep working.)

## Where your data lives

- Your project: in the browser (IndexedDB). Use File → Save project for a file copy.
- Voices, generated audio and settings: `~/.opencut/`. API keys are stored there with mode 600 and are never sent to the browser.
- Downloaded models: `models/` in this folder.

## Licences

The LexCut code is under the [MIT licence](LICENSE). The models it downloads have their own licences:

- **Coqui XTTS-v2** uses the Coqui Public Model License, which is **non-commercial**. The app asks you to accept it before the first voice is created.
- Whisper large-v3 uses the MIT licence.
- Each Replicate model has its own licence. Check it on the model's page.

Only clone voices you have permission to use. The app asks for the voice owner's consent and keeps an audit log.

More technical detail is in [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md).
