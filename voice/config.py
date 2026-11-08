"""Server-side configuration. Lives outside the web root; the browser never sees it (API keys included).

~/.opencut/voice_config.json example:
{ "provider": "xtts", "device": "auto", "license_accepted": false,
  "providers": { "elevenlabs": { "api_key": "..." } } }
"""
import json
import os
import threading
from pathlib import Path

HOME = Path.home() / ".opencut"
CONFIG_PATH = HOME / "voice_config.json"
DEFAULTS = {"provider": "xtts", "device": "auto", "license_accepted": False, "providers": {}}
_lock = threading.Lock()


def load() -> dict:
    with _lock:
        cfg = dict(DEFAULTS)
        try:
            cfg.update(json.loads(CONFIG_PATH.read_text()))
        except (OSError, ValueError):
            pass
        return cfg


def update(**kw) -> dict:
    with _lock:
        try:
            cfg = {**DEFAULTS, **json.loads(CONFIG_PATH.read_text())}
        except (OSError, ValueError):
            cfg = dict(DEFAULTS)
        cfg.update(kw)
        HOME.mkdir(mode=0o700, parents=True, exist_ok=True)
        CONFIG_PATH.write_text(json.dumps(cfg, indent=1))
        os.chmod(CONFIG_PATH, 0o600)
        return cfg


def data_dir() -> Path:
    """Voice samples, generated audio and the database. Private to this user (mode 700)."""
    d = Path(os.environ.get("OPENCUT_VOICE_DATA", HOME / "voice_data"))
    for sub in ("", "samples", "out", "tmp"):
        (d / sub).mkdir(mode=0o700, parents=True, exist_ok=True)
    return d
