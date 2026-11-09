'use strict';
// Audio tools: the Sound section for audio clips (EQ, compressor, noise removal, voice enhancement, sync),
// the track mixer, and background music with automatic ducking under speech.
// The live sound chain (EQ > compressor > pan > volume) is in app.js (connectAudio / audioApply).
(() => {
const attr = t => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ---------- Sound section in the inspector ----------
const AFX_PRESETS = {
  flat: { hp: 0, eqLo: 0, eqMid: 0, eqHi: 0, comp: 0 },
  voice: { hp: 90, eqLo: -2, eqMid: 1.5, eqHi: 3, comp: 45 },
  warm: { hp: 60, eqLo: 3, eqMid: 0, eqHi: -2, comp: 20 },
  bright: { hp: 60, eqLo: -1, eqMid: 1, eqHi: 4, comp: 15 },
  phone: { hp: 300, eqLo: -12, eqMid: 5, eqHi: -8, comp: 60 },
};
window.audioSection = function (c) {
  const sl = (f, label, min, max, step, d) => `<label>${label}: <b id="v-${f}">${+(c[f] ?? d)}</b></label><input type="range" min="${min}" max="${max}" step="${step}" data-f="${f}" value="${c[f] ?? d}">`;
  const refs = state.clips.filter(o => o.id !== c.id && o.text == null && assetOf(o) && assetOf(o).kind !== 'image' && !o.silent)
    .map(o => `<option value="${o.id}">${attr(assetOf(o).name)} (at ${o.start.toFixed(1)} s)</option>`).join('');
  return `<h3>Sound: EQ and compressor</h3>`
    + `<div class="row" style="justify-content:flex-start;flex-wrap:wrap">${Object.keys(AFX_PRESETS).map(k => `<button type="button" data-afx="${k}">${{ flat: 'Flat (reset)', voice: 'Clear voice', warm: 'Warm', bright: 'Bright', phone: 'Telephone' }[k]}</button>`).join('')}</div>`
    + sl('hp', 'Cut low rumble below (Hz, 0 = off)', 0, 300, 5, 0) + sl('eqLo', 'Bass (dB)', -12, 12, 0.5, 0) + sl('eqMid', 'Middle (dB)', -12, 12, 0.5, 0) + sl('eqHi', 'Treble (dB)', -12, 12, 0.5, 0)
    + sl('comp', 'Compressor: evens out loud and quiet (0 = off)', 0, 100, 1, 0)
    + `<h3>Noise removal and voice</h3><p class="muted">Cleans this clip's sound on this computer. The cleaned sound replaces it; Undo (Ctrl/Cmd+Z) brings the original back.</p>`
    + `<div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="afx-denoise">Remove background noise</button><button type="button" id="afx-enhance">Enhance voice</button></div><p class="muted" id="afx-status"></p>`
    + `<h3>Sync this sound to another clip</h3><p class="muted">For a separate recording (for example an external microphone): matches it to the sound of the clip you choose, so both play at the same moment.</p>`
    + `<select id="sync-ref"><option value="">Choose the clip to match…</option>${refs}</select><div class="row" style="justify-content:flex-start"><button type="button" id="sync-run">Sync by sound</button></div><p class="muted" id="sync-status"></p>`;
};
$('#inspector').addEventListener('input', e => { const f = e.target.dataset && e.target.dataset.f, v = $('#v-' + f); if (v) v.textContent = e.target.value; });

// clean the sound with the server (ffmpeg) and swap the clip to the cleaned file
async function cleanSound(c, preset, status) {
  const a = assetOf(c);
  if (!a || !a.file) throw new Error('The original file is not available.');
  status.textContent = 'Processing on this computer… a long recording takes a while. Keep this tab open.';
  const r = await fetch('/api/audio/process?preset=' + preset, { method: 'POST', body: a.file });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'The server could not process this file.');
  const blob = await r.blob();
  const na = await loadAsset(new File([blob], a.name.replace(/\.[^.]+$/, '') + (preset === 'denoise' ? ' (denoised).wav' : ' (enhanced).wav'), { type: 'audio/wav' }), uid());
  state.assets.set(na.id, na); renderBin();
  return na;
}

// ---------- audio sync by sound (GCC-PHAT cross-correlation) ----------
function fft(re, im, inv) {   // in place, length a power of two
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = 2 * Math.PI / len * (inv ? -1 : 1), wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const a = i + k, b = a + h, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
const SYNC_SR = 8000, SYNC_SEC = 60;
async function decodeSegment(c) {   // mono 8 kHz samples of the part of the file this clip uses (first 60 s)
  const a = assetOf(c);
  const ac = new AudioContext({ sampleRate: SYNC_SR });
  let buf;
  try { buf = await ac.decodeAudioData(await a.file.arrayBuffer()); } finally { ac.close(); }
  const d = buf.getChannelData(0), from = Math.floor(c.in * SYNC_SR), to = Math.min(d.length, from + Math.floor(Math.min(c.dur * spd(c), SYNC_SEC) * SYNC_SR));
  return d.slice(from, to);
}
function phatLag(x, r) {   // lag (samples) such that r[n] ~ x[n - lag], and how clear the match is
  let N = 1; while (N < x.length + r.length) N <<= 1;
  const xr = new Float64Array(N), xi = new Float64Array(N), rr = new Float64Array(N), ri = new Float64Array(N);
  xr.set(x); rr.set(r);
  fft(xr, xi, false); fft(rr, ri, false);
  for (let i = 0; i < N; i++) {   // R * conj(X), whitened so that only the timing matters
    const a = rr[i] * xr[i] + ri[i] * xi[i], b = ri[i] * xr[i] - rr[i] * xi[i], m = Math.hypot(a, b) + 1e-9;
    xr[i] = a / m; xi[i] = b / m;
  }
  fft(xr, xi, true);
  let best = -Infinity, bi = 0, sum = 0;
  for (let i = 0; i < N; i++) { const v = xr[i]; sum += Math.abs(v); if (v > best) { best = v; bi = i; } }
  return { lag: bi > N / 2 ? bi - N : bi, score: best / (sum / N + 1e-12) };
}
async function syncToRef(c, ref, status) {
  if (partners(c).length) throw new Error('This sound belongs to a video clip. Choose an independent audio clip (for example one from a separate recorder).');
  if (spd(c) !== 1 || spd(ref) !== 1 || hasRamp(c) || hasRamp(ref)) throw new Error('Both clips must play at normal speed.');
  status.textContent = 'Listening to both recordings…';
  const [x, r] = [await decodeSegment(c), await decodeSegment(ref)];
  if (x.length < SYNC_SR || r.length < SYNC_SR) throw new Error('One of the clips is too short to compare.');
  await new Promise(res => setTimeout(res, 0));
  const { lag, score } = phatLag(x, r);
  return { start: ref.start + lag / SYNC_SR, lag: lag / SYNC_SR, score };
}

// ---------- clicks in the inspector ----------
$('#inspector').addEventListener('click', async e => {
  const b = e.target.closest('button'), c = selClip();
  if (!b || !c) return;
  if (b.dataset.afx) {
    pushHistory();
    Object.assign(c, AFX_PRESETS[b.dataset.afx]);
    renderInspector(); syncMedia();
  } else if (b.id === 'afx-denoise' || b.id === 'afx-enhance') {
    const st = $('#afx-status'), id = c.id;
    b.disabled = true;
    try {
      const na = await cleanSound(c, b.id === 'afx-denoise' ? 'denoise' : 'enhance', st);
      const cc = state.clips.find(o => o.id === id);
      if (cc) { pushHistory(); cc.assetId = na.id; afterEdit(); }
      const s2 = $('#afx-status'); if (s2) s2.textContent = 'Done. The clip now uses the cleaned sound.';
    } catch (err) { b.disabled = false; st.textContent = 'Could not process: ' + err.message; }
  } else if (b.id === 'sync-run') {
    const st = $('#sync-status'), ref = state.clips.find(o => o.id === +$('#sync-ref').value);
    if (!ref) { st.textContent = 'Choose the clip to match first.'; return; }
    b.disabled = true;
    try {
      const r = await syncToRef(c, ref, st);
      const good = r.score > 12;
      if (r.start < 0) st.textContent = `The match needs this clip to start ${(-r.start).toFixed(2)} s before the start of the timeline. Move the other clips later first.`;
      else if (!fits(c, r.start, c.dur, c.track)) st.textContent = 'The matched position is occupied by another clip on this layer. Move that clip or use another layer.';
      else {
        pushHistory(); c.start = r.start; afterEdit();
        st.textContent = `Synced: moved ${r.lag >= 0 ? 'later' : 'earlier'} by ${Math.abs(r.lag).toFixed(3)} s. ${good ? 'The match is clear.' : 'The match is weak: check by playing both together, and Undo if it is wrong.'}`;
      }
    } catch (err) { st.textContent = 'Could not sync: ' + err.message; }
    b.disabled = false;
  }
});

// ---------- mixer ----------
const mxRows = () => TRACKS.map((t, i) => ({ t, i })).filter(({ t, i }) => t.kind === 'audio' || state.clips.some(c => c.track === i && c.text == null && !c.silent && assetOf(c) && assetOf(c).kind === 'video'));
let mxTimer = null;
function renderMixer() {
  const rows = mxRows(), box = $('#mx-rows');
  const anyEl = [...state.assets.values()].some(a => a.el && a.el.__chain);
  box.innerHTML = rows.map(({ t, i }) => `<div class="mx-row" data-i="${i}"><b title="${attr(t.name)}">${attr(t.name)}</b>
    <label>Volume <input type="range" min="0" max="200" step="1" data-mx="vol" value="${Math.round((trackState[i].vol ?? 1) * 100)}"><span>${Math.round((trackState[i].vol ?? 1) * 100)}%</span></label>
    <label>Pan <input type="range" min="-100" max="100" step="1" data-mx="pan" value="${Math.round((trackState[i].pan || 0) * 100)}"><span>${Math.round((trackState[i].pan || 0) * 100)}</span></label>
    <button type="button" data-mx="mute" class="${trackState[i].muted ? 'on' : ''}">M</button><button type="button" data-mx="solo" class="${trackState[i].solo ? 'on' : ''}">S</button>
    <div class="mx-meter"><i></i></div></div>`).join('') || '<p class="muted">No audio layers yet. Import audio or a video, or add an Audio layer.</p>';
  $('#mx-master').value = Math.round(+(localStorage.getItem('oc-master') || 1) * 100);
  $('#mx-master-v').textContent = $('#mx-master').value + '%';
  $('#mx-note').textContent = anyEl ? '' : 'Import some media first.';
}
$('#mx-rows').addEventListener('input', e => {
  const row = e.target.closest('.mx-row'), k = e.target.dataset.mx;
  if (!row || !k) return;
  const i = +row.dataset.i, v = +e.target.value;
  if (k === 'vol') { trackState[i].vol = v / 100; e.target.nextElementSibling.textContent = v + '%'; }
  if (k === 'pan') { trackState[i].pan = v / 100; e.target.nextElementSibling.textContent = v; }
  syncMedia();
});
$('#mx-rows').addEventListener('click', e => {
  const row = e.target.closest('.mx-row'), b = e.target.closest('button');
  if (!row || !b) return;
  const i = +row.dataset.i;
  if (b.dataset.mx === 'mute') trackState[i].muted = !trackState[i].muted;
  if (b.dataset.mx === 'solo') trackState[i].solo = !trackState[i].solo;
  renderMixer(); syncMedia(); if (typeof buildLabels === 'function') buildLabels();
});
$('#mx-master').oninput = e => {
  const v = +e.target.value / 100;
  localStorage.setItem('oc-master', v);
  if (masterGain) masterGain.gain.value = v;
  $('#mx-master-v').textContent = e.target.value + '%';
};
function meterLoop() {
  const buf = new Uint8Array(512), level = new Map();
  for (const a of state.assets.values()) for (const el of [a.el, a.aEl]) {
    const ch = el && el.__chain;
    if (!ch || el.paused || el.__track == null) continue;
    ch.an.getByteTimeDomainData(buf);
    let m = 0; for (const x of buf) m = Math.max(m, Math.abs(x - 128));
    level.set(el.__track, Math.max(level.get(el.__track) || 0, m / 128));
  }
  for (const row of $('#mx-rows').querySelectorAll('.mx-row')) {
    const bar = row.querySelector('.mx-meter i'), v = Math.min(1, (level.get(+row.dataset.i) || 0) * 1.4);
    const prev = parseFloat(bar.style.width) / 100 || 0;
    bar.style.width = Math.max(v, prev * 0.8) * 100 + '%'; bar.className = v > 0.9 ? 'hot' : '';
  }
}
$('#tl-mixer').onclick = () => { renderMixer(); $('#mx-dialog').showModal(); clearInterval(mxTimer); mxTimer = setInterval(meterLoop, 70); };
$('#mx-close').onclick = () => $('#mx-dialog').close();
$('#mx-dialog').addEventListener('close', () => clearInterval(mxTimer));

// ---------- background music with ducking ----------
const audioCache = new Map();   // asset id -> mono 8 kHz samples of the whole file
async function audioSamples(a) {
  if (audioCache.has(a.id)) return audioCache.get(a.id);
  const ac = new AudioContext({ sampleRate: SYNC_SR });
  let buf;
  try { buf = await ac.decodeAudioData(await a.file.arrayBuffer()); } finally { ac.close(); }
  const d = buf.getChannelData(0);
  audioCache.set(a.id, d);
  return d;
}
async function speechIntervals(clips, total) {   // when someone is speaking, in timeline seconds
  const step = 0.05, n = Math.ceil(total / step), env = new Float32Array(n);
  for (const c of clips) {
    const a = assetOf(c), d = await audioSamples(a);
    for (let t = c.start; t < c.start + c.dur && t < total; t += step) {
      const s = Math.floor(srcTime(c, t) * SYNC_SR), len = Math.max(8, Math.floor(step * spd(c) * SYNC_SR));
      let sum = 0; for (let k = s; k < s + len && k < d.length; k++) sum += d[k] * d[k];
      const v = Math.sqrt(sum / len) * (c.vol ?? 1), i = Math.floor(t / step);
      if (i < n && v > env[i]) env[i] = v;
    }
  }
  const sorted = [...env].sort((x, y) => x - y), p90 = sorted[Math.floor(sorted.length * 0.9)] || 0, thr = Math.max(0.012, p90 * 0.2);
  const iv = [];
  for (let i = 0; i < n; i++) if (env[i] > thr) { const t = i * step; if (iv.length && t - iv[iv.length - 1][1] < 1.0) iv[iv.length - 1][1] = t + step; else iv.push([t, t + step]); }   // pauses under a second keep the music low
  return iv.filter(([s, e]) => e - s >= 0.3);
}
function bgmAssets() { return [...state.assets.values()].filter(a => a.kind === 'audio'); }
function fillBgm() {
  const cur = $('#bm-asset').value;
  $('#bm-asset').innerHTML = bgmAssets().map(a => `<option value="${a.id}">${attr(a.name)} (${a.dur.toFixed(0)} s)</option>`).join('') || '<option value="">No audio files yet: add a music file</option>';
  if (cur) $('#bm-asset').value = cur;
}
$('#tl-bgm').onclick = () => { fillBgm(); $('#bm-status').textContent = ''; updateBgm(); $('#bm-dialog').showModal(); };
const updateBgm = () => { $('#bm-vol-v').textContent = $('#bm-vol').value + '%'; $('#bm-duck-v').textContent = $('#bm-duck-db').value + ' dB'; $('#bm-fade-v').textContent = $('#bm-fade').value + ' s'; $('#bm-duck-db').disabled = !$('#bm-duck').checked; };
for (const id of ['bm-vol', 'bm-duck-db', 'bm-fade', 'bm-duck']) $('#' + id).oninput = updateBgm;
$('#bm-close').onclick = () => $('#bm-dialog').close();
const bmFile = Object.assign(document.createElement('input'), { type: 'file', accept: 'audio/*', hidden: true });
document.body.append(bmFile);
$('#bm-add-file').onclick = () => bmFile.click();
bmFile.onchange = async () => { const f = [...bmFile.files]; bmFile.value = ''; if (!f.length) return; await addFiles(f); fillBgm(); const last = bgmAssets().pop(); if (last) $('#bm-asset').value = last.id; };
$('#bm-go').onclick = async () => {
  const st = $('#bm-status'), a = state.assets.get(+$('#bm-asset').value) || [...state.assets.values()].find(x => String(x.id) === $('#bm-asset').value);
  const total = totalDur();
  if (!a) { st.textContent = 'Choose a music file first (or add one).'; return; }
  if (!total) { st.textContent = 'Put some video or audio on the timeline first: the music is made as long as the timeline.'; return; }
  const btn = $('#bm-go'); btn.disabled = true;
  try {
    const vol = +$('#bm-vol').value / 100, fade = +$('#bm-fade').value, loop = $('#bm-loop').checked, duck = $('#bm-duck').checked;
    const voices = state.clips.filter(o => o.text == null && !o.music && !o.silent && assetOf(o) && assetOf(o).kind !== 'image' && assetOf(o).id !== a.id);
    let iv = [];
    if (duck) {
      if (!voices.length) st.textContent = 'No other sound on the timeline to lower the music for, so the music stays steady.';
      else { st.textContent = 'Finding where people speak…'; iv = await speechIntervals(voices, total); }
    }
    pushHistory();
    addLayer('audio');
    const track = TRACKS.length - 1;
    const pieces = [];
    for (let t = 0; t < total - 0.01; t += a.dur) {
      const c = newMediaClip(a, track, t);
      c.dur = Math.min(a.dur, total - t); c.vol = vol; c.music = true;
      pieces.push(c);
      if (!loop) break;
    }
    pieces[0].fadeIn = Math.min(fade, pieces[0].dur / 2); pieces[pieces.length - 1].fadeOut = Math.min(fade, pieces[pieces.length - 1].dur / 2);
    if (iv.length) {
      const g = Math.pow(10, -(+$('#bm-duck-db').value) / 20), pts = [];
      for (const [s, e] of iv) pts.push([Math.max(0, s - 0.3), 1], [s, g], [e, g], [e + 0.7, 1]);
      const at = t => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]; return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0); } return pts[pts.length - 1][1]; };
      for (const c of pieces) {
        const keys = new Map([[0, at(c.start)], [+c.dur.toFixed(3), at(c.start + c.dur)]]);
        for (const [t] of pts) if (t > c.start + 0.001 && t < c.start + c.dur - 0.001) keys.set(+(t - c.start).toFixed(3), at(t));
        c.kf = { vol: [...keys].sort((x, y) => x[0] - y[0]).map(([t, v]) => ({ t, v: +(v * vol).toFixed(4) })) };
      }
    }
    state.clips.push(...pieces);
    afterEdit();
    st.textContent = `Added the music on a new Audio layer${iv.length ? `, lowered under ${iv.length} speaking section${iv.length > 1 ? 's' : ''}` : ''}. Undo with Ctrl/Cmd+Z.`;
  } catch (e) { st.textContent = 'Could not add the music: ' + e.message; }
  btn.disabled = false;
};
})();
