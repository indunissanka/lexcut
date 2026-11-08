// Speech-to-text in the browser with Whisper (transformers.js). The model downloads once from
// Hugging Face and is cached by the browser; audio never leaves this computer.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0/dist/transformers.min.js';

env.allowLocalModels = false;
const cache = new Map();

window.whisperTranscribe = async (audio, { model, language }, onStatus) => {
  if (!cache.has(model)) {
    cache.set(model, pipeline('automatic-speech-recognition', model, {
      progress_callback: p => {
        if (p.status === 'progress' && p.total) onStatus(`Downloading model: ${Math.round(p.loaded / p.total * 100)}% (${p.file.split('/').pop()})`);
      },
    }));
  }
  let asr;
  try { asr = await cache.get(model); } catch (e) { cache.delete(model); throw e; }
  onStatus('Transcribing… this can take a while');
  const opts = { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5, task: 'transcribe' };
  if (language) opts.language = language;
  const out = await asr(audio, opts);
  return (out.chunks || []).map(c => ({ start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] + 2, text: c.text.trim() })).filter(c => c.text);
};
window.dispatchEvent(new Event('whisper-ready'));
