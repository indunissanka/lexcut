#!/usr/bin/env bash
# Start or stop the LexCut server on macOS or Linux. The Linux app-menu launchers that install.sh creates use it.
#   ./lexcut.sh start [port]    start the server (if needed) and open the editor in the browser
#   ./lexcut.sh stop [port]     stop the server
# On Windows, use lexcut.ps1 (the LexCut shortcuts).
ROOT="$(cd "$(dirname "$0")" && pwd)"
ACTION="${1:-start}"
PORT="${2:-${LEXCUT_PORT:-8765}}"
URL="http://localhost:$PORT/"
LOG="${TMPDIR:-/tmp}/lexcut.log"

message() {   # a desktop dialog when there is one, else the terminal
  if command -v zenity >/dev/null && [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then zenity --info --title=LexCut --text="$1" 2>/dev/null
  elif command -v kdialog >/dev/null && [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then kdialog --title LexCut --msgbox "$1" 2>/dev/null
  elif command -v osascript >/dev/null; then osascript -e "display dialog \"$1\" buttons {\"OK\"} default button 1 with title \"LexCut\"" >/dev/null 2>&1
  else echo "$1"; fi
}
running() { curl -s -o /dev/null --max-time 2 "$URL"; }
cmdline() {   # the command line of a process
  if [ -r "/proc/$1/cmdline" ]; then tr '\0' ' ' < "/proc/$1/cmdline"; else ps -o command= -p "$1" 2>/dev/null; fi
}
server_pids() {   # only LexCut's own server (python running this folder's server.py), never another program on the port
  local pids
  if command -v lsof >/dev/null; then pids="$(lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null)"
  elif command -v ss >/dev/null; then pids="$(ss -Hltnp "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2)"
  fi
  for p in $pids; do
    case "$(cmdline "$p")" in
      *"$ROOT/server.py"*) echo "$p" ;;
      *server.py*) [ "$(readlink "/proc/$p/cwd" 2>/dev/null)" = "$ROOT" ] && echo "$p" ;;   # started by hand from this folder
    esac
  done | sort -u
}

case "$ACTION" in
  start)
    if ! running; then
      PY=python3
      [ -x "$ROOT/.venv/bin/python" ] && PY="$ROOT/.venv/bin/python"
      command -v "$PY" >/dev/null || { message "Python 3 was not found. Run install.sh in $ROOT first."; exit 1; }
      cd "$ROOT" || exit 1
      nohup "$PY" "$ROOT/server.py" "$PORT" >"$LOG" 2>&1 </dev/null &
      for _ in $(seq 30); do running && break; sleep 0.5; done
      running || { message "LexCut did not start. See $LOG"; exit 1; }
    fi
    if command -v xdg-open >/dev/null; then xdg-open "$URL" >/dev/null 2>&1 &
    elif command -v open >/dev/null; then open "$URL"
    else echo "LexCut is running: $URL"; fi
    ;;
  stop)
    pids="$(server_pids)"
    if [ -z "$pids" ]; then message "The LexCut server is not running."; exit 0; fi
    kill $pids
    message "LexCut server stopped. Your project stays saved in your browser."
    ;;
  *)
    echo "Usage: $0 start|stop [port]"; exit 1 ;;
esac
