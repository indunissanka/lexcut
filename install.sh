#!/usr/bin/env bash
# LexCut installer for macOS and Linux (Windows: use install.cmd). Safe to run again: it only adds what is missing.
#
#   ./install.sh                  everything (system tools, transcription, voice, launchers)
#   ./install.sh --no-voice       skip the ~2 GB voice environment (Voice Studio, speaker labels, Sinhala voice and transcription)
#   ./install.sh --no-launcher    do not create the LexCut and Stop LexCut launchers (Mac: ~/Applications, Linux: app menu)
#   ./install.sh --download-models  also download the Whisper, Sinhala Whisper and OpenVoice models now instead of on first use
#   ./install.sh --mcp            also register the Claude connector (claude mcp add opencut ...)
#
# Environment overrides: LEXCUT_TTS_VENV (voice environment folder, default ~/.opencut/venv-tts),
# LEXCUT_PORT (launcher port, default 8765).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VOICE=1 LAUNCHER=1 MODELS=0 MCP=0
for a in "$@"; do
  case "$a" in
    --no-voice) VOICE=0 ;;
    --no-launcher) LAUNCHER=0 ;;
    --download-models) MODELS=1 ;;
    --mcp) MCP=1 ;;
    -h|--help) sed -n 2,11p "$0"; exit 0 ;;
    *) echo "Unknown option: $a (see --help)"; exit 1 ;;
  esac
done
TTS_VENV="${LEXCUT_TTS_VENV:-$HOME/.opencut/venv-tts}"
PORT="${LEXCUT_PORT:-8765}"
say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

OS="$(uname -s)"
case "$OS" in
  Darwin|Linux) ;;
  *) echo "This installer is for macOS and Linux. On Windows, double-click install.cmd."; exit 1 ;;
esac
# Apple Silicon Macs use mlx-whisper; Intel Macs and Linux use faster-whisper (CPU, or an NVIDIA GPU with CUDA).
if [ "$OS" = Darwin ] && [ "$(uname -m)" = arm64 ]; then WHISPER=mlx; else WHISPER=faster; fi

# 1. System tools
if [ "$OS" = Darwin ]; then
  say "System tools (Homebrew, Python 3.11, ffmpeg)"
  if ! command -v brew >/dev/null; then
    for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)"; done
  fi
  command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh  then run ./install.sh again."; exit 1; }
  for p in python@3.11 ffmpeg; do brew list "$p" >/dev/null 2>&1 || brew install "$p"; done
  PY="$(brew --prefix python@3.11)/bin/python3.11"
else
  say "System tools (Python 3, ffmpeg, eSpeak NG voices)"
  SUDO=""; [ "$(id -u)" = 0 ] || SUDO="sudo"
  if command -v apt-get >/dev/null; then
    $SUDO apt-get update -q
    $SUDO apt-get install -y -q python3 python3-venv python3-dev ffmpeg espeak-ng curl build-essential
  elif command -v dnf >/dev/null; then
    $SUDO dnf install -y python3 python3-devel ffmpeg-free espeak-ng curl gcc gcc-c++ \
      || $SUDO dnf install -y python3 python3-devel ffmpeg espeak-ng curl gcc gcc-c++
  elif command -v pacman >/dev/null; then
    $SUDO pacman -S --needed --noconfirm python ffmpeg espeak-ng curl base-devel
  elif command -v zypper >/dev/null; then
    $SUDO zypper --non-interactive install python3 python3-devel ffmpeg espeak-ng curl gcc gcc-c++
  else
    echo "Unknown package manager. Install Python 3.10-3.12 (with venv), ffmpeg, espeak-ng and curl, then run ./install.sh again."
  fi
  # The AI libraries support Python 3.10-3.12: take the first suitable one.
  PY=""
  for c in python3.11 python3.12 python3.10 python3; do
    if command -v "$c" >/dev/null && "$c" -c 'import sys; sys.exit(not ((3, 10) <= sys.version_info[:2] <= (3, 12)))'; then
      PY="$(command -v "$c")"; break
    fi
  done
  if [ -z "$PY" ]; then
    echo "Python 3.10, 3.11 or 3.12 is needed (this system has $(python3 --version 2>&1))."
    echo "Install one (with your package manager, pyenv or uv), then run ./install.sh again."
    exit 1
  fi
  if ! "$PY" -c 'import venv, ensurepip' 2>/dev/null && command -v apt-get >/dev/null; then
    $SUDO apt-get install -y -q "python$("$PY" -c 'import sys; print("%d.%d" % sys.version_info[:2])')-venv"
  fi
fi
"$PY" --version

# 2. Transcription (.venv next to server.py)
if [ "$WHISPER" = mlx ]; then REQ=whisper.txt; else REQ=whisper-faster.txt; fi
say "Transcription environment (.venv, $WHISPER-whisper)"
[ -x "$ROOT/.venv/bin/python" ] || "$PY" -m venv "$ROOT/.venv"
"$ROOT/.venv/bin/python" -m pip install -q --upgrade pip
"$ROOT/.venv/bin/python" -m pip install -q -r "$ROOT/requirements/$REQ"

# 3. Voice Studio, speaker labels, voice tools (kept on the internal disk: ._ files on exFAT drives break pip)
if [ "$VOICE" = 1 ]; then
  say "Voice environment ($TTS_VENV: Coqui XTTS, Resemblyzer), about 2 GB"
  mkdir -p "$(dirname "$TTS_VENV")"
  [ -x "$TTS_VENV/bin/python" ] || "$PY" -m venv "$TTS_VENV"
  "$TTS_VENV/bin/python" -m pip install -q --upgrade pip
  "$TTS_VENV/bin/python" -m pip install -q -r "$ROOT/requirements/voice.txt"
  "$TTS_VENV/bin/python" -m pip install -q --no-deps Resemblyzer==0.1.4
  # Sinhala voice: Piper model trained on OpenSLR 30 (MIT), https://huggingface.co/chan4lk/piper-tts-sinhala
  mkdir -p "$ROOT/models/piper"
  for f in si_LK-sinhala-medium.onnx si_LK-sinhala-medium.onnx.json; do
    [ -s "$ROOT/models/piper/$f" ] || curl -fL --progress-bar -o "$ROOT/models/piper/$f" "https://huggingface.co/chan4lk/piper-tts-sinhala/resolve/main/$f"
  done
  echo "The XTTS voice model (~2 GB) downloads the first time you create a voice, after you accept its licence in the app."
fi

# 4. Optional: Whisper model now
if [ "$MODELS" = 1 ]; then
  say "Downloading models into models/"
  if [ "$WHISPER" = mlx ]; then
    HF_HOME="$ROOT/models" "$ROOT/.venv/bin/python" -c "from huggingface_hub import snapshot_download; snapshot_download('mlx-community/whisper-large-v3-mlx')"
  else
    HF_HOME="$ROOT/models" "$ROOT/.venv/bin/python" -c "from faster_whisper.utils import download_model; download_model('large-v3')"
  fi
  if [ "$VOICE" = 1 ]; then
    HF_HUB_CACHE="$ROOT/models/hub" "$TTS_VENV/bin/python" -c "from huggingface_hub import snapshot_download; snapshot_download('SinhaSpeech/whisper-small-sinhala-run12-best')"
    TTS_HOME="$ROOT/models/tts" COQUI_TOS_AGREED=1 "$TTS_VENV/bin/python" -c "from TTS.api import TTS; TTS('voice_conversion_models/multilingual/multi-dataset/openvoice_v2')" >/dev/null
  fi
fi

# 5. Claude features (chat assistant, grammar fix, highlights, MCP connector)
say "Claude Code CLI"
if command -v claude >/dev/null || [ -x "$HOME/.local/bin/claude" ]; then
  echo "Found claude. The Claude features use your Claude login (no API key)."
  if [ "$MCP" = 1 ]; then
    CL="$(command -v claude || echo "$HOME/.local/bin/claude")"
    "$CL" mcp get opencut >/dev/null 2>&1 && echo "Connector 'opencut' already registered." \
      || "$CL" mcp add opencut -- python3 "$ROOT/opencut_mcp.py"
  else
    echo "To let Claude edit your project: claude mcp add opencut -- python3 \"$ROOT/opencut_mcp.py\"  (or run ./install.sh --mcp)"
  fi
else
  echo "Not found. Claude features stay off until you install it: https://claude.com/claude-code"
fi

# 6. Launchers
chmod +x "$ROOT/lexcut.sh"
if [ "$LAUNCHER" = 1 ] && [ "$OS" = Linux ]; then
  say "Launchers in the app menu"
  apps="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  mkdir -p "$apps"
  for pair in "LexCut|start|video-x-generic|lexcut" "Stop LexCut|stop|process-stop|stop-lexcut"; do
    IFS='|' read -r name act icon file <<<"$pair"
    printf '%s\n' "[Desktop Entry]" "Type=Application" "Name=$name" "Comment=LexCut video editor ($act the local server)" \
      "Exec=\"$ROOT/lexcut.sh\" $act $PORT" "Icon=$icon" "Terminal=false" "Categories=AudioVideo;Video;AudioVideoEditing;" > "$apps/$file.desktop"
    chmod +x "$apps/$file.desktop"
    echo "Created $apps/$file.desktop"
  done
  if command -v update-desktop-database >/dev/null; then update-desktop-database "$apps" 2>/dev/null || true; fi
fi
if [ "$LAUNCHER" = 1 ] && [ "$OS" = Darwin ]; then
  say "Launchers in ~/Applications"
  mkdir -p "$HOME/Applications"
  tmp="$(mktemp -d)"
  cat > "$tmp/start.applescript" <<EOF
set root to "$ROOT"
try
	do shell script "test -d " & quoted form of root
on error
	display dialog "The LexCut folder is not available (" & root & "). If it is on an external drive, plug it in and open LexCut again." buttons {"OK"} default button 1 with icon caution
	return
end try
set isRunning to false
try
	do shell script "/usr/bin/curl -s -o /dev/null --max-time 2 http://localhost:$PORT/"
	set isRunning to true
end try
if not isRunning then
	do shell script "PATH=/opt/homebrew/bin:/usr/local/bin:\$PATH nohup sh -c " & quoted form of ("cd " & quoted form of root & " && exec python3 server.py $PORT") & " >/tmp/lexcut.log 2>&1 </dev/null &"
	repeat 30 times
		delay 0.5
		try
			do shell script "/usr/bin/curl -s -o /dev/null --max-time 1 http://localhost:$PORT/"
			exit repeat
		end try
	end repeat
end if
do shell script "/usr/bin/open http://localhost:$PORT/"
EOF
  cat > "$tmp/stop.applescript" <<EOF
set pids to ""
try
	set pids to do shell script "/usr/sbin/lsof -ti tcp:$PORT -sTCP:LISTEN"
end try
if pids is "" then
	display dialog "The LexCut server is not running." buttons {"OK"} default button 1 with icon note giving up after 6
	return
end if
display dialog "Stop the LexCut server?" & return & return & "Anything still being generated will be lost. Your project stays saved in your browser." buttons {"Cancel", "Stop server"} default button "Stop server" cancel button "Cancel" with icon caution
do shell script "/bin/kill " & (do shell script "echo " & quoted form of pids & " | tr '\\\\n' ' '")
display dialog "LexCut server stopped." buttons {"OK"} default button 1 with icon note giving up after 5
EOF
  for pair in "LexCut:start" "Stop LexCut:stop"; do
    app="$HOME/Applications/${pair%%:*}.app"
    if [ -e "$app" ]; then echo "Keeping existing $app"; else osacompile -o "$app" "$tmp/${pair##*:}.applescript" && echo "Created $app"; fi
  done
  rm -rf "$tmp"
fi

# 7. Summary
say "Summary"
ok() { if eval "$2"; then echo "  [x] $1"; else echo "  [ ] $1"; fi; }
ok "ffmpeg (export, noise removal, scene and silence detection)" 'command -v ffmpeg >/dev/null'
ok "Transcription ($WHISPER-whisper)" '"$ROOT/.venv/bin/python" -c "import ${WHISPER}_whisper" 2>/dev/null'
voice_ok() { [ -x "$TTS_VENV/bin/python" ] && "$TTS_VENV/bin/python" - <<'PY' 2>/dev/null
import sys, types
sys.modules["webrtcvad"] = types.ModuleType("webrtcvad")  # same stub the app uses
import TTS, resemblyzer
PY
}
ok "Voice Studio and speaker labels" voice_ok
ok "Sinhala voice (Piper + OpenVoice) and Sinhala transcription" '[ -s "$ROOT/models/piper/si_LK-sinhala-medium.onnx" ] && "$TTS_VENV/bin/python" -c "import piper, transformers" 2>/dev/null'
ok "Claude features (claude CLI)" 'command -v claude >/dev/null || [ -x "$HOME/.local/bin/claude" ]'
if [ "$OS" = Linux ]; then ok "Ready-made voices (eSpeak NG)" 'command -v espeak-ng >/dev/null || command -v espeak >/dev/null'; fi
echo "  Paid cloud tools (Replicate) need no install: paste your key in AI > AI Cloud tools > Settings."
echo
if [ "$OS" = Darwin ]; then
  echo "Start LexCut:  open ~/Applications/LexCut.app   (or: \"$ROOT/lexcut.sh\" start)"
else
  echo "Start LexCut:  open LexCut from your app menu   (or: \"$ROOT/lexcut.sh\" start)"
fi
echo "Then open http://localhost:$PORT/ in Chrome."
