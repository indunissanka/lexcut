"""Adapter interface every voice engine implements. The rest of the app only talks to this."""


class Cancelled(Exception):
    pass


class VoiceEngine:
    id = ""
    name = ""
    model = ""
    kind = "local"                 # "local" or "api"

    def capabilities(self) -> dict:
        """Honest description of what THIS engine can do. The UI only shows controls listed here:
        {installed, ready, notice, languages:[{code,name,note}], unsupported:[{name,reason}],
         controls:{speed:[min,max], pitch, emotion, gender, similarity, voice_conversion}}"""
        raise NotImplementedError

    def prepare_voice(self, voice: dict, sample_paths: list, workdir) -> None:
        """Create/validate whatever the engine needs for this voice (raises on failure)."""
        raise NotImplementedError

    def synthesize(self, voice: dict, req: dict, out_path, workdir) -> None:
        """Write 24 kHz-or-native WAV speech for req['text'] to out_path. Raise Cancelled if cancel() was called."""
        raise NotImplementedError

    def cancel(self) -> None:
        pass

    def delete_voice(self, voice: dict, workdir) -> None:
        pass


# Speaking styles. Engines map these onto the controls they truly have; they do not claim emotion modelling.
STYLES = {
    "natural":        dict(label="Natural",              speed=1.00, rand=0.00, sentence_pause=0.35, paragraph_pause=0.80),
    "professional":   dict(label="Professional narration", speed=0.97, rand=-0.10, sentence_pause=0.40, paragraph_pause=0.90),
    "conversational": dict(label="Conversational",       speed=1.05, rand=0.05, sentence_pause=0.25, paragraph_pause=0.60),
    "documentary":    dict(label="Documentary narration", speed=0.92, rand=-0.08, sentence_pause=0.50, paragraph_pause=1.10),
    "storytelling":   dict(label="Storytelling",         speed=0.95, rand=0.10, sentence_pause=0.50, paragraph_pause=1.20),
    "excited":        dict(label="Excited / enthusiastic", speed=1.10, rand=0.15, sentence_pause=0.20, paragraph_pause=0.50),
    "calm":           dict(label="Calm",                 speed=0.90, rand=-0.10, sentence_pause=0.50, paragraph_pause=1.00),
    "serious":        dict(label="Serious",              speed=0.93, rand=-0.12, sentence_pause=0.45, paragraph_pause=1.00),
}
