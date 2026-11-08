#!/usr/bin/env bash
# LexCut installer for macOS on Apple Silicon. Safe to run again: it only adds what is missing.
#
#   ./install.sh                  everything (system tools, transcription, voice, launchers)
#   ./install.sh --no-voice       skip the ~2 GB voice environment (Voice Studio, speaker labels)
#   ./install.sh --no-launcher    do not create ~/Applications/LexCut.app and Stop LexCut.app
#   ./install.sh --download-models  also download the Whisper model now (~3 GB) instead of on first use
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

[ "$(uname -s)" = Darwin ] || { echo "LexCut needs macOS."; exit 1; }
[ "$(uname -m)" = arm64 ] || echo "Warning: transcription (mlx-whisper) needs Apple Silicon; it will not work on this Mac."

# 1. System tools
say "System tools (Homebrew, Python 3.11, ffmpeg)"
if ! command -v brew >/dev/null; then
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)"; done
fi
command -v brew >/dev/null || { echo "Install Homebrew first: https://brew.sh  then run ./install.sh again."; exit 1; }
for p in python@3.11 ffmpeg; do brew list "$p" >/dev/null 2>&1 || brew install "$p"; done
PY="$(brew --prefix python@3.11)/bin/python3.11"
"$PY" --version

# 2. Transcription (.venv next to server.py)
say "Transcription environment (.venv, mlx-whisper)"
[ -x "$ROOT/.venv/bin/python" ] || "$PY" -m venv "$ROOT/.venv"
"$ROOT/.venv/bin/python" -m pip install -q --upgrade pip
"$ROOT/.venv/bin/python" -m pip install -q -r "$ROOT/requirements/whisper.txt"

# 3. Voice Studio, speaker labels, voice tools (kept on the internal disk: ._ files on exFAT drives break pip)
if [ "$VOICE" = 1 ]; then
  say "Voice environment ($TTS_VENV: Coqui XTTS, Resemblyzer), about 2 GB"
  mkdir -p "$(dirname "$TTS_VENV")"
  [ -x "$TTS_VENV/bin/python" ] || "$PY" -m venv "$TTS_VENV"
  "$TTS_VENV/bin/python" -m pip install -q --upgrade pip
  "$TTS_VENV/bin/python" -m pip install -q -r "$ROOT/requirements/voice.txt"
  "$TTS_VENV/bin/python" -m pip install -q --no-deps Resemblyzer==0.1.4
  echo "The XTTS voice model (~2 GB) downloads the first time you create a voice, after you accept its licence in the app."
fi

# 4. Optional: Whisper model now
if [ "$MODELS" = 1 ]; then
  say "Downloading Whisper large-v3 into models/"
  HF_HOME="$ROOT/models" "$ROOT/.venv/bin/python" -c "from huggingface_hub import snapshot_download; snapshot_download('mlx-community/whisper-large-v3-mlx')"
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
if [ "$LAUNCHER" = 1 ]; then
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
ok "Transcription (mlx-whisper)" '"$ROOT/.venv/bin/python" -c "import mlx_whisper" 2>/dev/null'
voice_ok() { [ -x "$TTS_VENV/bin/python" ] && "$TTS_VENV/bin/python" - <<'PY' 2>/dev/null
import sys, types
sys.modules["webrtcvad"] = types.ModuleType("webrtcvad")  # same stub the app uses
import TTS, resemblyzer
PY
}
ok "Voice Studio and speaker labels" voice_ok
ok "Claude features (claude CLI)" 'command -v claude >/dev/null || [ -x "$HOME/.local/bin/claude" ]'
echo "  Paid cloud tools (Replicate) need no install: paste your key in AI > AI Cloud tools > Settings."
echo
echo "Start LexCut:  open ~/Applications/LexCut.app   (or: cd \"$ROOT\" && python3 server.py $PORT)"
echo "Then open http://localhost:$PORT/ in Chrome."
