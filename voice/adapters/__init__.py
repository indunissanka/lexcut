"""Engine registry. Add a provider by implementing VoiceEngine and registering it here
(e.g. ElevenLabs, F5-TTS). The active one is chosen by `provider` in ~/.opencut/voice_config.json."""
from .. import config

_engines = {}


def get(provider_id=None):
    pid = provider_id or config.load()["provider"]
    if pid not in _engines:
        if pid == "xtts":
            from .xtts import XttsEngine
            _engines[pid] = XttsEngine()
        else:
            raise RuntimeError(f"Voice provider '{pid}' is not available. Installed providers: xtts.")
    return _engines[pid]
