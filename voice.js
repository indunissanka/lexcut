'use strict';
// AI Voice Studio: voice library, clone creation, text-to-speech, and timeline insertion.
// Talks to /api/voice/* on server.py. Uses the editor's globals (state, loadAsset, newMediaClip, ...) without changing app.js.
(() => {
const API = '/api/voice';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const DONE = ['done', 'failed', 'cancelled'];

async function api(method, path, body, raw) {
  const opt = { method };
  if (raw) opt.body = raw; else if (body !== undefined) opt.body = JSON.stringify(body);
  let r;
  try { r = await fetch(API + path, opt); } catch { throw new Error('Cannot reach the editor server. Start LexCut with server.py to use AI Voice Studio.'); }
  if (!(r.headers.get('content-type') || '').includes('json')) {
    if (!r.ok) throw new Error('Request failed (' + r.status + ').');
    return r.blob();
  }
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Request failed.');
  return d;
}

// ---------- state ----------
let caps = null, voices = [], projects = [], selId = null, tab = 'voice', projFilter = '';
const tts = { voiceId: '', lang: '', style: 'natural', speed: 1, emotion: 50, sp: 0.35, pp: 0.8, mode: 'playhead', fadeIn: 0.03, fadeOut: 0.08, caps: false, muteOrig: false, segs: [] };
let segSeq = 1;
const voiceOf = id => voices.find(v => v.id === id);
const readyVoices = () => voices.filter(v => v.status === 'ready');

// ---------- dialog skeleton ----------
const dlg = document.createElement('dialog');
dlg.id = 'vs-dialog';
dlg.innerHTML = `
<div class="vs-head"><h3>AI Voice Studio</h3><small class="muted" id="vs-engine"></small><span class="spacer"></span><button id="vs-close" type="button">Close</button></div>
<div class="vs-gate" id="vs-gate"></div>
<div class="vs-body">
  <aside class="vs-lib">
    <select id="vs-proj" title="Show the voices of one project"></select>
    <button id="vs-new" class="primary" type="button">+ New voice</button>
    <div id="vs-list"></div>
  </aside>
  <section class="vs-main">
    <nav class="vs-tabs"><button data-tab="voice" type="button">Voice &amp; samples</button><button data-tab="tts" type="button">Text to speech</button><button data-tab="tools" type="button">Voice tools</button><button data-tab="log" type="button">Activity log</button></nav>
    <div class="vs-pane" id="vs-pane-voice"></div>
    <div class="vs-pane" id="vs-pane-tts" hidden></div>
    <div class="vs-pane" id="vs-pane-tools" hidden></div>
    <div class="vs-pane" id="vs-pane-log" hidden></div>
  </section>
</div>`;
document.body.append(dlg);

const nd = document.createElement('dialog');
nd.id = 'vs-new-dialog';
nd.innerHTML = `
<h3 style="margin:0 0 8px">New voice</h3>
<label>Voice name</label><input type="text" id="nv-name" maxlength="80" placeholder="e.g. My narration voice">
<label>Project (optional)</label><input type="text" id="nv-proj" maxlength="80" list="vs-projects" placeholder="Keep voices of one project together">
<datalist id="vs-projects"></datalist>
<label>Main language</label><select id="nv-lang"></select>
<div class="vs-box" style="margin-top:12px"><h4>Consent</h4>
  <label class="check"><input type="checkbox" id="nv-ok"><span id="nv-consent"></span></label>
  <label>Name of the voice's owner</label><input type="text" id="nv-by" maxlength="120" placeholder="Your name, or the person who gave permission">
</div>
<p class="vs-err" id="nv-err"></p>
<div class="vs-row end"><button type="button" id="nv-cancel">Cancel</button><button type="button" id="nv-create" class="primary">Create voice</button></div>`;
document.body.append(nd);
const $d = s => dlg.querySelector(s);

// ---------- loading ----------
async function loadCaps() {
  try { caps = await api('GET', '/capabilities'); } catch (e) { caps = null; $d('#vs-gate').textContent = e.message; return false; }
  $d('#vs-engine').textContent = `${caps.name}${caps.installed ? '' : ' (not installed)'}`;
  const g = $d('#vs-gate');
  if (!caps.installed) { g.textContent = 'The voice engine is not installed on this computer.'; }
  else if (!caps.license.accepted) {
    g.innerHTML = `<b>Model license required.</b> ${esc(caps.name)} is released under the ${esc(caps.license.name)}${caps.license.noncommercial ? ', which allows <b>non-commercial use only</b>' : ''}.
      <label><input type="checkbox" id="lic-ok"> I have read the license (${esc(caps.license.url)}) and agree to its terms.</label>
      <button type="button" id="lic-accept" class="primary" disabled>Accept and enable voice cloning</button>`;
    g.querySelector('#lic-ok').onchange = e => { g.querySelector('#lic-accept').disabled = !e.target.checked; };
    g.querySelector('#lic-accept').onclick = async () => { try { await api('POST', '/license', { accept: true }); await loadAll(); } catch (e) { toast(e.message); } };
  } else g.textContent = '';
  return true;
}
async function loadVoices() {
  const d = await api('GET', '/voices');
  voices = d.voices; projects = d.projects;
  if (selId && !voiceOf(selId)) selId = null;
  if (!selId && voices.length) selId = voices[0].id;
}
async function loadAll() {
  if (!(await loadCaps())) return;
  try { await loadVoices(); } catch (e) { $d('#vs-gate').textContent = e.message; }
  renderAll();
}
const usable = () => caps && caps.ready;

// ---------- library ----------
function renderLib() {
  const ps = $d('#vs-proj');
  ps.innerHTML = `<option value="">All projects</option>` + projects.map(p => `<option ${p === projFilter ? 'selected' : ''}>${esc(p)}</option>`).join('');
  $('#vs-projects').innerHTML = projects.map(p => `<option value="${esc(p)}">`).join('');
  const list = voices.filter(v => !projFilter || v.project === projFilter);
  $d('#vs-list').innerHTML = list.length ? list.map(v => `
    <div class="vs-card ${v.id === selId ? 'sel' : ''}" data-id="${v.id}">
      <b>${esc(v.name)}</b>
      <span class="vs-chip ${v.status}">${v.status === 'ready' ? 'Ready' : v.status === 'cloning' ? 'Creating…' : 'Needs clone'}</span>
      <small>${esc(langName(v.language))}${v.project ? ' · ' + esc(v.project) : ''}</small>
      <small>${esc(v.provider)} / ${esc(v.model)} · ${new Date(v.created_at * 1000).toLocaleDateString()}</small>
    </div>`).join('') : '<p class="muted">No voices yet. Click “New voice”.</p>';
  for (const c of $d('#vs-list').querySelectorAll('.vs-card')) c.onclick = () => { selId = c.dataset.id; tts.voiceId = selId; renderAll(); };
}
const langName = code => (caps?.languages.find(l => l.code === code) || {}).name || code;
const langOptions = (sel, only) => (caps?.languages || []).filter(l => !only || only.includes(l.code)).map(l => `<option value="${l.code}" ${l.code === sel ? 'selected' : ''}>${esc(l.name)}${l.note ? ' — ' + esc(l.note) : ''}</option>`).join('');
const styleOptions = sel => Object.entries(caps?.styles || {}).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');

// ---------- Voice & samples ----------
let rec = null;   // active recording
function qualityBox(q) {
  return `<div class="vs-meter"><i class="${q.label === 'Good' ? '' : q.label === 'Fair' ? 'fair' : 'poor'}" style="width:${Math.max(3, q.score)}%"></i></div>
    <b>${esc(q.label)}</b> <span class="muted" style="padding:0">· ${q.duration || 0}s of speech${q.score ? ' · score ' + q.score + '/100' : ''}</span>
    <ul class="vs-tips">${(q.tips || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
}
function renderVoice() {
  const p = $d('#vs-pane-voice'), v = voiceOf(selId);
  if (!v) { p.innerHTML = '<p class="muted">Create or select a voice on the left.</p>'; return; }
  const s = v.settings, c = caps.controls;
  const slider = (k, label, min, max, step, d) => `<label>${label}: <b id="o-${k}">${s[k] ?? d}</b></label><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${s[k] ?? d}">`;
  p.innerHTML = `
  <div class="vs-grid">
    <div><label>Voice name</label><input type="text" id="v-name" value="${esc(v.name)}" maxlength="80"></div>
    <div><label>Project</label><input type="text" id="v-proj" value="${esc(v.project)}" list="vs-projects" maxlength="80"></div>
  </div>
  <p class="vs-hint">${esc(v.provider)} / ${esc(v.model)} · created ${new Date(v.created_at * 1000).toLocaleString()} · consent given by ${esc(v.consent_by)} · supports ${v.supported_languages.length} languages</p>
  <div class="vs-box"><h4>Voice settings</h4>
    <div class="vs-grid">
      <div><label>Language</label><select id="v-lang">${langOptions(v.language)}</select></div>
      <div><label>Speaking style</label><select id="v-style">${styleOptions(v.style)}</select></div>
      ${c.gender ? `<div><label>Voice gender presentation</label><select id="v-gender"><option value="">Unspecified</option><option ${v.gender === 'female' ? 'selected' : ''}>female</option><option ${v.gender === 'male' ? 'selected' : ''}>male</option></select></div>` : ''}
      <div>${slider('speed', 'Speech speed', c.speed[0], c.speed[1], 0.05, 1)}</div>
      ${c.pitch ? `<div>${slider('pitch', 'Pitch (semitones)', -6, 6, 0.5, 0)}</div>` : ''}
      ${c.similarity ? `<div>${slider('similarity', 'Voice similarity (higher = steadier, closer to the sample)', 0, 100, 5, 60)}</div>` : ''}
      <div>${slider('emotion', 'Expressiveness (variation in delivery)', 0, 100, 5, 50)}</div>
    </div>
    <label>Pronunciation corrections (one per line: <code>word = how to say it</code>)</label>
    <textarea id="v-lex" rows="3" placeholder="LexCut = lex cut&#10;Nginx = engine X">${esc(Object.entries(v.lexicon).map(([k, x]) => k + ' = ' + x).join('\n'))}</textarea>
    <p class="vs-hint">This engine has no true emotion control: styles and expressiveness change pacing and variation. The emotion of the recorded samples carries over most.</p>
    <div class="vs-row"><button type="button" id="v-save" class="primary">Save changes</button><button type="button" id="v-preview" ${v.status === 'ready' && usable() ? '' : 'disabled'}>▶ Preview voice</button><span class="vs-hint" id="v-msg"></span><span class="spacer"></span><button type="button" id="v-del">Delete voice…</button></div>
  </div>
  <div class="vs-box"><h4>Voice samples</h4>
    ${qualityBox(v.quality)}
    ${v.samples.map(sm => `<div class="vs-sample" data-sid="${sm.id}"><span title="${esc(sm.filename)}">${esc(sm.filename.slice(0, 18))}</span><audio controls preload="none" src="${API}/voices/${v.id}/samples/${sm.id}/audio"></audio><span>${sm.quality.label || ''} · ${sm.duration}s</span><button type="button" data-rm="${sm.id}">Remove</button></div>`).join('')}
    <div class="vs-row">
      <button type="button" id="s-up" ${usable() ? '' : 'disabled'}>Upload recordings…</button>
      <button type="button" id="s-rec" ${usable() ? '' : 'disabled'}>● Record with microphone</button>
      <label class="check" style="margin:0"><input type="checkbox" id="s-dn" checked> Reduce background noise</label>
      <input type="file" id="s-file" accept="audio/*,.mp3,.wav,.m4a" multiple hidden>
    </div>
    <div id="s-recbox"></div>
    <p class="vs-hint">Upload MP3, WAV or M4A, or record your voice. 15–60 seconds of clear speech from one person works best.</p>
    <p class="vs-err" id="s-err"></p>
  </div>
  <div class="vs-box"><h4>Voice clone</h4>
    <p class="vs-hint" style="margin:0 0 6px">${v.status === 'ready' ? 'The clone is ready. If you add or remove samples it must be created again.' : v.status === 'cloning' ? 'Creating the clone…' : 'Add samples, then create the clone before generating speech.'}</p>
    <div class="vs-row"><button type="button" id="c-make" class="primary" ${v.samples.length && v.status !== 'cloning' && usable() ? '' : 'disabled'}>${v.status === 'ready' ? 'Re-create voice clone' : 'Create voice clone'}</button><button type="button" id="c-cancel" ${v.status === 'cloning' ? '' : 'hidden'}>Cancel</button><span class="vs-hint" id="c-msg"></span></div>
  </div>
  ${c.voice_conversion ? '' : '<p class="vs-hint">Voice conversion (changing an existing recording into this voice) is not supported by the current engine.</p>'}`;
  wireVoice(v);
}
function wireVoice(v) {
  const q = s => $d('#vs-pane-voice ' + s), msg = t => { q('#v-msg').textContent = t; };
  for (const r of $d('#vs-pane-voice').querySelectorAll('input[type=range]')) r.oninput = () => { q('#o-' + r.dataset.k).textContent = r.value; };
  q('#v-save').onclick = async () => {
    const settings = {};
    for (const r of $d('#vs-pane-voice').querySelectorAll('input[type=range]')) settings[r.dataset.k] = +r.value;
    const lexicon = {};
    for (const line of q('#v-lex').value.split('\n')) { const i = line.indexOf('='); if (i > 0 && line.slice(0, i).trim()) lexicon[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
    try {
      await api('POST', `/voices/${v.id}/update`, { name: q('#v-name').value, project: q('#v-proj').value, language: q('#v-lang').value, style: q('#v-style').value, gender: q('#v-gender')?.value, settings, lexicon });
      await loadVoices(); renderAll(); msg('Saved.');
    } catch (e) { msg(e.message); }
  };
  let armed = false;
  q('#v-del').onclick = async e => {
    if (!armed) { armed = true; e.target.textContent = 'Click again to delete the voice and all its audio'; setTimeout(() => { armed = false; if (e.target.isConnected) e.target.textContent = 'Delete voice…'; }, 4000); return; }
    try { await api('DELETE', `/voices/${v.id}`); selId = null; await loadVoices(); renderAll(); toast('Voice deleted'); } catch (er) { msg(er.message); }
  };
  q('#v-preview').onclick = async () => {
    msg('Generating preview…');
    try {
      const txt = caps.preview_text[v.language] || caps.preview_text.en;
      const j = await runJob({ voice_id: v.id, text: txt, language: v.language }, j => msg(jobText(j)));
      if (j.status !== 'done') return msg(j.error || 'Preview ' + j.status);
      msg('Playing…'); const a = new Audio(URL.createObjectURL(await api('GET', `/jobs/${j.id}/audio`))); a.onended = () => msg(''); a.play();
    } catch (e) { msg(e.message); }
  };
  q('#s-up').onclick = () => q('#s-file').click();
  q('#s-file').onchange = async e => { for (const f of e.target.files) await uploadSample(v, f, f.name); e.target.value = ''; };
  for (const b of $d('#vs-pane-voice').querySelectorAll('[data-rm]')) b.onclick = async () => { try { await api('DELETE', `/voices/${v.id}/samples/${b.dataset.rm}`); await loadVoices(); renderAll(); } catch (e) { q('#s-err').textContent = e.message; } };
  q('#s-rec').onclick = () => toggleRecord(v);
  q('#c-make').onclick = async () => {
    try {
      const j = await api('POST', `/voices/${v.id}/clone`);
      cloneJob = j.id;
      await loadVoices(); renderAll();
      const done = await waitJob(j.id, jj => { const m = $d('#c-msg'); if (m) m.textContent = jobText(jj); });
      await loadVoices(); renderAll();
      const m = $d('#c-msg'); if (m) m.textContent = done.status === 'done' ? 'Voice clone created.' : (done.error || 'Cloning ' + done.status);
    } catch (e) { q('#c-msg').textContent = e.message; }
  };
  q('#c-cancel').onclick = async () => { if (cloneJob) await api('POST', `/jobs/${cloneJob}/cancel`).catch(() => {}); };
}
let cloneJob = null;
async function uploadSample(v, blob, name) {
  const err = $d('#s-err'); err.textContent = 'Uploading and checking ' + name + '…';
  try {
    await api('POST', `/voices/${v.id}/samples?filename=${encodeURIComponent(name)}&denoise=${$d('#s-dn')?.checked ? 1 : 0}`, undefined, blob);
    await loadVoices(); renderAll();
  } catch (e) { err.textContent = e.message; }
}
const SCRIPT = 'Read this aloud in your normal voice: “The quick brown fox jumps over the lazy dog. Today I am recording a short sample so my computer can learn how I sound. I will speak clearly, at a steady pace, and I will not rush.”';
async function toggleRecord(v) {
  const box = $d('#s-recbox'), btn = $d('#s-rec');
  if (rec) { rec.mr.stop(); return; }
  const err = $d('#s-err'); err.textContent = '';
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { err.textContent = 'This browser cannot record audio. Open LexCut at http://localhost:8765/ in Chrome.'; return; }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  } catch (e) {
    const hint = e.name === 'NotAllowedError' ? ' Allow the microphone for this site (lock icon in the address bar). On macOS, also allow Chrome in System Settings → Privacy & Security → Microphone. On Windows, check Settings → Privacy & security → Microphone.'
      : e.name === 'NotFoundError' ? ' No microphone was found; check that one is connected and selected as the input device.'
      : e.name === 'NotReadableError' ? ' The microphone is busy or blocked; close other apps that use it.' : '';
    err.textContent = 'Could not use the microphone: ' + (e.message || e.name) + '.' + hint; return;
  }
  try {
    const mr = new MediaRecorder(stream), chunks = [];
    const ac = new AudioContext(), an = ac.createAnalyser(); an.fftSize = 512;
    await ac.resume().catch(() => {});  // Chrome may leave it suspended, which freezes the level meter
    ac.createMediaStreamSource(stream).connect(an);
    const t0 = Date.now(), buf = new Uint8Array(an.fftSize);
    let peak = 0;
    rec = { mr };
    box.innerHTML = `<p class="vs-hint">${esc(SCRIPT)}</p><div class="vs-meter"><i id="rec-lvl" style="width:0"></i></div><span class="vs-rec">● Recording <span id="rec-t">0:00</span></span> <span id="rec-warn" class="vs-hint"></span>`;
    btn.textContent = '■ Stop recording';
    const tick = setInterval(() => {
      an.getByteTimeDomainData(buf);
      let m = 0; for (const x of buf) m = Math.max(m, Math.abs(x - 128));
      const lvl = m / 128; peak = Math.max(peak, lvl);
      const l = $d('#rec-lvl'); if (l) { l.style.width = Math.min(100, lvl * 120) + '%'; l.className = lvl > 0.95 ? 'poor' : ''; }
      const t = Math.floor((Date.now() - t0) / 1000), tt = $d('#rec-t'); if (tt) tt.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
      const w = $d('#rec-warn'); if (w) w.textContent = t >= 3 && peak < 0.02 ? 'No sound detected: check the input device and that the mic is not muted.' : '';
    }, 100);
    mr.ondataavailable = e => e.data.size && chunks.push(e.data);
    mr.onerror = e => { err.textContent = 'Recording error: ' + (e.error?.message || 'unknown'); };
    mr.onstop = () => {
      clearInterval(tick); stream.getTracks().forEach(t => t.stop()); ac.close(); rec = null;
      btn.textContent = '● Record with microphone';
      const secs = (Date.now() - t0) / 1000;
      const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
      if (!blob.size) { box.innerHTML = ''; err.textContent = 'Nothing was recorded. Check the microphone and try again.'; return; }
      const silent = peak < 0.02, quiet = !silent && peak < 0.1;
      const note = silent ? 'This recording is silent (the microphone sent no sound). Check the input device and try again.'
        : quiet ? 'This recording is very quiet. Move closer to the microphone or raise the input volume for a better clone.'
        : secs < 10 ? 'This recording is short (' + Math.round(secs) + ' s). 20–60 s gives a better clone.' : '';
      const url = URL.createObjectURL(blob);
      box.innerHTML = `<div class="vs-sample"><audio controls src="${url}"></audio><button type="button" id="rec-use" class="primary"${silent ? ' disabled' : ''}>Use this recording</button><button type="button" id="rec-no">Discard</button></div>${note ? `<p class="vs-hint">${esc(note)}</p>` : ''}`;
      $d('#rec-no').onclick = () => { URL.revokeObjectURL(url); box.innerHTML = ''; };
      $d('#rec-use').onclick = async () => { box.innerHTML = ''; await uploadSample(v, blob, `recording-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.webm`); };
    };
    mr.start(1000);
  } catch (e) { stream.getTracks().forEach(t => t.stop()); err.textContent = 'Could not start recording: ' + e.message; rec = null; }
}

// ---------- jobs ----------
const jobText = j => j.status === 'queued' ? `Waiting in queue${j.queue_position ? ' (' + j.queue_position + ' ahead)' : ''}…` : j.status === 'running' ? 'Working…' : j.status === 'done' ? (j.cached ? 'Done (from cache)' : 'Done') : j.status === 'failed' ? 'Failed: ' + j.error : 'Cancelled';
async function waitJob(id, onTick) {
  for (;;) { const j = await api('GET', '/jobs/' + id); if (onTick) onTick(j); if (DONE.includes(j.status)) return j; await sleep(600); }
}
async function runJob(payload, onTick) {
  const j = await api('POST', '/generate', payload);
  return DONE.includes(j.status) ? j : waitJob(j.id, onTick);
}

// ---------- Text to speech ----------
function splitSentences(text) {
  const out = [];
  const paras = text.replace(/\r/g, '').split(/\n\s*\n/);
  paras.forEach((para, pi) => {
    const parts = para.replace(/\n/g, ' ').split(/(?<=[.!?…؟।])\s+|(?<=[。！？])/).map(x => x.trim()).filter(Boolean);
    const fine = [];
    for (let p of parts) { while (p.length > 230) { let i = p.lastIndexOf(',', 230); if (i < 40) i = p.lastIndexOf(' ', 230); if (i < 40) i = 230; fine.push(p.slice(0, i + 1).trim()); p = p.slice(i + 1).trim(); } if (p) fine.push(p); }
    fine.forEach((t, i) => out.push({ text: t, paraAfter: i === fine.length - 1 && pi < paras.length - 1 }));
  });
  return out.map(o => newSeg(o));
}
const newSeg = o => ({ id: segSeq++, sel: true, status: 'idle', variant: 0, dur: 0, blob: null, url: null, gen: null, err: '', paraAfter: false, ...o });
const stale = s => s.blob && s.gen && (s.gen.text !== s.text);
function segStatus(s) {
  if (s.status === 'done') return stale(s) ? ['Edited: generate again', 'failed'] : [`Ready · ${s.dur.toFixed(1)}s`, 'done'];
  if (s.status === 'failed') return ['Failed: ' + s.err, 'failed'];
  return [{ idle: 'Not generated', queued: 'Waiting…', running: 'Generating…', cancelled: 'Cancelled' }[s.status] || s.status, s.status];
}
function renderTts() {
  const p = $d('#vs-pane-tts');
  const vs = readyVoices();
  if (!vs.length) { p.innerHTML = '<p class="muted">Create a voice clone first (Voice &amp; samples tab). Only voices with a finished clone appear here.</p>'; return; }
  if (!vs.find(v => v.id === tts.voiceId)) { const v = vs.find(x => x.id === selId) || vs[0]; tts.voiceId = v.id; applyVoiceDefaults(v); }
  const v = voiceOf(tts.voiceId), c = caps.controls;
  p.innerHTML = `
  <div class="vs-grid">
    <div><label>Voice</label><select id="t-voice">${vs.map(x => `<option value="${x.id}" ${x.id === v.id ? 'selected' : ''}>${esc(x.name)}${x.project ? ' (' + esc(x.project) + ')' : ''}</option>`).join('')}</select></div>
    <div><label>Output language</label><select id="t-lang">${langOptions(tts.lang, v.supported_languages)}</select></div>
    <div><label>Speaking style</label><select id="t-style">${styleOptions(tts.style)}</select></div>
    <div><label>Speed: <b id="ot-speed">${tts.speed}</b></label><input type="range" id="t-speed" min="${c.speed[0]}" max="${c.speed[1]}" step="0.05" value="${tts.speed}"></div>
    <div><label>Expressiveness: <b id="ot-emotion">${tts.emotion}</b></label><input type="range" id="t-emotion" min="0" max="100" step="5" value="${tts.emotion}"></div>
    <div><label>Pause between sentences: <b id="ot-sp">${tts.sp}</b> s</label><input type="range" id="t-sp" min="0" max="2" step="0.05" value="${tts.sp}"></div>
    <div><label>Pause between paragraphs: <b id="ot-pp">${tts.pp}</b> s</label><input type="range" id="t-pp" min="0" max="3" step="0.1" value="${tts.pp}"></div>
  </div>
  <div class="vs-box"><h4>Text</h4>
    <textarea id="t-text" rows="5" placeholder="Type or paste the narration. Blank lines start a new paragraph."></textarea>
    <div class="vs-row"><button type="button" id="t-split" class="primary">Split into sentences</button><button type="button" id="t-caps">Use captions from the timeline</button><button type="button" id="t-tr">Use last transcript</button><button type="button" id="t-clear">Clear</button></div>
    <p class="vs-hint">“Captions” uses the selected caption clips, or all of them when none are selected, and keeps their timing. Edit the sentences below before generating.</p>
  </div>
  <div class="vs-box"><h4>Sentences <span class="vs-hint" id="t-count"></span></h4>
    <div id="t-segs"></div>
    <div class="vs-row">
      <button type="button" id="t-gen" class="primary">Generate selected</button><button type="button" id="t-cancel" disabled>Cancel</button><button type="button" id="t-retry">Retry failed</button><button type="button" id="t-playall">▶ Play all</button>
      <label class="check" style="margin:0"><input type="checkbox" id="t-all" checked> Select all</label>
    </div>
  </div>
  <div class="vs-box"><h4>Insert into timeline</h4>
    <div class="vs-grid">
      <div><label>Placement</label><select id="t-mode"><option value="playhead">At the playhead, one after another</option><option value="timed">At the caption / transcript times</option><option value="replace">Replace the selected audio clip</option></select></div>
      <div><label>Fade in / out (seconds)</label><div class="vs-row" style="margin:0"><input type="text" id="t-fi" value="${tts.fadeIn}" style="width:70px"><input type="text" id="t-fo" value="${tts.fadeOut}" style="width:70px"></div></div>
    </div>
    <label class="check"><input type="checkbox" id="t-addcaps"> Also add subtitles for the inserted sentences (text input only)</label>
    <label class="check"><input type="checkbox" id="t-mute"> Mute other audio clips that overlap the narration</label>
    <div class="vs-row"><button type="button" id="t-insert" class="primary">Insert into timeline</button><span class="vs-hint" id="t-msg"></span></div>
    <p class="vs-hint">Each sentence becomes its own clip on an “AI Voice” audio layer, so you can move, trim, split, fade and regenerate them one by one. Clips are labelled AI.</p>
  </div>`;
  const q = s => p.querySelector(s);
  q('#t-mode').value = tts.mode; q('#t-addcaps').checked = tts.caps; q('#t-mute').checked = tts.muteOrig;
  q('#t-text').value = tts.text || '';
  q('#t-voice').onchange = e => { tts.voiceId = e.target.value; const nv = voiceOf(tts.voiceId); applyVoiceDefaults(nv); renderTts(); };
  q('#t-lang').onchange = e => { tts.lang = e.target.value; };
  q('#t-style').onchange = e => { tts.style = e.target.value; const d = caps.style_defaults[tts.style]; if (d) { tts.sp = d.sentence_pause; tts.pp = d.paragraph_pause; } renderTts(); };
  for (const [id, k] of [['t-speed', 'speed'], ['t-emotion', 'emotion'], ['t-sp', 'sp'], ['t-pp', 'pp']]) q('#' + id).oninput = e => { tts[k] = +e.target.value; q('#o' + id).textContent = e.target.value; };
  q('#t-text').oninput = e => { tts.text = e.target.value; };
  q('#t-split').onclick = () => { tts.segs = splitSentences(q('#t-text').value); renderSegs(); };
  q('#t-clear').onclick = () => { tts.segs = []; tts.text = ''; q('#t-text').value = ''; renderSegs(); };
  q('#t-caps').onclick = loadCaptions;
  q('#t-tr').onclick = loadTranscript;
  q('#t-all').onchange = e => { tts.segs.forEach(s => { s.sel = e.target.checked; }); renderSegs(); };
  q('#t-mode').onchange = e => { tts.mode = e.target.value; };
  q('#t-addcaps').onchange = e => { tts.caps = e.target.checked; };
  q('#t-mute').onchange = e => { tts.muteOrig = e.target.checked; };
  q('#t-fi').onchange = e => { tts.fadeIn = Math.max(0, +e.target.value || 0); };
  q('#t-fo').onchange = e => { tts.fadeOut = Math.max(0, +e.target.value || 0); };
  q('#t-gen').onclick = () => generateSegs(tts.segs.filter(s => s.sel && (!s.blob || stale(s) || s.status !== 'done')));
  q('#t-retry').onclick = () => generateSegs(tts.segs.filter(s => s.status === 'failed' || s.status === 'cancelled'));
  q('#t-cancel').onclick = cancelAll;
  q('#t-playall').onclick = playAll;
  q('#t-insert').onclick = insertIntoTimeline;
  renderSegs();
}
function applyVoiceDefaults(v) {
  const s = v.settings;
  tts.lang = v.language; tts.style = v.style || 'natural';
  tts.speed = s.speed ?? 1; tts.emotion = s.emotion ?? 50;
  const d = caps.style_defaults[tts.style]; tts.sp = d?.sentence_pause ?? 0.35; tts.pp = d?.paragraph_pause ?? 0.8;
}
function renderSegs() {
  const box = $d('#t-segs'); if (!box) return;
  box.innerHTML = tts.segs.length ? '' : '<p class="muted">No sentences yet. Type text and click “Split into sentences”.</p>';
  for (const s of tts.segs) {
    const row = document.createElement('div'); row.className = 'vs-seg'; row.dataset.id = s.id;
    row.innerHTML = `<input type="checkbox" class="sel" ${s.sel ? 'checked' : ''}>
      <div><textarea rows="2">${esc(s.text)}</textarea>${s.start != null ? `<div class="vs-hint">${fmt(s.start)} – ${fmt(s.end)} on the timeline</div>` : ''}</div>
      <div class="side"><span class="st"></span><div><button type="button" class="play">▶ Play</button><button type="button" class="regen">Regenerate</button></div></div>`;
    row.querySelector('.sel').onchange = e => { s.sel = e.target.checked; };
    row.querySelector('textarea').oninput = e => { s.text = e.target.value; updateRow(s); };
    row.querySelector('.play').onclick = () => playSeg(s);
    row.querySelector('.regen').onclick = () => { s.variant++; generateSegs([s], true); };
    box.append(row); updateRow(s);
  }
  $d('#t-count').textContent = tts.segs.length ? `${tts.segs.length} sentences · ${tts.segs.filter(s => s.status === 'done').length} generated` : '';
}
function updateRow(s) {
  const row = $d(`.vs-seg[data-id="${s.id}"]`); if (!row) return;
  const [t, cls] = segStatus(s), st = row.querySelector('.st');
  st.textContent = t; st.className = 'st ' + cls;
  row.querySelector('.play').disabled = !s.blob;
  const busy = s.status === 'queued' || s.status === 'running';
  row.querySelector('.regen').disabled = busy || !s.text.trim();
  $d('#t-count').textContent = `${tts.segs.length} sentences · ${tts.segs.filter(x => x.status === 'done').length} generated`;
  const any = tts.segs.some(x => x.status === 'queued' || x.status === 'running');
  const cb = $d('#t-cancel'); if (cb) cb.disabled = !any;
}
function loadCaptions() {
  const picked = multiClips().filter(c => c.text != null);
  const cs = (picked.length ? picked : state.clips.filter(c => c.text != null)).slice().sort((a, b) => a.start - b.start);
  if (!cs.length) return toast('There are no caption/text clips on the timeline.');
  tts.segs = cs.map(c => newSeg({ text: c.text.replace(/\s*\n\s*/g, ' ').trim(), start: c.start, end: c.start + c.dur, capId: c.id }));
  tts.mode = 'timed'; renderTts();
}
function loadTranscript() {
  const t = typeof trSegments !== 'undefined' ? trSegments : [];
  if (!t.length) return toast('No transcript yet. Use AI → Transcript first.');
  tts.segs = t.map(x => newSeg({ text: x.text, start: x.start, end: x.end }));
  tts.mode = 'timed'; renderTts();
}

async function generateSegs(list, single) {
  list = list.filter(s => s.text.trim());
  const v = voiceOf(tts.voiceId);
  if (!v) return;
  for (const s of list) { s.status = 'queued'; s.err = ''; updateRow(s); }
  const submitted = [];   // submit in reading order so the server queue generates them in order
  for (const s of list) {
    try {
      const fit = tts.mode === 'timed' && s.start != null ? Math.max(0.3, s.end - s.start) : null;
      const payload = { voice_id: v.id, text: s.text, language: tts.lang, style: tts.style, speed: tts.speed, emotion: tts.emotion, variant: s.variant, fit_dur: fit };
      const j = await api('POST', '/generate', payload);
      s.job = j.id; submitted.push([s, j, fit]);
    } catch (e) { s.status = 'failed'; s.err = e.message; updateRow(s); }
  }
  await Promise.all(submitted.map(async ([s, j, fit]) => {
    try {
      const fin = DONE.includes(j.status) ? j : await waitJob(j.id, jj => { if (s.status !== 'cancelled' || jj.status === 'cancelled') { s.status = jj.status; updateRow(s); } });
      if (fin.status === 'done') {
        s.blob = await api('GET', `/jobs/${fin.id}/audio`); if (s.url) URL.revokeObjectURL(s.url); s.url = URL.createObjectURL(s.blob);
        s.dur = fin.duration; s.gen = { text: s.text, lang: tts.lang, style: tts.style, speed: tts.speed, fit, variant: s.variant, voiceId: v.id, voiceName: v.name };
        s.asset = null; s.status = 'done';
      } else { s.status = fin.status; s.err = fin.error || ''; }
    } catch (e) { s.status = 'failed'; s.err = e.message; }
    updateRow(s);
  }));
  renderSegs();
}
async function cancelAll() {
  for (const s of tts.segs) if ((s.status === 'queued' || s.status === 'running') && s.job) { s.status = 'cancelled'; updateRow(s); api('POST', `/jobs/${s.job}/cancel`).catch(() => {}); }
}
let player = null;
function playSeg(s) { if (player) player.pause(); if (!s.url) return; player = new Audio(s.url); player.play(); return new Promise(r => { player.onended = r; player.onpause = r; }); }
async function playAll() { for (const s of tts.segs) { if (!s.blob) continue; await playSeg(s); if (!dlg.open) break; await sleep(Math.round((s.paraAfter ? tts.pp : tts.sp) * 1000)); } }

// ---------- timeline integration ----------
function voiceTrack() {
  let i = TRACKS.findIndex((t, k) => t.kind === 'audio' && t.name === 'AI Voice' && LANE_ORDER.includes(k));
  if (i >= 0) { activeTrack.audio = i; return i; }
  addLayer('audio'); i = TRACKS.length - 1; TRACKS[i].name = 'AI Voice'; buildLabels(); renderTimeline();
  return i;
}
async function segAsset(s) {
  if (s.asset && state.assets.has(s.asset)) return state.assets.get(s.asset);
  const name = `AI voice - ${s.gen.voiceName} - ${s.text.slice(0, 24).replace(/[\\/:*?"<>|]/g, '')} v${s.variant}.wav`;
  return addBlobAsset(s.blob, name).then(a => { s.asset = a.id; return a; });
}
async function addBlobAsset(blob, name) {
  const a = await loadAsset(new File([blob], name, { type: 'audio/wav' }), uid());
  state.assets.set(a.id, a); renderBin(); return a;
}
const aiMeta = (s, v) => ({ voiceId: s.gen.voiceId, voiceName: s.gen.voiceName, text: s.text, lang: s.gen.lang, style: s.gen.style, speed: s.gen.speed, variant: s.variant, fit: s.gen.fit, emotion: tts.emotion });
async function insertIntoTimeline() {
  const msg = t => { const m = $d('#t-msg'); if (m) m.textContent = t; };
  const segs = tts.segs.filter(s => s.sel && s.blob && !stale(s));
  if (!segs.length) return msg('Nothing to insert: generate the selected sentences first.');
  if (tts.mode === 'timed' && segs.some(s => s.start == null)) return msg('These sentences have no timing. Choose “At the playhead”, or load captions/transcript.');
  let t = state.t, removed = null;
  if (tts.mode === 'replace') {
    removed = selClip();
    if (!removed || clipKind(removed) !== 'audio') return msg('Select the audio clip you want to replace on the timeline first.');
  }
  msg('Inserting…');
  const assets = [];
  for (const s of segs) assets.push(await segAsset(s));
  pushHistory();
  if (removed) { t = removed.start; removeClips([removed]); }
  const track = voiceTrack();
  const placed = [];
  let cursor = t;
  segs.forEach((s, i) => {
    const a = assets[i];
    let start = tts.mode === 'timed' ? s.start : cursor;
    if (tts.mode === 'timed' && placed.length) start = Math.max(start, placed[placed.length - 1].start + placed[placed.length - 1].dur + 0.02);
    const c = newMediaClip(a, track, start);
    if (!fits(c, c.start, c.dur, track)) c.start = laneEnd(track);
    c.vol = 1; c.fadeIn = tts.fadeIn; c.fadeOut = tts.fadeOut; c.ai = aiMeta(s);
    state.clips.push(c); placed.push(c);
    cursor = c.start + c.dur + (s.paraAfter ? tts.pp : tts.sp);
  });
  if (tts.muteOrig && placed.length) {
    const a0 = placed[0].start, a1 = placed[placed.length - 1].start + placed[placed.length - 1].dur;
    for (const o of state.clips) if (o.track !== track && o.start < a1 && o.start + o.dur > a0 && (o.audioOnly || clipKind(o) === 'audio')) o.vol = 0;
  }
  if (tts.caps && tts.mode !== 'timed') addCaptionClips(placed.map(c => ({ start: c.start, end: c.start + c.dur, text: c.ai.text })));
  if (tts.mode === 'timed') segs.forEach((s, i) => { const cap = s.capId != null && state.clips.find(x => x.id === s.capId); if (cap && cap.text !== s.text) cap.text = s.text; });  // captions follow edited sentences
  state.sel = placed[0].id; afterEdit(); seek(placed[0].start);
  api('POST', '/audit', { action: tts.mode === 'replace' ? 'timeline.replace' : 'timeline.insert', voice_id: tts.voiceId, clips: placed.length, seconds: +(placed.reduce((m, c) => m + c.dur, 0)).toFixed(1) }).catch(() => {});
  msg(`Inserted ${placed.length} clip${placed.length > 1 ? 's' : ''}.`);
  toast(`Inserted ${placed.length} AI voice clip${placed.length > 1 ? 's' : ''}`);
  dlg.close();
}

// Regenerate one placed sentence from the Inspector, leaving every other clip alone.
const _inspector = window.renderInspector;
window.renderInspector = function () {
  _inspector();
  const c = selClip();
  if (!c || !c.ai) return;
  const box = $('#inspector'), d = document.createElement('div');
  d.className = 'vs-ai';
  d.innerHTML = `<span class="vs-ai-note">AI-generated voice</span> <span class="muted" style="padding:0">${esc(c.ai.voiceName)}</span>
    <label style="display:block;color:#999;font-size:11px;margin:8px 0 2px">Sentence</label><textarea rows="3" id="ai-txt">${esc(c.ai.text)}</textarea>
    <div style="display:flex;gap:6px;margin-top:6px"><button type="button" id="ai-regen">Regenerate this sentence</button></div><p class="muted" id="ai-st" style="padding:4px 0"></p>`;
  box.append(d);
  d.querySelector('#ai-regen').onclick = () => regenerateClip(c, d.querySelector('#ai-txt').value, d.querySelector('#ai-st'));
};
async function regenerateClip(c, text, st) {
  const v = voiceOf(c.ai.voiceId) || (await loadVoices().then(() => voiceOf(c.ai.voiceId)));
  if (!v || v.status !== 'ready') { st.textContent = 'The voice for this clip is no longer available.'; return; }
  const next = state.clips.filter(o => o.track === c.track && o.start >= c.start + c.dur - 1e-6).reduce((m, o) => Math.min(m, o.start), Infinity);
  const room = next - c.start;
  const same = text.trim() === c.ai.text;
  const variant = c.ai.variant + 1;
  st.textContent = 'Generating a new take…';
  try {
    const fit = isFinite(room) ? Math.max(0.3, room) : c.ai.fit;
    const j = await runJob({ voice_id: v.id, text, language: c.ai.lang, style: c.ai.style, speed: c.ai.speed, emotion: c.ai.emotion, variant, fit_dur: fit }, jj => { st.textContent = jobText(jj); });
    if (j.status !== 'done') { st.textContent = j.error || 'Regeneration ' + j.status; return; }
    const blob = await api('GET', `/jobs/${j.id}/audio`);
    const a = await addBlobAsset(blob, `AI voice - ${v.name} - ${text.slice(0, 24).replace(/[\\/:*?"<>|]/g, '')} v${variant}.wav`);
    pushHistory();
    c.assetId = a.id; c.in = 0; c.speed = 1;
    c.dur = Math.min(a.dur, room);
    c.ai = { ...c.ai, text, variant, fit };
    afterEdit();
    toast(a.dur > room + 1e-6 ? 'New take was trimmed to the free space' : 'New take ready');
    st.textContent = a.dur > room + 1e-6 ? `New take is ${a.dur.toFixed(1)} s but only ${room.toFixed(1)} s is free: it was trimmed. Make room or shorten the text.` : `New take ready${same ? ' (same text, different delivery)' : ''}.`;
    api('POST', '/audit', { action: 'timeline.replace', voice_id: v.id, clips: 1, seconds: +c.dur.toFixed(1) }).catch(() => {});
  } catch (e) { st.textContent = e.message; }
}
// "AI" badge on generated clips in the timeline.
const _clipEl = window.clipEl;
window.clipEl = function (c) {
  const d = _clipEl(c);
  if (c.ai) { const b = document.createElement('span'); b.className = 'ai-badge'; b.textContent = 'AI'; b.title = 'AI-generated voice: ' + c.ai.voiceName; d.append(b); }
  return d;
};

// ---------- activity log ----------
async function renderLog() {
  const p = $d('#vs-pane-log');
  try {
    const d = await api('GET', '/audit' + (selId ? '?voice_id=' + selId : ''));
    const names = Object.fromEntries(voices.map(v => [v.id, v.name]));
    p.innerHTML = `<p class="vs-hint">Showing activity for ${selId && voiceOf(selId) ? esc(voiceOf(selId).name) : 'all voices'}. Text of what was spoken is not stored in this log.</p>` +
      (d.events.length ? `<table style="width:100%;font-size:12px;border-collapse:collapse">` + d.events.map(e => `<tr style="border-top:1px solid #2a2c33"><td style="padding:4px 6px;white-space:nowrap;color:#8d919c">${new Date(e.ts * 1000).toLocaleString()}</td><td style="padding:4px 6px">${esc(e.action)}</td><td style="padding:4px 6px;color:#aeb2bd">${esc(names[e.voice_id] || '')} ${esc(Object.entries(e.detail).filter(([k]) => k !== 'job').map(([k, x]) => k + ': ' + x).join(', '))}</td></tr>`).join('') + '</table>' : '<p class="muted">No activity yet.</p>');
  } catch (e) { p.textContent = e.message; }
}

// ---------- wiring ----------
function showTab(t) {
  tab = t;
  for (const b of dlg.querySelectorAll('.vs-tabs button')) b.classList.toggle('on', b.dataset.tab === t);
  for (const k of ['voice', 'tts', 'tools', 'log']) $d('#vs-pane-' + k).hidden = k !== t;
  if (t === 'tts') renderTts();
  if (t === 'tools' && window.vsTools) window.vsTools.render($d('#vs-pane-tools'), voices);
  if (t === 'log') renderLog();
}
function renderAll() { renderLib(); renderVoice(); showTab(tab); }
for (const b of dlg.querySelectorAll('.vs-tabs button')) b.onclick = () => showTab(b.dataset.tab);
$d('#vs-close').onclick = () => dlg.close();
$d('#vs-proj').onchange = e => { projFilter = e.target.value; renderLib(); };
$d('#vs-new').onclick = () => {
  if (!caps) return toast('Voice server not reachable.');
  if (!usable()) return toast(caps.installed ? 'Accept the model license first.' : 'Voice engine is not installed.');
  nd.querySelector('#nv-lang').innerHTML = langOptions('en');
  nd.querySelector('#nv-consent').textContent = caps.consent_text;
  for (const id of ['nv-name', 'nv-by']) nd.querySelector('#' + id).value = '';
  nd.querySelector('#nv-proj').value = projFilter; nd.querySelector('#nv-ok').checked = false; nd.querySelector('#nv-err').textContent = '';
  nd.showModal();
};
nd.querySelector('#nv-cancel').onclick = () => nd.close();
nd.querySelector('#nv-create').onclick = async () => {
  const q = s => nd.querySelector(s), err = q('#nv-err');
  if (!q('#nv-ok').checked) return (err.textContent = 'You must confirm that you own this voice or have the owner’s permission.');
  try {
    const v = await api('POST', '/voices', { name: q('#nv-name').value, project: q('#nv-proj').value, language: q('#nv-lang').value, consent: { confirmed: true, by: q('#nv-by').value } });
    nd.close(); await loadVoices(); selId = v.id; tab = 'voice'; renderAll();
  } catch (e) { err.textContent = e.message; }
};
$('#btn-vs').onclick = async () => { dlg.showModal(); await loadAll(); };
dlg.addEventListener('close', () => { if (rec) rec.mr.stop(); if (player) player.pause(); });
})();
