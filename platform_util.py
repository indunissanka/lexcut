"""Small helpers so LexCut runs on macOS, Windows and Linux."""
import os
import shutil
import sys
from pathlib import Path

IS_WIN = os.name == "nt"
IS_MAC = sys.platform == "darwin"


def venv_python(venv) -> Path:
    """The Python inside a virtual environment (bin/python on macOS/Linux, Scripts\\python.exe on Windows)."""
    venv = Path(venv)
    return venv / "Scripts" / "python.exe" if IS_WIN else venv / "bin" / "python"


def extra_paths() -> list:
    """Folders where tools such as ffmpeg and claude are often installed but may be missing from PATH."""
    home = Path.home()
    if IS_WIN:
        local = Path(os.environ.get("LOCALAPPDATA") or home / "AppData" / "Local")
        roaming = Path(os.environ.get("APPDATA") or home / "AppData" / "Roaming")
        return [str(home / ".local" / "bin"), str(roaming / "npm"), str(local / "Microsoft" / "WinGet" / "Links"),
                str(home / "scoop" / "shims"), r"C:\ProgramData\chocolatey\bin", r"C:\ffmpeg\bin"]
    return [str(home / ".local" / "bin"), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"]


def which(name: str):
    return shutil.which(name, path=os.pathsep.join([*extra_paths(), os.environ.get("PATH", "")]))
