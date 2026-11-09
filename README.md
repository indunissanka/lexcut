# LexCut

A video editor that runs in your browser on Mac, Windows and Linux, with AI voice, subtitles and effects built in. Everything runs on your own computer. A small Python server serves the editor on `localhost`, and your project autosaves in the browser.

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
- Automatic subtitles with local Whisper (large-v3), plus subtitle translation. Apple Silicon Macs use mlx-whisper; Windows, Linux and Intel Macs use faster-whisper (on the CPU, or on an NVIDIA GPU)
- **Sinhala transcription** with a Whisper model trained on Sinhala ([SinhaSpeech/whisper-small-sinhala](https://huggingface.co/SinhaSpeech/whisper-small-sinhala-run12-best)). Large-v3 loops on Sinhala; this model does not. Claude can then fix misheard words.
- Speaker labels (Person 1, Person 2…) with voice matching
- **AI Voice Studio:** clone a voice from samples, text-to-speech in 19 languages, styles, pronunciation fixes, insert narration into the timeline. Ready-made system voices are also included (macOS voices, Windows voices, or eSpeak NG on Linux).
- **Sinhala voice in your own voice:** a [Piper Sinhala voice](https://huggingface.co/chan4lk/piper-tts-sinhala) speaks the text, then OpenVoice v2 converts it to sound like your cloned voice. 18 languages use Coqui XTTS-v2.
- Smart tools: scene detection, silence removal, highlight detection

**AI with Claude** (uses your Claude Code login, no API key)
- Chat assistant that edits the timeline, grammar and style fixes for captions, speaker checks
- **Claude connector (MCP):** Claude Code or Claude Desktop can read and edit the open project

**Paid cloud tools (optional, Replicate)**
- Video generation, background removal, face enhancement, eye contact, voice isolation, lip sync, speech to speech

## Quick start

| Your computer | Install | Start |
|---|---|---|
| **Mac** | `./install.sh` | open `~/Applications/LexCut.app` |
| **Windows** | double-click `install.cmd` | double-click the `LexCut` shortcut |
| **Linux** | `./install.sh` | open **LexCut** from your app menu, or run `./lexcut.sh start` |

Then use LexCut in Chrome (Edge and Chromium also work) at http://localhost:8765/. Details for each system are below.

## Requirements

**Mac**
- macOS on Apple Silicon (M1 or later). On an Intel Mac, editing works, but some AI libraries no longer publish Intel Mac versions, so local transcription and voices may not install.
- [Homebrew](https://brew.sh)
- Chrome

**Windows**
- Windows 10 or 11 (64-bit)
- [winget](https://learn.microsoft.com/windows/package-manager/winget/) (built into Windows 11), or install Python 3.11 and ffmpeg yourself
- Chrome or Edge
- Optional: an NVIDIA GPU with CUDA 12 and cuDNN 9 makes transcription and voices much faster. Without one, everything runs on the CPU.

**Linux**
- A 64-bit desktop Linux with apt (Ubuntu, Debian, Mint), dnf (Fedora), pacman (Arch) or zypper (openSUSE). The installer uses `sudo` to install Python, ffmpeg and eSpeak NG.
- Python 3.10, 3.11 or 3.12
- Chrome or Chromium
- Optional: an NVIDIA GPU with CUDA 12 and cuDNN 9, as on Windows

**All systems**
- About 6 GB of disk space for everything (about 3 GB without the voice features)
- Optional: [Claude Code](https://claude.com/claude-code) for the Claude features, and a [Replicate](https://replicate.com) key for the cloud tools

## Install

### Mac

```bash
git clone https://github.com/indunissanka/lexcut.git
cd lexcut
./install.sh
```

The script installs Python 3.11 and ffmpeg (with Homebrew), the transcription environment (`.venv`: mlx-whisper on Apple Silicon, faster-whisper on Intel), the voice environment (`~/.opencut/venv-tts`), and the `LexCut.app` and `Stop LexCut.app` launchers in `~/Applications`. You can run it again at any time; it only adds what is missing.

| Option | What it does |
|---|---|
| `--no-voice` | Skip the ~2 GB voice environment (also turns off the Sinhala voice and Sinhala transcription) |
| `--no-launcher` | Do not create the launcher apps |
| `--download-models` | Download the Whisper models (~4 GB) and OpenVoice now instead of on first use |
| `--mcp` | Register the Claude connector |

### Windows

Download or clone the repository, then double-click `install.cmd`. You can also run it from PowerShell:

```powershell
git clone https://github.com/indunissanka/lexcut.git
cd lexcut
.\install.cmd
```

The installer uses winget to install Python 3.11 and ffmpeg. It then sets up the transcription environment (`.venv`, faster-whisper), the voice environment (`%USERPROFILE%\.opencut\venv-tts`), and the `LexCut` and `Stop LexCut` shortcuts on your desktop and in the Start menu. You can run it again at any time; it only adds what is missing.

| Option | What it does |
|---|---|
| `-NoVoice` | Skip the ~2 GB voice environment (also turns off the Sinhala voice and Sinhala transcription) |
| `-NoLauncher` | Do not create the shortcuts |
| `-DownloadModels` | Download the Whisper models and OpenVoice now instead of on first use |
| `-Mcp` | Register the Claude connector |

For example: `.\install.cmd -NoVoice`

### Linux

```bash
git clone https://github.com/indunissanka/lexcut.git
cd lexcut
./install.sh
```

The same script as on the Mac, with the same options. On Linux it installs Python, ffmpeg and eSpeak NG (the ready-made voices) with your package manager. It then sets up the transcription environment (`.venv`, faster-whisper), the voice environment (`~/.opencut/venv-tts`), and **LexCut** and **Stop LexCut** in your app menu.

## Run

**Mac:** open `~/Applications/LexCut.app`. To stop it, open `Stop LexCut.app`.

**Linux:** open **LexCut** from your app menu. To stop it, open **Stop LexCut**. From a terminal:

```bash
./lexcut.sh start
```

```bash
./lexcut.sh stop
```

On a Mac, `./lexcut.sh` works the same way.

**Windows:** double-click the `LexCut` shortcut on your desktop, or run:

```powershell
.venv\Scripts\python.exe server.py 8765
```

To stop it, double-click `Stop LexCut`.

Then open http://localhost:8765/ in Chrome (or Edge or Chromium).

You can also start the server by hand on any system with `python3 server.py 8765` (on Windows: `python server.py 8765`) from the LexCut folder.

## Claude connector (MCP)

```bash
claude mcp add opencut -- python3 /path/to/lexcut/opencut_mcp.py
```

On Windows, use the full path, for example `claude mcp add opencut -- python C:\Users\you\lexcut\opencut_mcp.py`.

Keep the editor open in a browser tab. Claude then gets the tools `opencut_get_state`, `opencut_edit`, `opencut_screenshot`, `opencut_undo`, `opencut_redo` and `opencut_help`. (The connector keeps its original `opencut` name so existing setups keep working.)

## Where your data lives

- Your project: in the browser (IndexedDB). Use File → Save project for a file copy.
- Voices, generated audio and settings: `~/.opencut/` (on Windows: `%USERPROFILE%\.opencut\`). API keys are stored there with mode 600 and are never sent to the browser.
- Downloaded models: `models/` in this folder.

## Licences

The LexCut code is under the [MIT licence](LICENSE). The models it downloads have their own licences:

- **Coqui XTTS-v2** uses the Coqui Public Model License, which is **non-commercial**. The app asks you to accept it before the first voice is created.
- Whisper large-v3 uses the MIT licence. The Sinhala Whisper model uses Apache-2.0.
- The Piper Sinhala voice uses the MIT licence (trained on OpenSLR 30, CC BY-SA 4.0). OpenVoice v2 uses the MIT licence.
- Each Replicate model has its own licence. Check it on the model's page.

Only clone voices you have permission to use. The app asks for the voice owner's consent and keeps an audit log.

More technical detail is in [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md).
