'use strict';
// "Fix grammar and style" with Claude: for the transcript (Transcript dialog) and for captions on the timeline (Claude AI dialog).
// Timestamps and the number of lines never change: Claude only rewrites the text of each line, and anything it gets wrong is kept as it was.
(() => {
const MODES = {
  grammar: ['Fix grammar and punctuation only', 'Fix ONLY grammar, spelling, punctuation and capitalization. Keep the speaker\'s exact wording and tone.'],
  natural: ['Grammar + natural, clear style', 'Fix grammar, spelling, punctuation and capitalization. Also remove stutters, accidental repeated words and filler words (um, uh, you know, like) and smooth awkward phrasing so it reads naturally, while keeping the speaker\'s voice and exact meaning.'],
  professional: ['Grammar + professional tone', 'Fix grammar, spelling, punctuation and capitalization, remove fillers and stutters, and polish the wording into a clear, professional, well-written tone without changing the meaning.'],
  concise: ['Grammar + tighter and shorter', 'Fix grammar, spelling, punctuation and capitalization, remove fillers and repetition, and make each line tighter and more concise while keeping every key fact.'],
};
const SYSTEM = mode => [
  'You are a professional editor polishing the automatic transcript of ONE continuous spoken video. You receive "items:" followed by a JSON array of {"i":number,"text":string}: consecutive segments that are often fragments of longer sentences.',
  `Task: ${MODES[mode][1]}`,
  'Rules:',
  '1. Keep each segment in its OWN language and script. Never translate (Sinhala stays Sinhala, Chinese stays Chinese, and so on).',
  '2. Keep the meaning, facts, names, numbers, URLs and emails. Never invent, add or drop information.',
  '3. Return exactly one item per input item with the same "i". Never merge, split, skip or add items, and never move words from one segment into another.',
  '4. If a segment continues in the next one, keep it as a fragment: do not force a complete sentence or add a final full stop that does not belong.',
  '5. If a segment is unintelligible noise or you are unsure what was said, return it unchanged instead of guessing.',
  '6. No commentary, no notes, no added quotation marks.',
  '7. The text comes from automatic speech recognition, which often mishears a word as a similar-sounding one (very common in Sinhala). When a word is clearly misheard and does not fit the context, replace it with the similar-sounding word that does (for example Sinhala "අද කළ ගුණය ඉතාම සුන්දරයි" -> "අද කාලගුණය ඉතාම සුන්දරයි"). Use correct Sinhala Unicode spelling, including ZWJ forms such as ශ්‍රී.',
  'Items may have an "s" field: the number of the person speaking. Different numbers are different people, so keep each person\'s own way of speaking and never move words between people.',
  'Items in "context_before" are earlier lines for context only: do NOT return them.',
  'Reply with ONLY a JSON array of {"i","text"} in the same order.',
].join('\n');

// items: [{id, text}] -> Map(id -> polished text) for the lines that were improved; stats say how many were kept as they were.
async function polishLines(items, mode, extra, onStatus) {
  const result = new Map(), BATCH = 25;
  const usable = items.filter(it => it.text.trim() && !looksGarbled(it.text));
  const ask = async (batch, before) => {
    const payload = (extra ? `Extra instructions from the user: ${extra}\n` : '')
      + (before.length ? `context_before: ${JSON.stringify(before.map(b => (b.s ? `Person ${b.s}: ` : '') + b.text))}\n` : '')
      + 'items: ' + JSON.stringify(batch.map(b => ({ i: b.id, ...(b.s ? { s: b.s } : {}), text: b.text })));
    let arr;
    try { arr = parseJsonArray(await askClaude(SYSTEM(mode), payload)); } catch { return; }
    const orig = new Map(batch.map(b => [b.id, b.text]));
    for (const o of arr) {
      if (!o || !orig.has(o.i) || typeof o.text !== 'string') continue;
      const t = o.text.trim(), was = orig.get(o.i);
      if (!t || t.length > was.length * 2 + 25 || (mode !== 'concise' && was.length > 24 && t.length < was.length * 0.35)) continue;   // empty or wildly different: do not trust it
      result.set(o.i, t);
    }
  };
  for (let k = 0; k < usable.length; k += BATCH) {
    onStatus(`Claude is polishing… ${Math.min(k + BATCH, usable.length)} of ${usable.length} lines`);
    await ask(usable.slice(k, k + BATCH), usable.slice(Math.max(0, k - 2), k));
  }
  const missing = usable.filter(it => !result.has(it.id));
  for (let m = 0; m < missing.length; m += 5) await ask(missing.slice(m, m + 5), []);   // one more try for what Claude left out, in small groups
  const changed = new Map([...result].filter(([id, t]) => t !== usable.find(u => u.id === id).text));
  return { changed, total: items.length, kept: items.length - changed.size };
}

// ---------- Transcript dialog ----------
const tbox = document.createElement('div');
tbox.className = 'polish-box';
tbox.innerHTML = `
  <label>Fix the transcript with Claude</label>
  <select id="tr-polish-mode">${Object.entries(MODES).map(([k, v]) => `<option value="${k}" ${k === 'natural' ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
  <label style="margin-top:6px">Fix the lines of</label>
  <select id="tr-polish-who"><option value="0">Everyone</option></select>
  <div class="row" style="justify-content:flex-start;margin-top:6px">
    <button type="button" id="tr-polish" disabled>Fix grammar &amp; style with Claude</button>
    <button type="button" id="tr-restore" disabled>Restore original</button>
    <button type="button" id="tr-spk-fix" disabled title="Claude reads the conversation and corrects speaker labels that the voice analysis got wrong">Check speakers with Claude</button>
  </div>
  <p id="tr-polish-status" class="muted" style="padding:2px 0"></p>`;
$('#tr-text').after(tbox);

let backup = null, polishedRef = null;   // backup = the transcript before polishing
const fillWho = () => {
  const sel = $('#tr-polish-who'), keep = sel.value, nums = [...new Set(trSegments.map(s => s.speaker).filter(Boolean))].sort((a, b) => a - b);
  sel.innerHTML = '<option value="0">Everyone</option>' + nums.map(n => `<option value="${n}">${nameOf(n)} only</option>`).join('');
  sel.value = nums.includes(+keep) ? keep : '0';
};
window.addEventListener('tr-names', fillWho);
const refresh = () => {
  fillWho();
  $('#tr-polish').disabled = !trSegments.length;
  $('#tr-spk-fix').disabled = !trSegments.some(s => s.speaker);
  $('#tr-restore').disabled = !(backup && polishedRef === trSegments);
};
new MutationObserver(refresh).observe($('#tr-status'), { childList: true, characterData: true, subtree: true });
$('#btn-tr').addEventListener('click', refresh);

const showSegs = segs => { $('#tr-text').value = segs.map(trLine).join('\n'); };

$('#tr-polish').onclick = async () => {
  const st = $('#tr-polish-status'), btn = $('#tr-polish');
  const cur = trCurrent();
  if (!cur.length) return;
  btn.disabled = true; $('#tr-restore').disabled = true;
  st.textContent = 'Claude is polishing…';
  try {
    const only = +$('#tr-polish-who').value;   // 0 = everyone, otherwise only this person's lines are sent to Claude and changed
    const items = cur.map((s, i) => ({ id: i, s: s.speaker, text: s.text })).filter(it => !only || it.s === only);
    if (!items.length) { st.textContent = 'No lines for that person.'; refresh(); return; }
    const r = await polishLines(items, $('#tr-polish-mode').value, '', m => { st.textContent = m; });
    if (!r.changed.size) { st.textContent = 'Nothing needed fixing (or Claude’s changes were rejected as unsafe).'; refresh(); return; }
    if (!backup || polishedRef !== trSegments) backup = cur.map(s => ({ ...s }));   // keep the FIRST original so repeated polishing can still be undone
    const next = cur.map((s, i) => ({ ...s, text: r.changed.get(i) ?? s.text }));
    trSegments = next; polishedRef = next;
    showSegs(next);
    st.textContent = `Done: improved ${r.changed.size} of ${r.total} ${only ? nameOf(only) + '’s ' : ''}lines. Timestamps are unchanged. Use “Add as captions” or the downloads to use the fixed text.`;
  } catch (e) { st.textContent = 'Error: ' + e.message; }
  for (const id of ['tr-caps', 'tr-srt', 'tr-txt']) $('#' + id).disabled = !trSegments.length;
  refresh();
};
$('#tr-restore').onclick = () => {
  if (!backup) return;
  trSegments = backup.map(s => ({ ...s })); polishedRef = null; backup = null;
  showSegs(trSegments);
  $('#tr-polish-status').textContent = 'Original transcript restored.';
  refresh();
};

// ---------- Speaker check: Claude cannot hear audio, so it only corrects labels the voice analysis likely got wrong, using the conversation ----------
const SPK_SYSTEM = [
  'You review speaker labels in an automatic transcript of a conversation. A voice analysis already grouped the lines by how each voice SOUNDS, and it is usually right.',
  'You receive a JSON array of {"i","s","text"}: line number, speaker number, text. You cannot hear the audio.',
  'Change a line\'s speaker ONLY when the text clearly shows the label is wrong: an answer that follows a question but has the same speaker as the question, someone being addressed by name who then replies, a sentence split in the middle between two speakers, or a one-word reaction clearly from the other person.',
  'When unsure, leave the label as it is. Use only the speaker numbers that already exist. Do not add speakers.',
  'Reply with ONLY a JSON array of {"i","s"} for the lines whose speaker you change (an empty array [] if none).',
].join('\n');
$('#tr-spk-fix').onclick = async () => {
  const st = $('#tr-polish-status'), cur = trCurrent(), ids = new Set(cur.map(s => s.speaker).filter(Boolean));
  if (ids.size < 2) { st.textContent = 'Only one speaker was found, so there is nothing to check.'; return; }
  $('#tr-spk-fix').disabled = true;
  try {
    const changes = new Map();
    for (let k = 0; k < cur.length; k += 60) {
      st.textContent = `Claude is checking speakers… ${Math.min(k + 60, cur.length)} of ${cur.length} lines`;
      const slice = cur.slice(Math.max(0, k - 3), k + 60).map((s, j) => ({ i: Math.max(0, k - 3) + j, s: s.speaker, text: s.text }));
      let arr; try { arr = parseJsonArray(await askClaude(SPK_SYSTEM, 'lines: ' + JSON.stringify(slice))); } catch { continue; }
      for (const o of arr) if (o && Number.isInteger(o.i) && ids.has(o.s) && cur[o.i] && cur[o.i].speaker !== o.s) changes.set(o.i, o.s);
    }
    if (changes.size > cur.length * 0.3) { st.textContent = 'Claude wanted to change too many lines, so nothing was changed.'; }
    else if (!changes.size) st.textContent = 'Claude found no speaker labels that need changing.';
    else {
      if (!backup || polishedRef !== trSegments) backup = cur.map(s => ({ ...s }));
      const next = cur.map((s, i) => ({ ...s, speaker: changes.get(i) ?? s.speaker }));
      trSegments = next; polishedRef = next; showSegs(next);
      st.textContent = `Claude corrected the speaker of ${changes.size} line${changes.size > 1 ? 's' : ''}. “Restore original” undoes it.`;
    }
  } catch (e) { st.textContent = 'Error: ' + e.message; }
  refresh();
};

// ---------- Claude AI dialog: the same action for the captions already on the timeline ----------
AI.polish = {
  label: 'Style (optional): grammar | natural | professional | concise, or your own instructions',
  placeholder: 'Empty = grammar + natural, clear style',
  system: '',
};
const opt = document.createElement('option');
opt.value = 'polish'; opt.textContent = 'Fix grammar and style of captions';
$('#ai-action').insertBefore(opt, $('#ai-action').querySelector('[value=translate]'));
const _runAi = runAi;
const runPolishCaptions = async () => {
  const status = $('#ai-status'), run = $('#ai-run'), input = $('#ai-input').value.trim();
  const pool = multiClips().filter(c => c.text != null);
  const clips = (pool.length ? pool : state.clips.filter(c => c.text != null && !TRACKS[c.track].name.startsWith('Translation:'))).slice().sort((a, b) => a.start - b.start);
  if (!clips.length) { status.textContent = 'No text or caption clips on the timeline.'; return; }
  const key = input.toLowerCase();
  const mode = MODES[key] ? key : 'natural';
  run.disabled = true;
  try {
    const r = await polishLines(clips.map(c => ({ id: c.id, text: c.text })), mode, MODES[key] ? '' : input, m => { status.textContent = m; });
    if (!r.changed.size) { status.textContent = 'Nothing needed fixing (or Claude’s changes were rejected as unsafe).'; run.disabled = false; return; }
    pushHistory();
    for (const c of clips) if (r.changed.has(c.id)) c.text = r.changed.get(c.id);
    afterEdit();
    status.textContent = `Done: improved ${r.changed.size} of ${r.total} captions. Undo with Ctrl/Cmd+Z.`;
  } catch (e) { status.textContent = 'Error: ' + e.message; }
  run.disabled = false;
};
$('#ai-run').onclick = () => ($('#ai-action').value === 'polish' ? runPolishCaptions() : _runAi());
})();
