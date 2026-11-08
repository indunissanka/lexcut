'use strict';
// Smart tools: scene detection, silence removal, highlight detection. Analysis runs locally (ffmpeg, /api/analyze);
// Claude (the claude CLI, via askClaude) picks highlights from the transcript and the loudness. The chat assistant can call the same tools.
(() => {
const attr = t => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- which clip to work on ----------
function mediaClip() {
  const c = selClip();
  if (c && c.text == null && clipKind(c) !== 'image') return c;
  return state.clips.filter(o => o.text == null && clipKind(o) !== 'image').sort((a, b) => a.start - b.start)[0] || null;
}
const videoOf = c => clipKind(c) === 'video' ? c : partners(c).find(p => clipKind(p) === 'video') || null;
function needSimple(c) {
  if (!c) throw new Error('Put a video or audio clip on the timeline first (or select one).');
  const a = assetOf(c);
  if (!a || !a.file) throw new Error('The original file is not available for this clip.');
  if (hasRamp(c)) throw new Error('This clip has a speed ramp. Remove the ramp first.');
  return a;
}
const tlOf = (c, s) => c.start + (s - c.in) / spd(c);
const cache = new Map();
async function analyze(a, kind, params = {}) {   // the server runs ffmpeg on this computer; results are cached per file and setting
  const q = new URLSearchParams({ kind, ...params }).toString(), key = a.id + '|' + q;
  if (cache.has(key)) return cache.get(key);
  const r = await fetch('/api/analyze?' + q, { method: 'POST', body: a.file });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'The analysis failed.');
  cache.set(key, j);
  return j;
}
const pieceAt = (c, t) => state.clips.find(o => o.track === c.track && o.assetId === c.assetId && t > o.start + 1e-6 && t < o.start + o.dur - 1e-6);
function cutOut(c, a, b) {   // remove timeline range [a, b] from c's layer (and its linked sound) and close the gap
  const p = pieceAt(c, (a + b) / 2);
  if (!p) return 0;
  let mid = p;
  if (a > p.start + 0.05) mid = splitClip(p, a);
  if (b < mid.start + mid.dur - 0.05) splitClip(mid, b);
  const len = mid.dur, m0 = mid.start;
  rippleRemove(mid);
  state.markers = state.markers.filter(m => m <= m0 + 1e-6 || m >= m0 + len - 1e-6).map(m => m >= m0 + len - 1e-6 ? +(m - len).toFixed(3) : m);   // markers follow the closed gap
  return len;
}

// ---------- scenes ----------
async function detectScenes(c, { split = false, sens = 0.3 } = {}) {
  c = videoOf(c) || c;
  if (clipKind(c) !== 'video') throw new Error('Scene detection needs a video clip.');
  const a = needSimple(c);
  const { cuts } = await analyze(a, 'scenes', { t: sens });
  const lo = c.in, hi = c.in + c.dur * spd(c);
  const ts = cuts.filter(s => s > lo + 0.3 && s < hi - 0.3).map(s => +tlOf(c, s).toFixed(3));
  for (const t of ts) if (!state.markers.some(m => Math.abs(m - t) < 0.05)) state.markers.push(t);
  state.markers.sort((x, y) => x - y);
  if (split) for (const t of ts) { const p = pieceAt(c, t); if (p && t > p.start + 0.05 && t < p.start + p.dur - 0.05) splitClip(p, t); }
  afterEdit();
  return { count: ts.length + 1, times: ts, text: ts.length ? `Found ${ts.length + 1} scenes (cuts at ${ts.map(fmt).join(', ')}). Markers were added${split ? ' and the clip was split at each cut' : ''}.` : 'No scene changes found: this looks like one continuous shot. Try a higher sensitivity.' };
}

// ---------- silence ----------
async function removeSilence(c, { minPause = 0.6, pad = 0.15 } = {}) {
  const a = needSimple(c);
  const { silences } = await analyze(a, 'silence', { min: minPause });
  const lo = c.in, hi = c.in + c.dur * spd(c);
  const regions = [];
  for (const [s0, e0] of silences) {
    const s = Math.max(s0, lo), e = Math.min(e0, hi);
    if (e - s <= 0) continue;
    const from = s <= lo + 0.01 ? s : s + pad, to = e >= hi - 0.01 ? e : e - pad;
    if (to - from >= 0.15) regions.push([tlOf(c, from), tlOf(c, to)]);
  }
  if (!regions.length) return { removed: 0, count: 0, text: 'No pauses longer than ' + minPause + ' s found.' };
  let removed = 0;
  for (const [s, e] of regions.reverse()) removed += cutOut(c, s, e);   // from the end so earlier times do not move
  afterEdit();
  return { removed, count: regions.length, text: `Removed ${regions.length} pause${regions.length > 1 ? 's' : ''} (${removed.toFixed(1)} s in all). Captions and other layers were cut and moved with it.` };
}

// ---------- highlights ----------
let lastHighlights = [];
const HL_SYSTEM = `You are a video editor's assistant that finds the most interesting moments (highlights) of a video.
You get the video length, a list of loud moments (energy peaks, in seconds, with the level in dB) and, if available, the transcript with times.
Choose the best moments: strong statements, key points, jokes, emotional or energetic parts, surprising facts. Prefer moments where the transcript is meaningful, using energy as a hint.
Each highlight is 5 to 45 seconds long, they must not overlap, and start/end must fall on sentence boundaries when a transcript is given. All times are in seconds on the video timeline.
Reply with ONLY a JSON array, ordered by start: [{"start":number,"end":number,"title":"short title, written in the same language as the transcript lines (English if there is no transcript)","reason":"one short sentence"}]. No other text.`;
async function findHighlights(c, { count = 5 } = {}) {
  const a = needSimple(c);
  const { levels } = await analyze(a, 'energy');
  const lo = c.in, hi = c.in + c.dur * spd(c), len = c.dur;
  const pts = levels.filter(([t]) => t >= lo && t < hi).map(([t, db]) => [tlOf(c, t), db]);
  const W5 = 5, scored = [];
  for (let i = 0; i + W5 <= pts.length; i++) scored.push([pts[i][0], pts.slice(i, i + W5).reduce((s, p) => s + p[1], 0) / W5]);
  scored.sort((x, y) => y[1] - x[1]);
  const peaks = [];
  for (const p of scored) { if (peaks.every(q => Math.abs(q[0] - p[0]) >= 10)) peaks.push(p); if (peaks.length >= Math.max(8, count * 2)) break; }
  const caps = state.clips.filter(o => o.text != null && !o.lt && String(o.text).trim() && o.start < c.start + len && o.start + o.dur > c.start).sort((x, y) => x.start - y.start);
  let tx = '', i = 0;
  for (const o of caps) { const line = `[${o.start.toFixed(1)}-${(o.start + o.dur).toFixed(1)}] ${String(o.text).replace(/\s+/g, ' ')}\n`; if (tx.length + line.length > 14000) break; tx += line; i++; }
  const prompt = `Video length: ${len.toFixed(1)} s (timeline seconds ${c.start.toFixed(1)} to ${(c.start + len).toFixed(1)}).\nFind ${count} highlights.\nLoud moments: ${peaks.map(p => `${p[0].toFixed(0)}s (${p[1].toFixed(0)} dB)`).join(', ') || '(none)'}\n` + (tx ? `Transcript:\n${tx}` : 'No transcript is available: choose from the loud moments only.');
  const arr = parseJsonArray(await askClaude(HL_SYSTEM, prompt));
  const t0 = c.start, t1 = c.start + len, out = [];
  for (const h of arr) {
    const s = Math.max(t0, +h.start), e = Math.min(t1, +h.end);
    if (!(e - s >= 2) || out.some(o => s < o.end && e > o.start)) continue;
    out.push({ start: +s.toFixed(2), end: +e.toFixed(2), title: String(h.title || 'Highlight').slice(0, 80), reason: String(h.reason || '').slice(0, 200) });
  }
  out.sort((x, y) => x.start - y.start);
  if (!out.length) throw new Error('Claude did not return usable highlights. Try again.');
  for (const h of out) if (!state.markers.some(m => Math.abs(m - h.start) < 0.05)) state.markers.push(h.start);
  state.markers.sort((x, y) => x - y);
  lastHighlights = out;
  renderTimeline(); draw();
  return { highlights: out, text: `Found ${out.length} highlights${tx ? '' : ' (from loudness only: transcribe first for better picks)'}: ` + out.map(h => `${fmt(h.start)}-${fmt(h.end)} ${h.title}`).join('; ') + '. Markers were added at their starts.' };
}
async function keepHighlights(c) {   // cut everything except the highlights
  const hs = lastHighlights.filter(h => h.start >= c.start - 0.01 && h.end <= c.start + c.dur + 0.01);
  if (!hs.length) throw new Error('Find highlights first.');
  const gaps = []; let cur = c.start;
  for (const h of hs) { if (h.start - cur > 0.05) gaps.push([cur, h.start]); cur = h.end; }
  if (c.start + c.dur - cur > 0.05) gaps.push([cur, c.start + c.dur]);
  for (const [s, e] of gaps.reverse()) cutOut(c, s, e);
  state.markers = []; lastHighlights = [];
  afterEdit();
  return `Kept ${hs.length} highlights and removed the rest. Undo (Cmd+Z) brings the full video back.`;
}

// ---------- dialog ----------
const st = document.createElement('style');
st.textContent = `#sm-dialog{background:#1d1f25;color:#e6e6e6;border:1px solid #3a3d46;border-radius:8px;width:520px;max-width:94vw}#sm-dialog::backdrop{background:rgba(0,0,0,.6)}
#sm-dialog h3{margin:0 0 6px}#sm-dialog h4{margin:14px 0 2px}#sm-dialog label{display:block;margin:6px 0 2px;color:#999;font-size:11px}
#sm-dialog .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}#sm-hl a{display:block;cursor:pointer;padding:3px 0;color:#9cf}#sm-hl small{color:#999}`;
document.head.append(st);
const dlg = document.createElement('dialog');
dlg.id = 'sm-dialog';
dlg.innerHTML = `<form method="dialog"><h3>Smart tools <small class="muted">analysis runs on this computer, Claude picks highlights</small></h3>
<p class="muted" id="sm-target"></p>
<h4>Scenes</h4><label>Sensitivity: <b id="sm-sens-v">0.30</b> (lower finds more cuts)</label><input type="range" id="sm-sens" min="0.1" max="0.6" step="0.05" value="0.3">
<label><input type="checkbox" id="sm-split"> Also split the clip at each scene change</label>
<div class="row"><button type="button" id="sm-scenes">Detect scenes</button></div>
<h4>Silence</h4><label>Remove pauses longer than: <b id="sm-pause-v">0.6 s</b></label><input type="range" id="sm-pause" min="0.3" max="3" step="0.1" value="0.6">
<div class="row"><button type="button" id="sm-silence">Remove silences</button></div>
<h4>Highlights</h4><label>How many: <b id="sm-n-v">5</b></label><input type="range" id="sm-n" min="1" max="10" step="1" value="5">
<div class="row"><button type="button" id="sm-hl-go">Find highlights</button><button type="button" id="sm-hl-keep" disabled>Keep only the highlights</button></div><div id="sm-hl"></div>
<p class="muted" id="sm-status"></p>
<div class="row" style="justify-content:flex-end"><button type="button" id="sm-close">Close</button></div></form>`;
document.body.append(dlg);
const $s = id => document.getElementById(id);
const note = (id, f) => { $s(id).oninput = () => $s(id + '-v').textContent = f($s(id).value); };
note('sm-sens', v => (+v).toFixed(2)); note('sm-pause', v => v + ' s'); note('sm-n', v => v);
const target = () => { const c = mediaClip(); $s('sm-target').textContent = c ? `Working on: ${clipKind(c) === 'text' ? '' : (assetOf(c) || {}).name || 'clip'} (${fmt(c.start)} to ${fmt(c.start + c.dur)}). Select another clip to change it. Undo with Cmd+Z.` : 'No video or audio on the timeline yet.'; return c; };
async function run(btn, fn) {
  const c = target(), s = $s('sm-status');
  btn.disabled = true; s.textContent = 'Working… a long video takes a while. Keep this tab open.';
  try { pushHistory(); const before = JSON.stringify(state.clips); const r = await fn(c); if (JSON.stringify(state.clips) === before) state.history.pop(); s.textContent = r.text || r; return r; }
  catch (e) { state.history.pop(); s.textContent = 'Could not do it: ' + e.message; }
  finally { btn.disabled = false; }
}
$s('btn-smart').onclick = () => { target(); $s('sm-status').textContent = ''; dlg.showModal(); };
$s('sm-close').onclick = () => dlg.close();
$s('sm-scenes').onclick = e => run(e.target, c => detectScenes(c, { split: $s('sm-split').checked, sens: +$s('sm-sens').value }));
$s('sm-silence').onclick = e => run(e.target, c => removeSilence(c, { minPause: +$s('sm-pause').value }));
$s('sm-hl-go').onclick = async e => {
  const r = await run(e.target, c => findHighlights(c, { count: +$s('sm-n').value }));
  if (r && r.highlights) {
    $s('sm-hl').innerHTML = r.highlights.map(h => `<a data-t="${h.start}">${fmt(h.start)}–${fmt(h.end)} <b>${attr(h.title)}</b><br><small>${attr(h.reason)}</small></a>`).join('');
    $s('sm-hl-keep').disabled = false;
  }
};
$s('sm-hl').addEventListener('click', e => { const a = e.target.closest('a[data-t]'); if (a) seek(+a.dataset.t); });
$s('sm-hl-keep').onclick = e => run(e.target, c => keepHighlights(c)).then(() => { $s('sm-hl').innerHTML = ''; $s('sm-hl-keep').disabled = true; });

// ---------- chat assistant ----------
window.aiToolsChat = async function (a, pick) {
  const c = a.clip != null ? pick() : mediaClip();
  let r;
  if (a.type === 'detect_scenes') r = await detectScenes(c, { split: !!a.split, sens: Math.min(0.6, Math.max(0.1, +a.sensitivity || 0.3)) });
  else if (a.type === 'remove_silence') r = await removeSilence(c, { minPause: Math.min(3, Math.max(0.3, +a.minPause || 0.6)) });
  else r = await findHighlights(c, { count: Math.min(10, Math.max(1, Math.round(+a.count || 5))) });
  chatSay(r.text, 'bot');
};
})();
