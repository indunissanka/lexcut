'use strict';
// Transition dialog: choose a style and length, then put it on the cut before the selected clip, or on every cut of the layer.
// The drawing and the audio fade live in app.js (transFx); this file only sets c.tr = {type, dur} on clips.
(() => {
$('#tx-type').innerHTML = Object.entries(TRANSITIONS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
const group = c => [c, ...partners(c)];
const target = () => { const c = selClip(); return c && c.text == null ? c : null; };
const prevOf = c => state.clips.filter(o => o.id !== c.id && o.track === c.track && o.text == null && o.start + o.dur <= c.start + 0.05).sort((a, b) => b.start - a.start)[0];
const touches = (a, b) => a && Math.abs(a.start + a.dur - b.start) < 0.05;
const cur = () => ({ type: $('#tx-type').value, dur: +$('#tx-dur').value });
const setTr = (c, tr) => { for (const o of group(c)) { if (tr) o.tr = { ...tr }; else delete o.tr; } };

function info() {
  const c = target(), el = $('#tx-info');
  $('#tx-val').textContent = (+$('#tx-dur').value).toFixed(1);
  for (const id of ['tx-sel', 'tx-all', 'tx-rm']) $('#' + id).disabled = !c;
  if (!c) { el.textContent = 'Select a video, picture or audio clip first. The transition goes on the cut before it.'; return; }
  const p = prevOf(c), name = assetOf(c)?.name || 'clip';
  el.textContent = c.tr ? `“${name}” has: ${TRANSITIONS[c.tr.type]}, ${c.tr.dur} s.` : (touches(p, c) ? `“${name}” follows another clip directly: the transition goes on that cut.` : `“${name}” has no clip right before it: it will just start with the effect.`);
  if (c.tr) { $('#tx-type').value = c.tr.type; $('#tx-dur').value = c.tr.dur; $('#tx-val').textContent = (+c.tr.dur).toFixed(1); }
}
$('#tl-trans').onclick = () => { $('#tx-status').textContent = ''; info(); $('#tx-dialog').showModal(); };
$('#tx-dur').oninput = () => { $('#tx-val').textContent = (+$('#tx-dur').value).toFixed(1); };
$('#tx-close').onclick = () => $('#tx-dialog').close();

$('#tx-sel').onclick = () => {
  const c = target(); if (!c) return;
  pushHistory(); setTr(c, cur()); afterEdit();
  $('#tx-status').textContent = `Added: ${TRANSITIONS[cur().type]}, ${cur().dur} s. Press play to see it. Undo with Ctrl/Cmd+Z.`;
};
$('#tx-all').onclick = () => {
  const c = target(); if (!c) return;
  const list = state.clips.filter(o => o.track === c.track && o.text == null && !o.audioOnly === !c.audioOnly).sort((a, b) => a.start - b.start);
  const hit = list.filter((o, i) => i > 0 && touches(list[i - 1], o));
  if (!hit.length) { $('#tx-status').textContent = 'No clips on this layer touch each other, so there are no cuts to add a transition to.'; return; }
  pushHistory(); for (const o of hit) setTr(o, cur()); afterEdit();
  $('#tx-status').textContent = `Added ${TRANSITIONS[cur().type]} to ${hit.length} cut${hit.length > 1 ? 's' : ''}. Undo with Ctrl/Cmd+Z.`;
};
$('#tx-rm').onclick = () => {
  const c = target(); if (!c) return;
  const all = state.clips.filter(o => o.track === c.track && o.tr).length, own = !!c.tr;
  pushHistory();
  if (c.tr) setTr(c, null); else for (const o of state.clips.filter(o => o.track === c.track)) setTr(o, null);
  afterEdit(); info();
  $('#tx-status').textContent = own ? 'Transition removed from this clip.' : `Removed ${all} transition${all === 1 ? '' : 's'} from this layer.`;
};
})();
