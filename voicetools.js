'use strict';
// Voice Studio > Voice tools: ready-made male/female voices (local), speech to speech, voice isolation and lip sync (paid, Replicate).
(() => {
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const LANG = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', nl: 'Dutch', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish', sv: 'Swedish', da: 'Danish', nb: 'Norwegian', fi: 'Finnish', el: 'Greek', he: 'Hebrew', th: 'Thai', id: 'Indonesian', cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', uk: 'Ukrainian', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali', vi: 'Vietnamese', ms: 'Malay' };
const TONE = { neutral: 'Neutral', cheerful: 'Cheerful', excited: 'Excited', calm: 'Calm', serious: 'Serious', sad: 'Sad', 'whisper-like': 'Soft' };
let sys = null, vs = [], pane = null, player = null;
const S = { gender: '', lang: 'en', voice: '', speed: 1, pitch: 0, tone: 'neutral', text: '' };

async function jget(u) { const r = await fetch(u); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'request failed'); return j; }
async function speak() {
  const q = new URLSearchParams({ voice: S.voice, speed: S.speed, pitch: S.pitch, tone: S.tone });
  const r = await fetch('/api/vt/speak?' + q, { method: 'POST', body: S.text });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'could not speak');
  return r.blob();
}
const sel = f => { const c = selClip(); return c && c.text == null && (f ? f(c) : true) ? c : null; };
const soundClip = () => { const c = sel(); if (!c) return null; if (clipKind(c) === 'video' && c.silent) return partners(c).find(p => clipKind(p) === 'audio') || null; return clipKind(c) === 'image' ? null : c; };
function aiTrack() {
  let i = TRACKS.findIndex((t, k) => t.kind === 'audio' && t.name === 'AI Voice' && LANE_ORDER.includes(k));
  if (i >= 0) return i;
  addLayer('audio'); i = TRACKS.length - 1; TRACKS[i].name = 'AI Voice'; buildLabels(); renderTimeline();
  return i;
}
async function blobAsset(blob, name, type) { const a = await loadAsset(new File([blob], name, { type }), uid()); state.assets.set(a.id, a); renderBin(); return a; }
const $p = s => pane.querySelector(s);
const msg = (id, t) => { const e = $p('#' + id); if (e) e.textContent = t; };

function render(p, voices) {
  pane = p; vs = voices;
  p.innerHTML = `<p class="muted">Voice tools: ready-made voices run on this computer. Speech to speech, voice isolation and lip sync are paid cloud features (Replicate): set them up in AI &gt; AI Cloud tools &gt; Settings.</p>
  <div class="vs-box"><h4>Ready-made voices (male and female, free, on this computer)</h4><div id="vt-ready">Loading voices…</div></div>
  <div class="vs-box"><h4>Speech to speech</h4>
    <p class="muted">Re-speaks the selected clip's talking in another voice, keeping words, timing and delivery. You need a speech-to-speech model in the AI Cloud settings (no default model is set).</p>
    <label>Target voice</label><select id="vt-s2s-voice"><option value="">Choose…</option>${vs.filter(v => v.samples && v.samples.length || v.status === 'ready').map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}<option value="__file">A recording from my computer…</option></select>
    <input type="file" id="vt-s2s-file" accept="audio/*,video/*" hidden>
    <div class="vs-row"><button type="button" id="vt-s2s-go">Convert selected clip</button></div><p class="muted" id="vt-s2s-msg"></p></div>
  <div class="vs-box"><h4>Voice isolation</h4><p class="muted">Keeps only the voice of the selected clip and removes music and background (AI stem separation). The cleaned sound replaces the clip's sound; Undo brings the original back.</p>
    <div class="vs-row"><button type="button" id="vt-iso-go">Isolate voice of selected clip</button></div><p class="muted" id="vt-iso-msg"></p></div>
  <div class="vs-box"><h4>Lip sync</h4><p class="muted">Changes the mouth movements of the selected video clip to match another sound (for example a translated or generated voice). The sound clip must start at or before the video clip.</p>
    <label>Sound to match</label><select id="vt-ls-audio"></select>
    <div class="vs-row"><button type="button" id="vt-ls-go">Lip sync selected video clip</button></div><p class="muted" id="vt-ls-msg"></p></div>
  <label class="check" style="display:block;margin-top:8px"><input type="checkbox" id="vt-ok" ${localStorage.getItem('oc-cloud-ok') === '1' ? 'checked' : ''}> I understand cloud tools upload the clip to Replicate (a third party) and cost money on my Replicate account.</label>`;
  fillAudioChoices();
  renderReady();
  $p('#vt-ok').onchange = e => localStorage.setItem('oc-cloud-ok', e.target.checked ? '1' : '0');
  $p('#vt-s2s-voice').onchange = e => { if (e.target.value === '__file') $p('#vt-s2s-file').click(); };
  $p('#vt-s2s-go').onclick = s2s; $p('#vt-iso-go').onclick = isolate; $p('#vt-ls-go').onclick = lipsync;
}
function fillAudioChoices() {
  const cs = state.clips.filter(c => c.text == null && (c.audioOnly || clipKind(c) === 'audio')).sort((a, b) => a.start - b.start);
  $p('#vt-ls-audio').innerHTML = cs.map(c => `<option value="${c.id}">${esc(assetOf(c).name)} (from ${c.start.toFixed(1)} s)</option>`).join('') || '<option value="">No sound clips on the timeline</option>';
}

// ---------- ready-made voices ----------
async function renderReady() {
  const box = $p('#vt-ready');
  try { if (!sys) sys = await jget('/api/vt/voices'); } catch (e) { box.textContent = 'Could not list voices: ' + e.message; return; }
  if (!sys.voices.length) { box.textContent = 'No ready-made voices were found on this computer (they come with macOS and Windows).'; return; }
  const langs = [...new Set(sys.voices.map(v => v.lang))].sort((a, b) => (LANG[a] || a).localeCompare(LANG[b] || b));
  const list = () => sys.voices.filter(v => v.lang === S.lang && (!S.gender || v.gender === S.gender));
  const draw = () => {
    const l = list();
    if (!l.find(v => v.name === S.voice)) S.voice = l[0] ? l[0].name : '';
    $p('#vt-voice').innerHTML = l.map(v => `<option value="${esc(v.name)}" ${v.name === S.voice ? 'selected' : ''}>${esc(v.name)} · ${v.gender || 'unspecified'} · ${esc(v.locale)}</option>`).join('') || '<option value="">No voice matches</option>';
  };
  box.innerHTML = `<div class="vs-grid"><div><label>Language</label><select id="vt-lang">${langs.map(c => `<option value="${c}" ${c === S.lang ? 'selected' : ''}>${esc(LANG[c] || c)}</option>`).join('')}</select></div>
    <div><label>Voice type</label><select id="vt-gender"><option value="">Male and female</option><option value="female" ${S.gender === 'female' ? 'selected' : ''}>Female</option><option value="male" ${S.gender === 'male' ? 'selected' : ''}>Male</option></select></div></div>
    <label>Voice</label><select id="vt-voice"></select>
    <label>Tone</label><select id="vt-tone">${Object.entries(TONE).map(([k, v]) => `<option value="${k}" ${k === S.tone ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <label>Speed: <b id="vt-speed-v">${S.speed.toFixed(2)}x</b></label><input type="range" id="vt-speed" min="0.6" max="1.6" step="0.05" value="${S.speed}">
    <label>Pitch: <b id="vt-pitch-v">${S.pitch > 0 ? '+' : ''}${S.pitch}</b> semitones</label><input type="range" id="vt-pitch" min="-8" max="8" step="1" value="${S.pitch}">
    <label>Text</label><textarea id="vt-text" rows="4" placeholder="Type or paste what the voice should say">${esc(S.text)}</textarea>
    <p class="muted">Tone changes speed, pitch and pauses; it is not true emotion. Gender is known for common voices only.</p>
    <div class="vs-row"><button type="button" id="vt-play">Preview</button><button type="button" id="vt-add" class="primary">Add to timeline</button></div><p class="muted" id="vt-msg"></p>`;
  draw();
  $p('#vt-lang').onchange = e => { S.lang = e.target.value; draw(); };
  $p('#vt-gender').onchange = e => { S.gender = e.target.value; draw(); };
  $p('#vt-voice').onchange = e => { S.voice = e.target.value; };
  $p('#vt-tone').onchange = e => { S.tone = e.target.value; };
  $p('#vt-speed').oninput = e => { S.speed = +e.target.value; $p('#vt-speed-v').textContent = S.speed.toFixed(2) + 'x'; };
  $p('#vt-pitch').oninput = e => { S.pitch = +e.target.value; $p('#vt-pitch-v').textContent = (S.pitch > 0 ? '+' : '') + S.pitch; };
  $p('#vt-text').oninput = e => { S.text = e.target.value; };
  $p('#vt-play').onclick = async e => {
    e.target.disabled = true; msg('vt-msg', 'Speaking…');
    try { const b = await speak(); if (player) player.pause(); player = new Audio(URL.createObjectURL(b)); await player.play(); msg('vt-msg', ''); } catch (err) { msg('vt-msg', err.message); }
    e.target.disabled = false;
  };
  $p('#vt-add').onclick = async e => {
    e.target.disabled = true; msg('vt-msg', 'Generating…');
    try {
      const b = await speak(), a = await blobAsset(b, `${S.voice} - ${S.text.slice(0, 24).replace(/[\\/:*?"<>|]/g, '')}.wav`, 'audio/wav');
      pushHistory();
      const track = aiTrack(); let start = state.t;
      if (!fits({ id: -1 }, start, a.dur, track)) start = laneEnd(track);
      const c = newMediaClip(a, track, start); state.clips.push(c); state.sel = c.id; afterEdit();
      msg('vt-msg', 'Added to the "AI Voice" layer.');
    } catch (err) { msg('vt-msg', err.message); }
    e.target.disabled = false;
  };
}

// ---------- cloud helpers ----------
async function cloud(slot, query, body, say) {
  if (!window.aiCloud) throw new Error('AI Cloud tools are not loaded.');
  localStorage.setItem('oc-cloud-ok', $p('#vt-ok').checked ? '1' : '0');
  return window.aiCloud.runJob(slot, query, body, say);
}
function srcFile(c) { const a = assetOf(c); if (!a || !a.file) throw new Error('The original file is not available.'); if (hasRamp(c)) throw new Error('This clip has a speed ramp. Remove the ramp first.'); return a; }

async function s2s() {
  const id = 'vt-s2s-msg', b = $p('#vt-s2s-go');
  b.disabled = true;
  try {
    const c = soundClip(); if (!c) throw new Error('Select a clip with speech first.');
    const a = srcFile(c), v = $p('#vt-s2s-voice').value, f = $p('#vt-s2s-file').files[0], query = { ss: c.in.toFixed(3), t: (c.dur * spd(c)).toFixed(3) };
    if (v === '__file') { if (!f) throw new Error('Choose the recording of the target voice.'); query.aux = await window.aiCloud.auxUpload(f); }
    else if (v) query.ref_voice = v;
    else throw new Error('Choose the target voice.');
    const blob = await cloud('s2s', query, a.file, t => msg(id, t));
    const na = await blobAsset(blob, a.name.replace(/\.[^.]+$/, '') + ' (converted).wav', blob.type || 'audio/wav');
    pushHistory();
    const track = aiTrack(); let start = c.start;
    const nc = newMediaClip(na, track, start); nc.dur = Math.min(na.dur, c.dur);
    if (!fits(nc, start, nc.dur, track)) { addLayer('audio'); nc.track = TRACKS.length - 1; }
    state.clips.push(nc); c.vol = 0; state.sel = nc.id; afterEdit();
    msg(id, 'Done. The converted voice is on the "AI Voice" layer and the original clip was muted. Undo with Ctrl/Cmd+Z.');
  } catch (e) { msg(id, 'Could not convert: ' + e.message); }
  b.disabled = false;
}
async function isolate() {
  const id = 'vt-iso-msg', b = $p('#vt-iso-go');
  b.disabled = true;
  try {
    const c = soundClip(); if (!c) throw new Error('Select a clip with sound first.');
    const a = srcFile(c), cid = c.id;
    const blob = await cloud('isolate', { ss: c.in.toFixed(3), t: (c.dur * spd(c)).toFixed(3) }, a.file, t => msg(id, t));
    const na = await blobAsset(blob, a.name.replace(/\.[^.]+$/, '') + ' (voice only).wav', blob.type || 'audio/wav');
    const cc = state.clips.find(o => o.id === cid); if (!cc) throw new Error('The clip was removed meanwhile.');
    pushHistory(); cc.assetId = na.id; cc.in = 0; cc.dur = Math.min(cc.dur, na.dur / spd(cc)); afterEdit();
    msg(id, 'Done. The clip now plays only the voice.');
  } catch (e) { msg(id, 'Could not isolate: ' + e.message); }
  b.disabled = false;
}
async function lipsync() {
  const id = 'vt-ls-msg', b = $p('#vt-ls-go');
  b.disabled = true;
  try {
    const c = sel(k => clipKind(k) === 'video'); if (!c) throw new Error('Select a video clip first.');
    const ac = state.clips.find(o => o.id === +$p('#vt-ls-audio').value); if (!ac) throw new Error('Choose the sound to match.');
    const va = srcFile(c), aa = srcFile(ac), cid = c.id;
    if (ac.start > c.start + 0.01) throw new Error('The sound clip starts after the video clip. Move it to start at or before the video.');
    const dur = Math.min(c.dur, ac.start + ac.dur - c.start);
    if (dur < 0.5) throw new Error('The sound does not cover the video clip.');
    const aux = await window.aiCloud.auxUpload(aa.file);
    const blob = await cloud('lipsync', { aux, ss: c.in.toFixed(3), t: (dur * spd(c)).toFixed(3), ass: (ac.in + (c.start - ac.start) * spd(ac)).toFixed(3), at: (dur * spd(ac)).toFixed(3) }, va.file, t => msg(id, t));
    const na = await blobAsset(blob, va.name.replace(/\.[^.]+$/, '') + ' (lip sync).mp4', blob.type || 'video/mp4');
    const cc = state.clips.find(o => o.id === cid); if (!cc) throw new Error('The clip was removed meanwhile.');
    pushHistory(); if (!cc.silent) detachAudio(cc);
    cc.assetId = na.id; cc.in = 0; cc.dur = Math.min(dur, na.dur / spd(cc)); afterEdit();
    msg(id, 'Done. The picture now matches the sound.');
  } catch (e) { msg(id, 'Could not lip sync: ' + e.message); }
  b.disabled = false;
}
window.vsTools = { render };
})();
