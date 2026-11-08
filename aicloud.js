'use strict';
// AI Cloud tools (paid, Replicate): video generation, background removal, face enhancement, eye contact.
// The key and the model names are kept by the server (cloud.py); the browser only sends clips and receives the finished video.
(() => {
const attr = t => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const $c = id => document.getElementById(id);
const st = document.createElement('style');
st.textContent = `#cx-dialog{background:#1d1f25;color:#e6e6e6;border:1px solid #3a3d46;border-radius:8px;width:560px;max-width:94vw;max-height:90vh}#cx-dialog::backdrop{background:rgba(0,0,0,.6)}
#cx-dialog h3{margin:0 0 6px}#cx-dialog h4{margin:14px 0 2px}#cx-dialog label{display:block;margin:6px 0 2px;color:#999;font-size:11px}
#cx-dialog input[type=text],#cx-dialog input[type=password],#cx-dialog textarea,#cx-dialog select{width:100%;box-sizing:border-box;background:#141518;color:inherit;border:1px solid #3a3d46;border-radius:4px;padding:6px;font:inherit}
#cx-dialog .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;align-items:center}#cx-slots .sl{display:grid;grid-template-columns:110px 1fr auto;gap:6px;align-items:center;margin:4px 0}#cx-slots small{grid-column:1/-1;color:#999}`;
document.head.append(st);
const dlg = document.createElement('dialog');
dlg.id = 'cx-dialog';
dlg.innerHTML = `<form method="dialog"><h3>AI Cloud tools <small class="muted">paid, billed by Replicate to your account</small></h3>
<p class="muted" id="cx-key-state"></p>
<label><input type="checkbox" id="cx-ok"> I understand that the clip or picture I use is uploaded to Replicate (a third party) and each run costs money on my Replicate account. Only use footage you may upload.</label>
<h4>Generate video</h4>
<label>Describe the video</label><textarea id="cx-prompt" rows="3" placeholder="A slow drone shot over a misty green valley at sunrise"></textarea>
<div class="row"><select id="cx-dur" style="width:auto"><option value="5">5 s</option><option value="10">10 s</option></select><select id="cx-aspect" style="width:auto"><option>16:9</option><option>9:16</option><option>1:1</option></select>
<label style="margin:0"><input type="checkbox" id="cx-frame"> Start from the picture at the playhead</label></div>
<div class="row"><button type="button" id="cx-gen">Generate video</button></div>
<h4>Selected video clip</h4><p class="muted" id="cx-target"></p>
<div class="row"><button type="button" data-cx="background">Remove background</button><button type="button" data-cx="face">Enhance faces</button><button type="button" data-cx="eyes">Fix eye contact</button></div>
<p class="muted">The result replaces the clip's picture (its sound stays). Undo with Cmd+Z. Background removal gives a green background that the clip's Green screen key removes automatically.</p>
<p id="cx-status" class="muted"></p><div class="row"><button type="button" id="cx-cancel" hidden>Cancel job</button></div>
<details><summary>Settings: API key and models</summary>
<label>Replicate API key (stored on this computer in ~/.opencut/ai_config.json, never shown again)</label>
<div class="row"><input type="password" id="cx-key" placeholder="r8_..." autocomplete="off" style="flex:1"><button type="button" id="cx-key-save">Save key</button></div>
<div id="cx-slots"></div></details>
<div class="row" style="justify-content:flex-end"><button type="button" id="cx-close">Close</button></div></form>`;
document.body.append(dlg);

let cfg = null, job = null;
const sayDlg = t => { $c('cx-status').textContent = t; };
const say = sayDlg;
async function api(path, opt) {
  const r = await fetch('/api/cloud/' + path, opt);
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('json')) { if (!r.ok) throw new Error('request failed'); return r; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'request failed');
  return j;
}
async function loadCfg() {
  cfg = await api('config');
  $c('cx-key-state').textContent = cfg.configured ? 'Replicate key: saved.' : 'Replicate key: not set. Open "Settings" below and paste your key to start.';
  $c('cx-slots').innerHTML = Object.entries(cfg.slots).map(([k, s]) => `<div class="sl" data-slot="${k}"><span>${attr(s.label)}</span><input type="text" value="${attr(s.model)}" placeholder="owner/model-name"><button type="button" data-check>Check</button><small></small></div>`).join('');
}
const target = () => { const c = selClip(); return c && c.text == null && clipKind(c) === 'video' ? c : null; };
const fillTarget = () => { const c = target(); $c('cx-target').textContent = c ? `Clip: ${assetOf(c).name} (${c.dur.toFixed(1)} s)` : 'Select a video clip on the timeline first.'; };
$c('btn-cloud').onclick = async () => {
  $c('cx-ok').checked = localStorage.getItem('oc-cloud-ok') === '1';
  fillTarget(); say('');
  try { await loadCfg(); } catch (e) { say('Could not read the settings: ' + e.message); }
  dlg.showModal();
};
$c('cx-close').onclick = () => dlg.close();
$c('cx-ok').onchange = e => localStorage.setItem('oc-cloud-ok', e.target.checked ? '1' : '0');
$c('cx-key-save').onclick = async () => {
  const v = $c('cx-key').value.trim();
  if (!v) return say('Paste the key first.');
  try { await api('config', { method: 'POST', body: JSON.stringify({ token: v }) }); $c('cx-key').value = ''; await loadCfg(); say('Key saved.'); } catch (e) { say(e.message); }
};
$c('cx-slots').addEventListener('click', async e => {
  const row = e.target.closest('.sl'), b = e.target.closest('button[data-check]');
  if (!row || !b) return;
  const slot = row.dataset.slot, model = row.querySelector('input').value.trim(), note = row.querySelector('small');
  b.disabled = true; note.textContent = 'Checking…';
  try {
    await api('config', { method: 'POST', body: JSON.stringify({ slots: { [slot]: { model } } }) });
    const r = await api('check?slot=' + slot);
    note.textContent = 'OK. Inputs: ' + Object.entries(r.inputs).map(([k, v]) => `${k} ${v}`).join(', ');
  } catch (err) { note.textContent = 'Problem: ' + err.message; }
  b.disabled = false;
});

// ---------- run one job ----------
async function runJob(slot, query, body, say = sayDlg) {
  if (!$c('cx-ok').checked && localStorage.getItem('oc-cloud-ok') !== '1') throw new Error('Tick the box about uploading and cost first.');
  if (!cfg) await loadCfg();
  if (!cfg || !cfg.configured) throw new Error('Add your Replicate API key in AI > AI Cloud tools > Settings first.');
  const q = new URLSearchParams({ slot, ...query }).toString();
  const { id } = await api('start?' + q, { method: 'POST', body: body || '' });
  job = id; $c('cx-cancel').hidden = false;
  const labels = { queued: 'Waiting…', preparing: 'Preparing the clip…', uploading: 'Uploading to Replicate…', starting: 'Starting the model (the first run can take a minute or two)…', processing: 'Processing…', downloading: 'Downloading the result…' };
  try {
    for (;;) {
      await new Promise(r => setTimeout(r, 2500));
      const s = await api('status?id=' + id);
      if (s.state === 'failed') throw new Error(s.error || 'The job failed.');
      if (s.state === 'succeeded') break;
      say((labels[s.state] || s.state) + (s.logs ? '  ' + s.logs.split('\n').filter(Boolean).pop() : ''));
    }
    const r = await api('result?id=' + id);
    return await r.blob();
  } finally { job = null; $c('cx-cancel').hidden = true; }
}
window.aiCloud = { runJob, importBlob, loadCfg: () => loadCfg(), auxUpload: async blob => (await api('aux', { method: 'POST', body: blob })).id };
$c('cx-cancel').onclick = () => { if (job) { api('cancel?id=' + job, { method: 'POST', body: '' }).catch(() => {}); say('Cancelling…'); } };
async function importBlob(blob, name) {
  const a = await loadAsset(new File([blob], name, { type: blob.type || 'video/mp4' }), uid());
  state.assets.set(a.id, a); renderBin();
  return a;
}
async function cornerColor(a) {   // the background colour of the first frame, to key it out
  try {
    if (a.el.readyState < 2) await new Promise(r => { a.el.onloadeddata = r; setTimeout(r, 3000); });
    await seekTo(a.el, 0.05);
    const cv = document.createElement('canvas'); cv.width = cv.height = 8;
    const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(a.el, 0, 0, 8, 8);
    const [r, gr, b] = g.getImageData(1, 1, 1, 1).data;
    return '#' + [r, gr, b].map(v => v.toString(16).padStart(2, '0')).join('');
  } catch { return '#00ff00'; }
}

// ---------- generate ----------
$c('cx-gen').onclick = async e => {
  const prompt = $c('cx-prompt').value.trim(), btn = e.target;
  if (!prompt) return say('Describe the video first.');
  btn.disabled = true;
  try {
    let slot = 'video', body = '';
    if ($c('cx-frame').checked) {
      slot = 'image2video'; say('Taking the picture at the playhead…');
      exporting = true; draw();
      body = await new Promise(r => canvas.toBlob(r, 'image/png'));
      exporting = false; draw();
    }
    const blob = await runJob(slot, { prompt, duration: $c('cx-dur').value, aspect: $c('cx-aspect').value }, body);
    const a = await importBlob(blob, 'AI video ' + prompt.slice(0, 24).replace(/[^\w ]/g, '') + '.mp4');
    addAssetAtEnd(a);
    say('Done. The generated video was added at the end of the timeline.');
  } catch (err) { exporting = false; say('Could not generate: ' + err.message); }
  btn.disabled = false;
};

// ---------- clip tools ----------
dlg.addEventListener('click', async e => {
  const b = e.target.closest('button[data-cx]');
  if (!b) return;
  const slot = b.dataset.cx, c = target();
  if (!c) return say('Select a video clip on the timeline first.');
  const a0 = assetOf(c);
  if (!a0.file) return say('The original file is not available for this clip.');
  if (hasRamp(c)) return say('This clip has a speed ramp. Remove the ramp first.');
  if (c.dur * spd(c) > 120 && !confirm(`This clip is ${Math.round(c.dur * spd(c))} s long. Cloud processing is billed by time. Continue?`)) return;
  const id = c.id;
  for (const x of dlg.querySelectorAll('button[data-cx]')) x.disabled = true;
  try {
    const blob = await runJob(slot, { ss: c.in.toFixed(3), t: (c.dur * spd(c)).toFixed(3) }, a0.file);
    const cc = state.clips.find(o => o.id === id);
    if (!cc) throw new Error('The clip was removed meanwhile.');
    const na = await importBlob(blob, a0.name.replace(/\.[^.]+$/, '') + ({ background: ' (no background)', face: ' (enhanced)', eyes: ' (eye contact)' })[slot] + '.mp4');
    const key = slot === 'background' ? await cornerColor(na) : null;
    pushHistory();
    if (!cc.silent) detachAudio(cc);
    cc.assetId = na.id; cc.in = 0; cc.dur = Math.min(cc.dur, na.dur / spd(cc));
    if (key) { cc.keyOn = true; cc.keyColor = key; cc.keySim = Math.max(cc.keySim ?? 0, 0.2); }
    afterEdit();
    say('Done. The clip now uses the processed picture.' + (key ? ' The background was keyed out; adjust "Green screen" in the Inspector if edges look rough.' : ''));
  } catch (err) { say('Could not process: ' + err.message); }
  for (const x of dlg.querySelectorAll('button[data-cx]')) x.disabled = false;
});
})();
