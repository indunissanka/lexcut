'use strict';
// LexCut: a small browser video editor (multi-track timeline, text/captions, export as MP4/MOV/WebM/AVI/MKV/GIF/MP3/WAV/SRT/VTT).

const $ = s => document.querySelector(s);
const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
let W = 1280, H = 720;
const FPS = 30;
const LABEL_W = 90;
const TRACKS = [
  { name: 'Text', kind: 'text' },
  { name: 'Video 2', kind: 'video' },
  { name: 'Video 1', kind: 'video' },
  { name: 'Audio', kind: 'audio' },
];
const LANE_ORDER = TRACKS.map((_, i) => i);   // timeline rows, top to bottom (track indexes never change, so undo stays valid)
const activeTrack = {};                      // kind -> track index that new clips of that kind go on
const drawOrder = () => LANE_ORDER.filter(i => TRACKS[i].kind !== 'audio').reverse(); // bottom to top
const TEXT_FONT = '-apple-system, "Sinhala MN", sans-serif';

const state = {
  assets: new Map(), // id -> {id,name,kind,url,dur,el}
  clips: [],         // {id,track,start,in,dur,assetId|text,vol,opacity,size,color,bg,y}
  sel: null,
  t: 0,
  playing: false,
  pps: 80,
  history: [],
  future: [],
};
let nextId = 1;
const uid = () => nextId++;

// ---------- helpers ----------
const totalDur = () => state.clips.reduce((m, c) => Math.max(m, c.start + c.dur), 0);
const active = (c, t) => t >= c.start && t < c.start + c.dur;
const spd = c => c.speed || 1;
const srcTime = (c, t) => c.in + srcOffset(c, t - c.start);
const fadeFactor = (c, t) => {
  let f = 1;
  if (c.fadeIn > 0) f = Math.min(f, (t - c.start) / c.fadeIn);
  if (c.fadeOut > 0) f = Math.min(f, (c.start + c.dur - t) / c.fadeOut);
  return Math.max(0, Math.min(1, f));
};
// ---------- transitions between neighbouring clips on one layer ----------
// c.tr = {type, dur} sits on the clip AFTER the cut. The first half of dur is the incoming effect on that clip; the last half of
// the previous clip (if it ends at the cut) plays the mirror effect, so no overlap is needed. The linked audio fades with it.
const TRANSITIONS = { fade: 'Fade through black', dipwhite: 'Flash through white', slideleft: 'Push left', slideright: 'Push right', slideup: 'Push up', slidedown: 'Push down', zoom: 'Zoom', blur: 'Blur', wipe: 'Wipe', circle: 'Circle reveal', spin: 'Spin', flip: '3D flip', whip: 'Whip pan' };
function transFx(c, t) {
  if (c.text != null) return null;
  const end = c.start + c.dur;
  if (c.tr) { const h = Math.min(c.tr.dur / 2, c.dur / 2); if (h > 0 && t < c.start + h) return { type: c.tr.type, a: Math.max(0, (t - c.start) / h), dir: 1 }; }
  const nx = state.clips.find(o => o.tr && o.id !== c.id && o.track === c.track && o.text == null && Math.abs(o.start - end) < 0.05);
  if (nx) { const h = Math.min(nx.tr.dur / 2, c.dur / 2); if (h > 0 && t > end - h) return { type: nx.tr.type, a: Math.max(0, (end - t) / h), dir: -1 }; }
  return null;
}
const transVol = (c, t) => { const f = transFx(c, t); return f ? Math.min(1, f.a) : 1; };
// ---------- keyframes: a property can change over the length of a clip ----------
// c.kf = { px: [{t, v}, ...] } with t in seconds from the start of the clip. Between keys the value moves smoothly (or linearly if c.kfSmooth === false).
const KF_PROPS = {
  media: { px: 'Position X (%)', py: 'Position Y (%)', scale: 'Scale', rot: 'Rotation (deg)', opacity: 'Opacity', rotY: '3D flip left-right (deg)', rotX: '3D flip up-down (deg)', mx: 'Mask position X (%)', my: 'Mask position Y (%)' },
  video: { px: 'Position X (%)', py: 'Position Y (%)', scale: 'Scale', rot: 'Rotation (deg)', opacity: 'Opacity', rotY: '3D flip left-right (deg)', rotX: '3D flip up-down (deg)', mx: 'Mask position X (%)', my: 'Mask position Y (%)', speed: 'Speed (0.25x - 4x): speed ramp' },
  text: { x: 'Position X (%)', y: 'Position Y (%)', rot: 'Rotation (deg)', opacity: 'Opacity', amount: 'Effect amount' },
  audio: { vol: 'Volume (raise or lower during the clip)' },
};
const KF_DEFAULT = { px: 0, py: 0, scale: 1, rot: 0, opacity: 1, x: 50, y: 50, speed: 1, vol: 1, rotY: 0, rotX: 0, mx: 0, my: 0, amount: 50 };
const KF_ANIM = new Set(Object.keys(KF_DEFAULT));
const kfEase = u => u * u * (3 - 2 * u);
function kfAt(c, f, t) { return kfRel(c, f, t - c.start); }   // value of animated property f at timeline time t, or undefined when f has no keyframes
function kfRel(c, f, r) {   // the same, r seconds after the start of the clip
  const ks = c.kf && c.kf[f];
  if (!ks || !ks.length) return undefined;
  const last = ks[ks.length - 1];
  if (r <= ks[0].t) return ks[0].v;
  if (r >= last.t) return last.v;
  let i = 1; while (ks[i].t < r) i++;
  const a = ks[i - 1], b = ks[i];
  let u = (r - a.t) / (b.t - a.t);
  if (c.kfSmooth !== false && !f.startsWith('stab')) u = kfEase(u);
  return a.v + (b.v - a.v) * u;
}
// ---- speed ramp: the speed keys are a curve; the video position is the area under it ----
const hasRamp = c => !!(c.kf && c.kf.speed && c.kf.speed.length);
function srcOffset(c, r) {   // seconds of the source file played after r seconds of the clip
  if (!hasRamp(c)) return r * spd(c);
  const sg = r < 0 ? -1 : 1, R = Math.abs(r), n = Math.max(1, Math.ceil(R / 0.04)), h = R / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += kfRel(c, 'speed', sg * (i + 0.5) * h) * h;
  return sg * sum;
}
const curSpeed = (c, t) => (hasRamp(c) ? kfAt(c, 'speed', t) : spd(c));
function rampMaxDur(c, inn = c.in) {   // longest the clip can be before it runs out of source
  const room = assetOf(c).dur - inn;
  let lo = 0.1, hi = Math.max(0.2, room / 0.2);
  if (srcOffset(c, hi) <= room) return hi;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (srcOffset(c, m) <= room) lo = m; else hi = m; }
  return lo;
}
const rampOk = c => !hasRamp(c) || assetOf(c).kind !== 'video' || srcOffset(c, c.dur) <= assetOf(c).dur - c.in + 0.05;
function kfMirror(c) {   // the linked sound follows the same speed curve
  for (const p of partners(c)) {
    if (hasRamp(c)) { p.kf = p.kf || {}; p.kf.speed = cloneKf({ s: c.kf.speed }).s; p.kfSmooth = c.kfSmooth; }
    else if (p.kf) { delete p.kf.speed; if (!Object.keys(p.kf).length) delete p.kf; }
  }
}
function withKf(c, t) {   // the clip as it looks at time t (a copy with the animated values filled in)
  if (!c.kf) return c;
  let o = null;
  for (const f in c.kf) { const v = kfAt(c, f, t); if (v !== undefined) (o = o || { ...c })[f] = v; }
  return o || c;
}
const propNow = (c, f) => kfAt(c, f, state.t) ?? c[f] ?? KF_DEFAULT[f];
function setKey(c, f, v, t = state.t) {
  const r = Math.max(0, Math.min(c.dur, t - c.start));
  c.kf = c.kf || {};
  const ks = c.kf[f] = c.kf[f] || [], k = ks.find(o => Math.abs(o.t - r) < 0.02);
  if (k) k.v = v; else { ks.push({ t: r, v }); ks.sort((a, b) => a.t - b.t); }
}
const setAnim = (c, f, v) => { if (c.kf && c.kf[f] && c.kf[f].length) setKey(c, f, v); else c[f] = v; };   // animated: set a key at the playhead
const cloneKf = kf => (kf ? JSON.parse(JSON.stringify(kf)) : undefined);
function kfSamples(c, f, a, b) {   // keys covering [a, b] (clip time) so that straight lines between them reproduce the current curve
  const ks = c.kf[f], times = new Set([+a.toFixed(4), +b.toFixed(4)]);
  for (const k of ks) if (k.t > a + 0.001 && k.t < b - 0.001) times.add(+k.t.toFixed(4));
  if (c.kfSmooth !== false && !f.startsWith('stab')) for (let t = Math.ceil(a / 0.1) * 0.1; t < b - 0.001; t += 0.1) times.add(+t.toFixed(4));
  return [...times].sort((x, y) => x - y).map(t => ({ t, v: kfRel(c, f, t) }));
}
const kfNeedsLin = c => c.kfSmooth !== false && !!c.kf && Object.keys(c.kf).some(f => !f.startsWith('stab'));   // easing cannot be kept across a cut, so the pieces use the sampled curve with straight lines
function kfSplit(c, rel) {   // keys for the two halves of a clip cut rel seconds in
  if (!c.kf) return null;
  const left = {}, right = {};
  for (const f in c.kf) {
    left[f] = kfSamples(c, f, 0, rel);
    right[f] = kfSamples(c, f, rel, Math.max(rel + 0.001, c.dur)).map(k => ({ t: k.t - rel, v: k.v }));
  }
  return { left, right, lin: kfNeedsLin(c) };
}
function kfFront(c, delta) {   // keys after the start of a clip moved delta seconds later (delta < 0: earlier)
  if (!c.kf) return undefined;
  const out = {};
  for (const f in c.kf) {
    out[f] = delta >= 0 ? kfSamples(c, f, delta, Math.max(delta + 0.001, c.dur)).map(k => ({ t: k.t - delta, v: k.v }))
      : c.kf[f].map(k => ({ t: k.t - delta, v: k.v }));
  }
  return out;
}
function kfRetime(c, k) { if (c.kf) for (const f in c.kf) for (const o of c.kf[f]) o.t *= k; }   // speed changed: the animation keeps its shape
const trackState = TRACKS.map(() => ({ hidden: false, muted: false, vol: 1, pan: 0, solo: false }));
const wordCount = t => (String(t).trim().match(/\S+/g) || []).length;
function countText() {
  const c = selClip();
  if (!c || c.text == null) return '';
  const group = multiClips();
  const words = (group.length ? group : [c]).reduce((n, o) => n + wordCount(o.text), 0);
  const chars = (group.length ? group : [c]).reduce((n, o) => n + o.text.length, 0);
  return `${words} word${words === 1 ? '' : 's'} · ${chars} characters${group.length ? ` (all ${group.length} selected)` : ''}`;
}
state.markers = [];   // seconds
const selClip = () => state.clips.find(c => c.id === state.sel);
// Several clips selected at once (Select all text). Only counts while the main selection is one of them.
state.multi = [];
const multiClips = () => (state.multi.length > 1 && state.multi.includes(state.sel) ? state.clips.filter(c => state.multi.includes(c.id)) : []);
function selectClips(cs) {
  cs = cs.slice().sort((a, b) => a.start - b.start);
  if (!cs.length) return;
  state.multi = cs.map(c => c.id);
  state.sel = cs[0].id;
  renderTimeline(); renderInspector(); draw();
}
const selectAllText = () => selectClips(state.clips.filter(c => c.text != null));
const selectLayer = i => selectClips(state.clips.filter(c => c.track === i));
const assetOf = c => state.assets.get(c.assetId);
const clipKind = c => (c.text != null ? 'text' : c.audioOnly ? 'audio' : assetOf(c).kind);
const laneOk = (kind, ti) => {
  const k = TRACKS[ti].kind;
  return kind === 'text' ? k === 'text' : kind === 'audio' ? k === 'audio' : k === 'video';
};
const fits = (c, start, dur, track) =>
  state.clips.every(o => o.id === c.id || o.track !== track || start >= o.start + o.dur - 1e-6 || start + dur <= o.start + 1e-6);
const fmt = s => {
  s = Math.max(0, s);
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + (s - m * 60).toFixed(2).padStart(5, '0');
};
const mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

// ---------- history ----------
function pushHistory() {
  state.history.push(JSON.stringify(state.clips));
  if (state.history.length > 100) state.history.shift();
  state.future = [];
}
function undo() {
  if (!state.history.length) return;
  state.future.push(JSON.stringify(state.clips));
  state.clips = JSON.parse(state.history.pop());
  afterEdit();
}
function redo() {
  if (!state.future.length) return;
  state.history.push(JSON.stringify(state.clips));
  state.clips = JSON.parse(state.future.pop());
  afterEdit();
}
function afterEdit() {
  // undo can bring back clips whose layer was removed: show that layer again
  const back = [...new Set(state.clips.map(c => c.track))].filter(t => !LANE_ORDER.includes(t));
  for (const t of back) { if (TRACKS[t].kind === 'audio') LANE_ORDER.push(t); else LANE_ORDER.unshift(t); }
  if (back.length) buildLabels();
  if (!selClip()) state.sel = null;
  const lead = selClip();
  if (lead && lead.link) syncLinked(lead);
  renderTimeline(); renderInspector(); syncMedia(); draw(); updateTime();
}

// ---------- media import ----------
let actx = null, streamDest = null, masterGain = null;
// Every media element goes through: rumble filter > 3-band EQ > compressor > pan > volume > master > speakers and the export recording.
function connectAudio(el) {
  if (!actx) {
    actx = new AudioContext(); streamDest = actx.createMediaStreamDestination();
    masterGain = actx.createGain();
    masterGain.gain.value = +(localStorage.getItem('oc-master') || 1);
    masterGain.connect(actx.destination); masterGain.connect(streamDest);
  }
  const src = actx.createMediaElementSource(el);
  const bq = (type, f, q = 0.9) => { const n = actx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const hp = bq('highpass', 10, 0.7), lo = bq('lowshelf', 150), mid = bq('peaking', 1200), hi = bq('highshelf', 6000);
  const comp = actx.createDynamicsCompressor(), pan = actx.createStereoPanner(), gain = actx.createGain(), an = actx.createAnalyser();
  comp.threshold.value = 0; comp.ratio.value = 1; comp.knee.value = 0; comp.attack.value = 0.01; comp.release.value = 0.2;
  an.fftSize = 512;
  src.connect(hp); hp.connect(lo); lo.connect(mid); mid.connect(hi); hi.connect(comp); comp.connect(pan); pan.connect(gain); gain.connect(masterGain); gain.connect(an);
  el.__chain = { src, hp, lo, mid, hi, comp, pan, gain, an };
}
function audioApply(el, c, vol, pan) {   // set the chain for the clip that is playing on this element
  const ch = el.__chain;
  if (!ch) { el.volume = Math.max(0, Math.min(1, vol)); return; }
  el.volume = 1;
  const t = actx.currentTime, live = actx.state === 'running', set = (p, v) => { if (Math.abs(p.value - v) > 1e-3) { if (live) p.setTargetAtTime(v, t, 0.02); else p.value = v; } };   // smooth while playing; direct while the audio engine has not started yet
  set(ch.gain.gain, Math.max(0, vol)); set(ch.pan.pan, Math.max(-1, Math.min(1, pan)));
  set(ch.hp.frequency, c.hp || 10); set(ch.lo.gain, c.eqLo || 0); set(ch.mid.gain, c.eqMid || 0); set(ch.hi.gain, c.eqHi || 0);
  const k = Math.max(0, Math.min(1, (c.comp || 0) / 100));   // compressor "amount": 0 = off
  set(ch.comp.threshold, -k * 38); set(ch.comp.ratio, 1 + k * 9); set(ch.comp.knee, 8 + k * 12);
}

function audioPlayer(a) {   // the player of an audio file, made when it is needed
  if (!a.el) {
    const el = document.createElement('audio');
    el.preload = 'auto';
    el.src = a.url;
    connectAudio(el);
    a.el = el;
  }
  a.lastUse = performance.now();
  return a.el;
}
function releasePlayer(a) {
  const el = a.el;
  if (!el) return;
  el.pause();
  if (el.__chain) for (const n of Object.values(el.__chain)) try { n.disconnect(); } catch { /* already disconnected */ }
  el.removeAttribute('src'); el.load();
  a.el = null;
}

function kindOf(f) { return f.type.startsWith('video/') ? 'video' : f.type.startsWith('audio/') ? 'audio' : f.type.startsWith('image/') ? 'image' : null; }

async function loadAsset(f, id) {
  const kind = kindOf(f);
  const url = URL.createObjectURL(f);
  const a = { id, name: f.name, kind, url, dur: 5, el: null, file: f };
  if (kind === 'image') {
    a.el = new Image();
    a.el.src = url;
    await a.el.decode();
  } else if (kind === 'audio') {
    // Chrome allows only about 75 media players per page. A project can hold hundreds of voice lines, so an audio
    // file gets a player only while one of its clips plays (audioPlayer / releasePlayer, driven by syncMedia).
    const el = document.createElement('audio');
    el.preload = 'metadata';
    el.src = url;
    try {
      await new Promise((res, rej) => { el.onloadedmetadata = res; el.onerror = () => rej(new Error('cannot decode')); });
      if (!isFinite(el.duration)) {
        await new Promise(r => { const to = setTimeout(r, 8000); el.ondurationchange = () => { if (isFinite(el.duration)) { clearTimeout(to); r(); } }; el.currentTime = 1e6; });
      }
      a.dur = isFinite(el.duration) ? el.duration : 5;
    } finally { el.removeAttribute('src'); el.load(); }
  } else {
    a.el = document.createElement(kind);
    a.el.preload = 'auto';
    a.el.playsInline = true;
    a.el.src = url;
    await new Promise((res, rej) => { a.el.onloadedmetadata = res; a.el.onerror = () => rej(new Error('cannot decode')); });
    if (!isFinite(a.el.duration)) {   // recordings without a stored length: seeking far ahead reveals it
      await new Promise(r => { const to = setTimeout(r, 8000); a.el.ondurationchange = () => { if (isFinite(a.el.duration)) { clearTimeout(to); r(); } }; a.el.currentTime = 1e6; });
      a.el.currentTime = 0;
    }
    a.dur = isFinite(a.el.duration) ? a.el.duration : 5;
    a.el.addEventListener('seeked', () => { if (!state.playing) draw(); });
    connectAudio(a.el);
    if (kind === 'video') {   // a second player for the video's sound, so it can live on its own Audio layer
      a.aEl = document.createElement('video');
      a.aEl.preload = 'auto';
      a.aEl.playsInline = true;
      a.aEl.src = url;
      connectAudio(a.aEl);
    }
  }
  return a;
}

async function addFiles(files) {
  for (const f of files) {
    if (!kindOf(f)) continue;
    try { const a = await loadAsset(f, uid()); state.assets.set(a.id, a); }
    catch (e) { alert(`Could not load ${f.name}: ${e.message}`); }
  }
  renderBin();
}

function renderBin() {
  const list = $('#bin-list');
  list.innerHTML = '';
  if (!state.assets.size) { list.innerHTML = '<p class="muted">Drop files here or click Import media. Drag items onto the timeline, or double-click to add.</p>'; return; }
  for (const a of state.assets.values()) {
    const row = mk('div', 'asset');
    row.draggable = true;
    row.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', String(a.id)));
    row.addEventListener('dblclick', () => addAssetAtEnd(a));
    let thumb;
    if (a.kind === 'image') { thumb = mk('img', 'thumb'); thumb.src = a.url; }
    else if (a.kind === 'video') { thumb = mk('video', 'thumb'); thumb.muted = true; thumb.preload = 'metadata'; thumb.src = a.url + '#t=0.5'; }
    else { thumb = mk('div', 'thumb'); thumb.textContent = '♪'; }
    const meta = mk('div', 'meta');
    meta.innerHTML = '<div class="name"></div><div class="dur"></div>';
    meta.firstChild.textContent = a.name;
    meta.lastChild.textContent = `${a.kind} · ${a.kind === 'image' ? 'still' : fmt(a.dur)}`;
    const x = mk('button', 'x');
    x.textContent = '×';
    x.title = 'Remove from project';
    x.onclick = () => removeAsset(a.id);
    row.append(thumb, meta, x);
    list.append(row);
  }
}

function removeAsset(id) {
  pushHistory();
  state.clips = state.clips.filter(c => c.assetId !== id);
  const a = state.assets.get(id);
  if (a && a.kind === 'audio') releasePlayer(a);
  else { if (a && a.el && a.el.pause) a.el.pause(); if (a && a.aEl) a.aEl.pause(); }
  state.assets.delete(id);
  renderBin(); afterEdit();
}

// ---------- clips ----------
function defaultTrack(kind) {
  const k = kind === 'image' ? 'video' : kind;
  if (activeTrack[k] != null && LANE_ORDER.includes(activeTrack[k])) return activeTrack[k];
  const lanes = LANE_ORDER.filter(i => TRACKS[i].kind === k);
  return k === 'video' ? lanes[lanes.length - 1] : lanes[0];
}
// Add a new layer: text and video go on top of the picture, audio at the bottom. New clips of that type land on it.
function addLayer(kind) {
  const n = TRACKS.filter(t => t.kind === kind).length + 1;
  const label = { text: 'Text', video: 'Video', audio: 'Audio' }[kind];
  TRACKS.push({ name: `${label} ${n}`, kind });
  trackState.push({ hidden: false, muted: false, vol: 1, pan: 0, solo: false });
  const idx = TRACKS.length - 1;
  if (kind === 'audio') LANE_ORDER.push(idx); else LANE_ORDER.unshift(idx);
  activeTrack[kind] = idx;
  buildLabels(); renderTimeline(); draw();
}

function newMediaClip(a, track, start) {
  return { id: uid(), track, start, in: 0, dur: a.dur, assetId: a.id, vol: 1, opacity: 1 };
}

// ---- a video's sound lives on its own Audio layer, linked to the picture clip ----
const partners = c => (c.link ? state.clips.filter(o => o.link === c.link && o.id !== c.id) : []);
function syncLinked(c) {   // linked clips keep the same timing
  for (const o of partners(c)) { o.start = c.start; o.in = c.in; o.dur = c.dur; o.speed = c.speed; }
}
function detachAudio(c) {
  const a = assetOf(c);
  if (!a || a.kind !== 'video' || c.silent || c.audioOnly) return null;
  let track = defaultTrack('audio');
  const au = { id: uid(), track, start: c.start, in: c.in, dur: c.dur, assetId: c.assetId, vol: c.vol ?? 1, audioOnly: true, link: c.link || uid() };
  for (const k of ['speed', 'fadeIn', 'fadeOut']) if (c[k] != null) au[k] = c[k];
  if (!fits(au, au.start, au.dur, track)) { addLayer('audio'); track = TRACKS.length - 1; au.track = track; }   // the audio layer is busy: use a new one
  c.silent = true;
  c.link = au.link;
  state.clips.push(au);
  return au;
}
function addMediaClips(a, track, start) {
  const c = newMediaClip(a, track, start);
  if (!fits(c, start, c.dur, track)) c.start = laneEnd(track);
  state.clips.push(c);
  if (a.kind === 'video') detachAudio(c);
  return c;
}
function splitClip(c, t) {   // cuts c and its linked partners at time t, returns the right-hand part of c
  const cut = o => { const n = { ...o, id: uid(), start: t, in: srcTime(o, t), dur: o.start + o.dur - t }; delete n.tr; const sp = kfSplit(o, t - o.start); if (sp) { n.kf = sp.right; o.kf = sp.left; if (sp.lin) n.kfSmooth = o.kfSmooth = false; } return n; };   // the new right half has no transition at the split
  const ps = partners(c).filter(o => t > o.start + 0.05 && t < o.start + o.dur - 0.05);
  const nl = c.link ? uid() : undefined;
  const right = cut(c);
  if (nl) right.link = nl;
  const rights = ps.map(o => ({ ...cut(o), link: nl }));
  c.dur = t - c.start;
  for (const o of ps) o.dur = t - o.start;
  state.clips.push(right, ...rights);
  return right;
}
function removeClips(cs) {   // delete clips together with their linked partners
  const gone = new Set();
  for (const c of cs) { gone.add(c.id); for (const p of partners(c)) gone.add(p.id); }
  state.clips = state.clips.filter(o => !gone.has(o.id));
}
// Cutting picture or sound also cuts the captions, voice and music that play with it, so they stay in sync.
const isMediaClip = c => c && c.assetId != null && TRACKS[c.track] && TRACKS[c.track].kind !== 'text';
function splitCaptionsAt(t, skip) {   // split the text clips (captions) that run across time t
  for (const o of [...state.clips]) if (!skip.has(o.id) && TRACKS[o.track] && TRACKS[o.track].kind === 'text' && t > o.start + 0.05 && t < o.start + o.dur - 0.05) splitClip(o, t);
}
function rippleCutRange(s, e, skip) {   // remove [s, e) from every layer and move later clips left
  const d = e - s, done = new Set(skip), shift = g => { for (const x of [g, ...partners(g)]) x.start = Math.max(0, x.start - d); };
  for (const o of [...state.clips]) {
    if (done.has(o.id) || !state.clips.includes(o)) continue;
    for (const x of [o, ...partners(o)]) done.add(x.id);
    const oe = o.start + o.dur;
    if (oe <= s + 0.05) continue;                                   // ends before the cut
    if (o.start >= e - 0.05) { shift(o); continue; }                // starts after the cut
    const before = o.start < s - 0.05, after = oe > e + 0.05;
    if (before && after) { const mid = splitClip(o, s), right = splitClip(mid, e); removeClips([mid]); shift(right); }
    else if (before) removeClips([splitClip(o, s)]);                // keep the part before the cut
    else if (after) { const right = splitClip(o, e); removeClips([o]); shift(right); }   // keep the part after the cut
    else removeClips([o]);                                          // fully inside the cut
  }
}
function rippleRemove(c) {
  if (isMediaClip(c)) {   // picture/sound: close the gap on every layer, captions included
    const ids = new Set([c.id, ...partners(c).map(p => p.id)]), s = c.start, e = c.start + c.dur;
    removeClips([c]);
    rippleCutRange(s, e, ids);
    return;
  }
  const rs = [c, ...partners(c)];
  removeClips([c]);
  for (const r of rs) { const end = r.start + r.dur - 1e-6; for (const o of state.clips) if (o.track === r.track && o.start >= end) o.start -= r.dur; }
}
function laneEnd(track) {
  return state.clips.filter(c => c.track === track).reduce((m, c) => Math.max(m, c.start + c.dur), 0);
}
function addAssetAtEnd(a) {
  pushHistory();
  const track = defaultTrack(a.kind);
  const c = addMediaClips(a, track, laneEnd(track));
  state.sel = c.id;
  afterEdit();
}
function newTextClip(text, start, dur) {
  return { id: uid(), track: defaultTrack('text'), start, in: 0, dur, text, size: 56, color: '#ffffff', bg: false, y: 85, opacity: 1 };
}
function addText() {
  pushHistory();
  let start = state.t;
  const tt = defaultTrack('text');
  if (!fits({ id: -1 }, start, 3, tt)) start = laneEnd(tt);
  const c = newTextClip('New text', start, 3);
  state.clips.push(c);
  state.sel = c.id;
  afterEdit();
}
function splitAtPlayhead() {
  const t = state.t;
  let c = selClip();
  if (!c || !(t > c.start + 0.05 && t < c.start + c.dur - 0.05)) {
    c = state.clips.find(o => t > o.start + 0.05 && t < o.start + o.dur - 0.05);
  }
  if (!c) return;
  pushHistory();
  const right = splitClip(c, t);
  if (isMediaClip(c)) splitCaptionsAt(t, new Set([c.id, right.id, ...partners(c).map(p => p.id), ...partners(right).map(p => p.id)]));
  state.sel = right.id;
  afterEdit();
}
function deleteSel() {
  if (state.sel == null) return;
  pushHistory();
  removeClips(multiClips().length ? multiClips() : [selClip()].filter(Boolean));
  state.sel = null;
  state.multi = [];
  afterEdit();
}
function duplicateSel() {
  const c = selClip();
  if (!c) return;
  pushHistory();
  let start = c.start + c.dur;
  while (!fits(c, start, c.dur, c.track)) start = laneEnd(c.track);
  const ps = partners(c), nl = c.link ? uid() : undefined;
  const d = { ...c, id: uid(), start, ...(nl ? { link: nl } : {}) };
  state.clips.push(d, ...ps.map(p => ({ ...p, id: uid(), start, link: nl })));
  state.sel = d.id;
  afterEdit();
}

// ---------- captions (SRT / VTT) ----------
function parseTime(s) {
  const m = s.match(/(?:(\d+):)?(\d+):(\d+)[,.](\d+)/);
  return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4].padEnd(3, '0').slice(0, 3)) / 1000 : NaN;
}
function importCaptions(text) {
  const out = [];
  for (const block of text.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const i = lines.findIndex(l => l.includes('-->'));
    if (i < 0) continue;
    const [a, b] = lines[i].split('-->');
    const start = parseTime(a), end = parseTime(b);
    const body = lines.slice(i + 1).join('\n').replace(/<[^>]+>/g, '');
    if (isNaN(start) || isNaN(end) || end <= start || !body) continue;
    out.push({ start, end, body });
  }
  if (!out.length) { alert('No captions found in that file.'); return; }
  pushHistory();
  for (const o of out) {
    if (!fits({ id: -1 }, o.start, o.end - o.start, 0)) continue;
    const c = newTextClip(o.body, o.start, o.end - o.start);
    c.size = Math.round(H / 20); c.bg = true; c.y = 88;
    state.clips.push(c);
  }
  afterEdit();
}

// ---------- rendering the preview ----------
function setAspect(w, h) {
  W = w; H = h;
  canvas.width = w; canvas.height = h;
  draw();
}

// ---------- colour grading ----------
const COLOR_DEFAULTS = {
  bright: 100, contrast: 100, sat: 100, gray: 0, sepia: 0, hue: 0, blur: 0, invert: 0,
  exposure: 0, highlights: 0, shadows: 0, gamma: 1, temp: 0, tint: 0,
  tone: 0, shadowColor: '#2a5db0', hiColor: '#ffb347', vignette: 0, grain: 0, sharpen: 0,
};
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
// A curve per colour channel (33 points) that combines exposure, temperature, tint, gamma, shadows, highlights and split toning.
function gradeTables(c) {
  const g = k => c[k] ?? COLOR_DEFAULTS[k];
  if (!g('exposure') && !g('highlights') && !g('shadows') && g('gamma') === 1 && !g('temp') && !g('tint') && !g('tone')) return null;
  const tk = g('temp') / 100, ti = g('tint') / 100;
  const gain = [1 + 0.25 * tk + 0.1 * ti, 1 - 0.2 * ti, 1 - 0.25 * tk + 0.1 * ti];
  const tone = [hexRgb(g('shadowColor')), hexRgb(g('hiColor'))];
  const N = 33, cl = v => Math.min(1, Math.max(0, v));
  return [0, 1, 2].map(ch => {
    const out = [];
    for (let i = 0; i < N; i++) {
      let v = cl(i / (N - 1) * 2 ** g('exposure') * gain[ch]);
      v = Math.pow(v, 1 / g('gamma'));
      v += g('shadows') / 100 * 0.35 * 6.75 * v * (1 - v) ** 2 + g('highlights') / 100 * 0.35 * 6.75 * v * v * (1 - v);
      v += g('tone') / 100 * 0.25 * ((tone[0][ch] - 0.5) * (1 - v) ** 2 + (tone[1][ch] - 0.5) * v * v);
      out.push(cl(v).toFixed(4));
    }
    return out.join(' ');
  });
}
const cgKeys = ['exposure', 'highlights', 'shadows', 'gamma', 'temp', 'tint', 'tone', 'shadowColor', 'hiColor', 'sharpen'];
const cgSeen = new Map();
let cgDefs = null;
// An SVG filter for the parts canvas filters cannot do (curves, tint, sharpen). Returns "url(#id)" or ''.
function gradeFilter(c) {
  const sharp = c.sharpen || 0, t = gradeTables(c);
  if (!t && !sharp) return '';
  if (!cgDefs) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    cgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.append(cgDefs);
    document.body.append(svg);
  }
  const key = cgKeys.map(k => c[k] ?? COLOR_DEFAULTS[k]).join('|'), id = `cg-${c.id}`;
  if (cgSeen.get(id) !== key) {
    const kk = sharp / 100 * 0.8;
    const fe = (t ? `<feComponentTransfer><feFuncR type="table" tableValues="${t[0]}"/><feFuncG type="table" tableValues="${t[1]}"/><feFuncB type="table" tableValues="${t[2]}"/></feComponentTransfer>` : '')
      + (sharp ? `<feConvolveMatrix order="3" kernelMatrix="0 ${-kk} 0 ${-kk} ${1 + 4 * kk} ${-kk} 0 ${-kk} 0" preserveAlpha="true" edgeMode="duplicate"/>` : '');
    let el = cgDefs.querySelector('#' + id);
    if (!el) { el = document.createElementNS('http://www.w3.org/2000/svg', 'filter'); el.id = id; el.setAttribute('color-interpolation-filters', 'sRGB'); cgDefs.append(el); }
    el.innerHTML = fe;
    cgSeen.set(id, key);
  }
  return `url(#${id})`;
}
let grainPattern = null;
function getGrain() {
  if (grainPattern) return grainPattern;
  const n = document.createElement('canvas');
  n.width = n.height = 256;
  const g = n.getContext('2d'), im = g.createImageData(256, 256);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  return (grainPattern = ctx.createPattern(n, 'repeat'));
}

// ---------- LUT and green screen: one small WebGL pass over the picture before it is drawn ----------
const lutReg = new Map();   // id -> {name, n, rgba: Uint8Array(n*n * n * 4)}  (cube laid out as n slices of n x n, side by side)
function parseCube(text) {
  let n = 0, title = '';
  const vals = [];
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l[0] === '#') continue;
    if (/^TITLE/i.test(l)) { title = l.replace(/^TITLE\s*/i, '').replace(/"/g, '').trim(); continue; }
    if (/^LUT_1D_SIZE/i.test(l)) throw new Error('This is a 1D LUT. Use a 3D .cube LUT (LUT_3D_SIZE).');
    if (/^LUT_3D_SIZE/i.test(l)) { n = parseInt(l.split(/\s+/)[1], 10); continue; }
    if (/^DOMAIN_M/i.test(l)) { const v = l.split(/\s+/).slice(1).map(Number); if (/MIN/i.test(l) ? v.some(x => x !== 0) : v.some(x => x !== 1)) throw new Error('LUTs with a value range other than 0 to 1 are not supported.'); continue; }
    if (/^[A-Za-z]/.test(l)) continue;
    const q = l.split(/\s+/).map(Number);
    if (q.length >= 3 && q.every(x => !isNaN(x))) vals.push(q[0], q[1], q[2]);
  }
  if (!n || n < 2 || n > 129) throw new Error('This file has no valid LUT_3D_SIZE.');
  if (vals.length !== n * n * n * 3) throw new Error(`The LUT should have ${n * n * n} colour lines but has ${vals.length / 3}.`);
  const rgb = new Uint8Array(n * n * n * 3), rgba = new Uint8Array(n * n * n * 4);
  for (let i = 0; i < vals.length; i++) rgb[i] = Math.max(0, Math.min(255, Math.round(vals[i] * 255)));
  lutPlace(n, rgb, rgba);
  return { title, n, rgb, rgba };
}
function lutPlace(n, rgb, rgba) {   // .cube order is red fastest, then green, then blue; the texture has blue slices side by side
  for (let b = 0; b < n; b++) for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) {
    const s = (r + n * (g + n * b)) * 3, d = (g * n * n + b * n + r) * 4;
    rgba[d] = rgb[s]; rgba[d + 1] = rgb[s + 1]; rgba[d + 2] = rgb[s + 2]; rgba[d + 3] = 255;
  }
}
const u8ToB64 = u => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
const b64ToU8 = b => Uint8Array.from(atob(b), ch => ch.charCodeAt(0));
function lutSave() {
  const o = {};
  for (const [id, l] of lutReg) o[id] = { name: l.name, n: l.n, b64: u8ToB64(l.rgb) };
  return idb('kv', 'readwrite', st => st.put(o, 'luts')).catch(() => {});
}
function lutLoad() {
  return idb('kv', 'readonly', st => st.get('luts')).then(o => {
    for (const [id, l] of Object.entries(o || {})) { const rgb = b64ToU8(l.b64), rgba = new Uint8Array(l.n ** 3 * 4); lutPlace(l.n, rgb, rgba); lutReg.set(id, { name: l.name, n: l.n, rgb, rgba }); }
    if (selClip()) renderInspector();
  }).catch(() => {});
}
let fxState = null;
function fxInit() {
  const cv = document.createElement('canvas');
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, alpha: true });
  if (!gl) return (fxState = { fail: true });
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  try {
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 v; uniform sampler2D uTex, uLut; uniform float uN, uLutAmt, uKeyOn, uSim, uSmooth, uSpill; uniform vec3 uKey;
      vec3 lut(vec3 c) { float n = uN; c = clamp(c, 0.0, 1.0) * (n - 1.0); float b0 = floor(c.b), b1 = min(b0 + 1.0, n - 1.0), fb = c.b - b0;
        vec2 u0 = vec2((b0 * n + c.r + 0.5) / (n * n), (c.g + 0.5) / n), u1 = vec2((b1 * n + c.r + 0.5) / (n * n), (c.g + 0.5) / n);
        return mix(texture2D(uLut, u0).rgb, texture2D(uLut, u1).rgb, fb); }
      vec2 cbcr(vec3 c) { return vec2(-0.169 * c.r - 0.331 * c.g + 0.5 * c.b, 0.5 * c.r - 0.419 * c.g - 0.081 * c.b); }
      void main() { vec4 s = texture2D(uTex, v); vec3 c = s.rgb; float a = 1.0;
        if (uKeyOn > 0.5) { float d = distance(cbcr(c), cbcr(uKey)); a = smoothstep(uSim, uSim + uSmooth, d);
          float near = 1.0 - smoothstep(uSim, uSim + uSmooth + 0.2, d); c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), uSpill * near); }
        if (uLutAmt > 0.0) c = mix(c, lut(c), uLutAmt);
        float al = a * s.a; gl_FragColor = vec4(c * al, al); }`));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const mkTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
    const u = n => gl.getUniformLocation(pr, n);
    fxState = { cv, gl, tex: mkTex(), lutTex: mkTex(), lutId: null, u: { tex: u('uTex'), lut: u('uLut'), n: u('uN'), amt: u('uLutAmt'), keyOn: u('uKeyOn'), sim: u('uSim'), smooth: u('uSmooth'), spill: u('uSpill'), key: u('uKey') } };
  } catch (e) { console.warn('effects shader failed', e); fxState = { fail: true }; }
  return fxState;
}
const keyRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0x00ff00; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
function fxProcess(c, src, sw, sh) {   // returns a canvas with the LUT / green screen applied, or null when it cannot
  if (!fxState) fxInit();
  if (fxState.fail || !sw || !sh) return null;
  const { gl, cv, u } = fxState, k = Math.min(1, 1920 / Math.max(sw, sh)), w = Math.max(2, Math.round(sw * k)), h = Math.max(2, Math.round(sh * k));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  gl.viewport(0, 0, w, h);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fxState.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } catch { return null; }
  gl.uniform1i(u.tex, 0);
  const L = c.lut && lutReg.get(c.lut);
  if (L) {
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fxState.lutTex);
    if (fxState.lutId !== c.lut) { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, L.n * L.n, L.n, 0, gl.RGBA, gl.UNSIGNED_BYTE, L.rgba); fxState.lutId = c.lut; }
    gl.uniform1i(u.lut, 1); gl.uniform1f(u.n, L.n);
  }
  gl.uniform1f(u.amt, L ? (c.lutAmt ?? 100) / 100 : 0);
  gl.uniform1f(u.keyOn, c.keyOn ? 1 : 0);
  gl.uniform1f(u.sim, c.keySim ?? 0.12); gl.uniform1f(u.smooth, c.keySmooth ?? 0.1); gl.uniform1f(u.spill, c.keySpill ?? 0.5);
  gl.uniform3fv(u.key, keyRgb(c.keyColor));
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return cv;
}
function detectKeyColor(c) {   // the colour along the edges of the picture (a green screen fills the edges)
  const a = assetOf(c), el = a && a.el;
  if (!el) return null;
  const sw = a.kind === 'video' ? el.videoWidth : el.naturalWidth, sh = a.kind === 'video' ? el.videoHeight : el.naturalHeight;
  if (!sw || !sh) return null;
  const t = document.createElement('canvas'); t.width = 48; t.height = 27;
  const g = t.getContext('2d', { willReadFrequently: true }); g.drawImage(el, 0, 0, 48, 27);
  const d = g.getImageData(0, 0, 48, 27).data;
  let r = 0, gr = 0, b = 0, n = 0;
  for (let y = 0; y < 27; y++) for (let x = 0; x < 48; x++) if (x < 3 || y < 3 || x >= 45 || y >= 24) { const i = (y * 48 + x) * 4; r += d[i]; gr += d[i + 1]; b += d[i + 2]; n++; }
  return '#' + [r, gr, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('');
}

// ---------- stabilization: measure the shake frame by frame, smooth the path, and move each frame back ----------
// The result is stored as two keyframe tracks (stabx, staby: fraction of the picture) on the clip, so split, trim and paste keep it.
const STAB_W = 160, STAB_H = 90;
function stabGray(g, v) {
  g.drawImage(v, 0, 0, STAB_W, STAB_H);
  const d = g.getImageData(0, 0, STAB_W, STAB_H).data, a = new Float32Array(STAB_W * STAB_H);
  for (let i = 0; i < a.length; i++) a[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  const o = new Float32Array(a.length);   // light blur: less noise, smoother SAD surface
  for (let y = 1; y < STAB_H - 1; y++) for (let x = 1; x < STAB_W - 1; x++) { const i = y * STAB_W + x; o[i] = (a[i] * 4 + a[i - 1] + a[i + 1] + a[i - STAB_W] + a[i + STAB_W]) / 8; }
  return o;
}
function stabShift(a, b) {   // how far the picture content moved from frame a to frame b, in pixels of the small grid
  const R = 7, mx = 14, my = 10, sad = [];
  let best = Infinity, bx = 0, by = 0;
  for (let dy = -R; dy <= R; dy++) { sad[dy + R] = []; for (let dx = -R; dx <= R; dx++) {
    let sum = 0;
    for (let y = my; y < STAB_H - my; y += 2) { const ra = y * STAB_W, rb = (y + dy) * STAB_W + dx; for (let x = mx; x < STAB_W - mx; x += 2) sum += Math.abs(a[ra + x] - b[rb + x]); }
    sad[dy + R][dx + R] = sum;
    if (sum < best) { best = sum; bx = dx; by = dy; }
  } }
  const sub = (m, c, p) => { const den = m - 2 * c + p; return den > 1e-6 ? Math.max(-0.5, Math.min(0.5, (m - p) / (2 * den))) : 0; };
  let fx = 0, fy = 0;
  if (bx > -R && bx < R) fx = sub(sad[by + R][bx - 1 + R], best, sad[by + R][bx + 1 + R]);
  if (by > -R && by < R) fy = sub(sad[by - 1 + R][bx + R], best, sad[by + 1 + R][bx + R]);
  return [bx + fx, by + fy];   // b(x+dx) matches a(x): the content moved by +d
}
const seekTo = (v, t) => new Promise(res => { const to = setTimeout(res, 4000); v.onseeked = () => { clearTimeout(to); res(); }; v.currentTime = t; });
async function stabilizeClip(c, win, onProgress) {
  const a = assetOf(c);
  if (!a || a.kind !== 'video') throw new Error('Stabilization works on video clips.');
  const v = document.createElement('video');
  v.muted = true; v.preload = 'auto'; v.src = a.url;
  await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('Could not open the video.')); });
  const g = Object.assign(document.createElement('canvas'), { width: STAB_W, height: STAB_H }).getContext('2d', { willReadFrequently: true });
  const step = 0.1, n = Math.max(2, Math.floor(c.dur / step) + 1), ts = [], P = [[0, 0]];
  let prev = null;
  for (let i = 0; i < n; i++) {
    const tl = Math.min(i * step, c.dur);
    ts.push(tl);
    await seekTo(v, Math.max(0, Math.min(srcTime(c, c.start + tl), (v.duration || 1e9) - 0.05)));
    const cur = stabGray(g, v);
    if (prev) { const [dx, dy] = stabShift(prev, cur), q = P[i - 1]; P[i] = [q[0] + dx, q[1] + dy]; }
    prev = cur;
    if (i % 5 === 0) { onProgress && onProgress(i / n); await new Promise(r => setTimeout(r, 0)); }
  }
  v.removeAttribute('src'); v.load();
  const w = Math.max(1, Math.round(win / step / 2)), S = P.map((_, i) => {   // moving average = the smooth camera path
    let sx = 0, sy = 0, k = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(n - 1, i + w); j++) { sx += P[j][0]; sy += P[j][1]; k++; }
    return [sx / k, sy / k];
  });
  const cx = [], cy = [];
  let mxf = 0;
  for (let i = 0; i < n; i++) {
    const fx = (S[i][0] - P[i][0]) / STAB_W, fy = (S[i][1] - P[i][1]) / STAB_H;
    cx.push({ t: ts[i], v: +fx.toFixed(5) }); cy.push({ t: ts[i], v: +fy.toFixed(5) });
    mxf = Math.max(mxf, Math.abs(fx), Math.abs(fy));
  }
  return { cx, cy, zoom: Math.min(1.4, Math.max(1.04, +(1 + 2.2 * mxf + 0.02).toFixed(2))), shake: Math.max(...P.map((q, i) => Math.hypot(q[0] - S[i][0], q[1] - S[i][1]))) / STAB_W };
}
function stabSection(c) {
  const has = !!(c.kf && c.kf.stabx);
  return `<h3>Stabilization (steady shaky video)</h3>`
    + (has ? `<label><input type="checkbox" data-f="stabOn" ${c.stabOn ? 'checked' : ''}> Stabilize this clip</label><label>Zoom to hide the edges</label><input type="range" min="1" max="1.4" step="0.01" data-f="stabZoom" value="${c.stabZoom ?? 1.1}">` : '')
    + `<label>Strength</label><select id="stab-win"><option value="0.5">Light (keeps small camera moves)</option><option value="1" selected>Normal</option><option value="2.5">Strong (tripod-like)</option></select>`
    + `<div class="row" style="justify-content:flex-start"><button type="button" id="stab-run">${has ? 'Analyze again' : 'Analyze and stabilize'}</button>${has ? '<button type="button" id="stab-rm">Remove stabilization</button>' : ''}</div><p class="muted" id="stab-status"></p>`;
}

function fxSection(c, kind) {
  const num = (f, label, min, max, step, d) => `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" data-f="${f}" value="${c[f] ?? d}">`;
  const luts = [...lutReg].map(([id, l]) => `<option value="${id}" ${c.lut === id ? 'selected' : ''}>${l.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')} (${l.n}³)</option>`).join('');
  return `<h3>LUT (color look file)</h3><select data-f="lut"><option value="">No LUT</option>${luts}</select>`
    + `<div class="row" style="justify-content:flex-start"><button type="button" id="lut-import">Import LUT (.cube)…</button></div>` + (c.lut ? num('lutAmt', 'LUT strength (%)', 0, 100, 1, 100) : '')
    + `<h3>Green screen (chroma key)</h3><label><input type="checkbox" data-f="keyOn" ${c.keyOn ? 'checked' : ''}> Remove the background color</label>`
    + `<label>Color to remove</label><input type="color" data-f="keyColor" value="${c.keyColor || '#00ff00'}">`
    + `<div class="row" style="justify-content:flex-start"><button type="button" id="key-detect">Detect color from the picture edges</button></div>`
    + num('keySim', 'Amount removed (similarity)', 0.02, 0.5, 0.01, 0.12) + num('keySmooth', 'Edge softness', 0, 0.3, 0.01, 0.1) + num('keySpill', 'Remove color spill on the subject', 0, 1, 0.05, 0.5)
    + `<p class="muted">Put the clip on a higher layer than the background you want to show through.</p>`
    + (kind === 'video' ? stabSection(c) : '');
}

function drawMedia(c, src, sw, sh) {
  c = withKf(c, state.t);
  if (c.keyOn || c.lut) { const o = fxProcess(c, src, sw, sh); if (o) { src = o; sw = o.width; sh = o.height; } }
  const cl = (c.cropL || 0) / 100, cr = (c.cropR || 0) / 100, ct = (c.cropT || 0) / 100, cb = (c.cropB || 0) / 100;
  const cw = sw * (1 - cl - cr), ch = sh * (1 - ct - cb);
  if (!sw || !sh || cw <= 0 || ch <= 0) return;
  const k = Math.min(W / cw, H / ch) * (c.scale ?? 1);
  boxes.set(c.id, { cx: W / 2 + (c.px || 0) * W / 100, cy: H / 2 + (c.py || 0) * H / 100, w: cw * k, h: ch * k, rot: c.rot || 0 });
  ctx.save();
  const fx = transFx(c, state.t), a1 = fx ? Math.min(1, fx.a) : 1, e = a1 * a1 * (3 - 2 * a1);
  let ox = 0, oy = 0, sc = 1, tAlpha = 1, tBlur = 0, tRot = 0, tRotY = 0;
  if (c.stabOn && c.stabx !== undefined) { ox += c.stabx * cw * k; oy += (c.staby || 0) * ch * k; sc *= c.stabZoom ?? 1.1; }
  if (fx) {
    const ty = fx.type, d = fx.dir;
    if (ty === 'wipe') { ctx.beginPath(); if (d > 0) ctx.rect(0, 0, W * e, H); else ctx.rect(W * (1 - e), 0, W * e, H); ctx.clip(); }
    else if (ty === 'slideleft') ox = d * (1 - e) * W;
    else if (ty === 'slideright') ox = -d * (1 - e) * W;
    else if (ty === 'slideup') oy = d * (1 - e) * H;
    else if (ty === 'slidedown') oy = -d * (1 - e) * H;
    else if (ty === 'zoom') { sc = 1 + (1 - e) * 0.5; tAlpha = e; }
    else if (ty === 'blur') { tBlur = (1 - e) * 24; tAlpha = e; }
    else if (ty === 'circle') { ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.hypot(W, H) / 2 * e + 0.1, 0, 7); ctx.clip(); }
    else if (ty === 'spin') { tRot = (1 - e) * -180 * d; sc = e; tAlpha = Math.min(1, e * 1.5); }
    else if (ty === 'flip') { tRotY = (1 - e) * 90 * d; tAlpha = e > 0.02 ? 1 : 0; }
    else if (ty === 'whip') { ox = d * (1 - e) * W * 0.6; tBlur = (1 - e) * 30; tAlpha = e; }
    else if (ty === 'dipwhite') { ctx.globalAlpha = 1 - e; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); tAlpha = e; }
    else tAlpha = e;   // fade
  }
  ctx.globalAlpha = (c.opacity ?? 1) * fadeFactor(c, state.t) * tAlpha;
  const f = [];
  if (tBlur > 0.1) f.push(`blur(${tBlur.toFixed(1)}px)`);
  if ((c.bright ?? 100) !== 100) f.push(`brightness(${c.bright}%)`);
  if ((c.contrast ?? 100) !== 100) f.push(`contrast(${c.contrast}%)`);
  if ((c.sat ?? 100) !== 100) f.push(`saturate(${c.sat}%)`);
  if (c.gray) f.push(`grayscale(${c.gray}%)`);
  if (c.sepia) f.push(`sepia(${c.sepia}%)`);
  if (c.hue) f.push(`hue-rotate(${c.hue}deg)`);
  if (c.blur) f.push(`blur(${c.blur}px)`);
  if (c.invert) f.push(`invert(${c.invert}%)`);
  const svgF = gradeFilter(c);
  if (svgF) f.push(svgF);
  if (f.length) ctx.filter = f.join(' ');
  ctx.translate(W / 2 + (c.px || 0) * W / 100 + ox, H / 2 + (c.py || 0) * H / 100 + oy);
  ctx.rotate(((c.rot || 0) + tRot) * Math.PI / 180);
  if (sc !== 1) ctx.scale(sc, sc);
  if (window.drawMediaFx && (c.mask || c.round || c.border || c.shadow || c.rotY || c.rotX || tRotY)) drawMediaFx(c, src, sw * cl, sh * ct, cw, ch, cw * k, ch * k, tRotY);   // effects.js: masks, rounded corners, border, shadow, 3D flip
  else ctx.drawImage(src, sw * cl, sh * ct, cw, ch, -cw * k / 2, -ch * k / 2, cw * k, ch * k);
  ctx.filter = 'none';
  const base = ctx.globalAlpha, rw = cw * k, rh = ch * k;
  if (c.vignette) {
    const gr = ctx.createRadialGradient(0, 0, Math.min(rw, rh) * 0.25, 0, 0, Math.hypot(rw, rh) / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, `rgba(0,0,0,${c.vignette / 100 * 0.9})`);
    ctx.fillStyle = gr;
    ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
  }
  if (c.grain) {
    ctx.save();
    ctx.beginPath(); ctx.rect(-rw / 2, -rh / 2, rw, rh); ctx.clip();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = base * c.grain / 100 * 0.6;
    ctx.translate(Math.random() * 256, Math.random() * 256);
    ctx.fillStyle = getGrain();
    ctx.fillRect(-rw / 2 - 256, -rh / 2 - 256, rw + 512, rh + 512);
    ctx.restore();
  }
  ctx.restore();
}

function wrapLines(text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
    }
    out.push(line);
  }
  return out;
}

const boxes = new Map();   // clip id -> {cx,cy,w,h,rot}: where each visible text/picture clip is on the canvas, for dragging
let exporting = false;

// Liquid Glass panel behind a text clip: blurred copy of what is already drawn below, tint, specular highlight, glowing edge, soft shadow.
let glassSnap = null;
function drawGlass(c, b) {
  const dark = c.glassTheme === 'dark', k = H / 720;
  const r = Math.min(b.w, b.h) / 2 * (c.glassRadius ?? 45) / 100;
  const blur = (c.glassBlur ?? 14) * k;
  const path = () => { ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); };
  const m = ctx.getTransform();
  if (!glassSnap) glassSnap = document.createElement('canvas');
  if (glassSnap.width !== canvas.width || glassSnap.height !== canvas.height) { glassSnap.width = canvas.width; glassSnap.height = canvas.height; }
  const sg = glassSnap.getContext('2d');
  sg.globalAlpha = 1; sg.clearRect(0, 0, glassSnap.width, glassSnap.height); sg.drawImage(canvas, 0, 0);
  // depth: soft drop shadow (the frosted layer below covers its inside)
  ctx.save();
  ctx.shadowColor = dark ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.32)';
  ctx.shadowBlur = b.h * 0.45; ctx.shadowOffsetY = b.h * 0.14;
  ctx.fillStyle = '#000'; path(); ctx.fill();
  ctx.restore();
  // frosted backdrop: blurred, slightly magnified (refraction) and saturated
  ctx.save();
  path(); ctx.clip();
  const cp = m.transformPoint(new DOMPoint(b.x + b.w / 2, b.y + b.h / 2));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = `blur(${blur.toFixed(1)}px) saturate(1.5) brightness(${dark ? 0.8 : 1.12})`;
  const mag = 1.04;
  ctx.translate(cp.x, cp.y); ctx.scale(mag, mag); ctx.translate(-cp.x, -cp.y);
  ctx.drawImage(glassSnap, 0, 0);
  ctx.restore();
  // tint, top-lit gradient and a diagonal specular streak
  ctx.save();
  path(); ctx.clip();
  ctx.fillStyle = dark ? 'rgba(18,20,28,.38)' : 'rgba(255,255,255,.2)';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  let g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
  g.addColorStop(0, dark ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.5)');
  g.addColorStop(0.45, 'rgba(255,255,255,.04)');
  g.addColorStop(1, dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.16)');
  ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
  g = ctx.createLinearGradient(b.x, b.y, b.x + b.w * 0.5, b.y + b.h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.18, dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.3)'); g.addColorStop(0.32, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.restore();
  // glowing rim: bright at the top-left, faint at the bottom-right, plus an inner highlight line
  ctx.save();
  const lw = Math.max(1.5, b.h / 40);
  g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.5, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,.6)');
  ctx.shadowColor = 'rgba(255,255,255,.55)'; ctx.shadowBlur = lw * 5;
  ctx.strokeStyle = g; ctx.lineWidth = lw; path(); ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.roundRect(b.x + lw * 1.5, b.y + lw * 1.5, b.w - lw * 3, b.h - lw * 3, Math.max(0, r - lw * 1.5));
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = lw * 0.7; ctx.stroke();
  ctx.restore();
}

function drawText(c) {
  c = withKf(c, state.t);
  if (c.fxType && window.drawFxClip) return drawFxClip(c);   // effects.js: particles, flare, cinematic effects, graphics
  if (c.lt && window.drawLowerThird) return drawLowerThird(c);
  if (c.ts && window.drawStyledTitle) return drawStyledTitle(c);   // titles.js: minimal kinetic title styles
  const fx = window.textFx ? textFx(c, state.t) : null;   // titles.js: text animation in/out
  ctx.font = `${c.bold === false ? '' : 'bold '}${c.size}px ${c.font || TEXT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapLines(c.text, W * 0.9);
  const lh = c.size * 1.25;
  const top = H * c.y / 100 - (lines.length * lh) / 2;
  const X = W * (c.x ?? 50) / 100;
  ctx.globalAlpha = (c.opacity ?? 1) * fadeFactor(c, state.t) * (fx ? fx.a : 1);
  const gp = c.glass ? c.size * 0.35 : 0;   // extra padding inside the glass panel
  const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + c.size * 0.8 + gp * 2;
  const box = { x: X - bw / 2, y: top - c.size * 0.2 - gp * 0.6, w: bw, h: lines.length * lh + c.size * 0.4 + gp * 1.2 };
  const cy = box.y + box.h / 2;
  boxes.set(c.id, { cx: X, cy, w: box.w, h: box.h, rot: c.rot || 0 });
  ctx.save();
  if (c.rot) { ctx.translate(X, cy); ctx.rotate(c.rot * Math.PI / 180); ctx.translate(-X, -cy); }
  if (fx) textFxApply(fx, X, cy, box);
  if (c.glass) drawGlass(c, box);
  else if (c.bg) {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  ctx.fillStyle = c.color;
  ctx.lineWidth = Math.max(2, c.size / 12);
  ctx.strokeStyle = 'rgba(0,0,0,.8)';
  const vis = fx && fx.chars < 1 ? textFxLines(lines, fx) : null;
  lines.forEach((l, i) => {
    const y = top + lh * (i + 0.5);
    if (vis) {   // typewriter / word by word: draw the visible part, left-aligned inside the full line so nothing jumps
      const x0 = X - ctx.measureText(l).width / 2;
      ctx.textAlign = 'left';
      if (!c.bg && !c.glass) ctx.strokeText(vis[i], x0, y);
      ctx.fillText(vis[i], x0, y);
      ctx.textAlign = 'center';
      return;
    }
    if (!c.bg && !c.glass) ctx.strokeText(l, X, y);
    ctx.fillText(l, X, y);
  });
  ctx.restore();
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  boxes.clear();
  for (const ti of drawOrder()) {
    for (const c of state.clips) {
      if (c.track !== ti || trackState[ti].hidden || !active(c, state.t)) continue;
      if (c.text != null) { drawText(c); continue; }
      if (c.audioOnly) continue;
      const a = assetOf(c);
      if (a.kind === 'video' && a.el.readyState >= 2) drawMedia(c, a.el, a.el.videoWidth, a.el.videoHeight);
      else if (a.kind === 'image') drawMedia(c, a.el, a.el.naturalWidth, a.el.naturalHeight);
    }
  }
  drawTextHandles();
  kfSync();
  drawWcBadge();
  drawHist();
}

let histT = 0;
function drawHist() {
  const hc = document.querySelector('#hist');
  if (!hc || state.playing && performance.now() - histT < 200 || performance.now() - histT < 60) return;
  histT = performance.now();
  const tmp = drawHist.tmp || (drawHist.tmp = document.createElement('canvas'));
  tmp.width = 160; tmp.height = 90;
  const tg = tmp.getContext('2d', { willReadFrequently: true });
  tg.drawImage(canvas, 0, 0, 160, 90);
  const px = tg.getImageData(0, 0, 160, 90).data, bins = [new Uint32Array(64), new Uint32Array(64), new Uint32Array(64)];
  for (let i = 0; i < px.length; i += 4) { bins[0][px[i] >> 2]++; bins[1][px[i + 1] >> 2]++; bins[2][px[i + 2] >> 2]++; }
  const g = hc.getContext('2d'), w = hc.width, h = hc.height, mx = Math.max(...bins.flatMap(b => [...b])) || 1;
  g.fillStyle = '#0b0b0d'; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'lighter';
  ['#ff3b3b', '#3bff6a', '#3b7bff'].forEach((col, ch) => {
    g.fillStyle = col; g.globalAlpha = 0.7;
    for (let i = 0; i < 64; i++) { const bh = Math.sqrt(bins[ch][i] / mx) * h; g.fillRect(i * w / 64, h - bh, w / 64, bh); }
  });
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- caption length: re-flow sentences into shorter or longer captions ----------
// Which clips: the selected group, or else every text clip on the selected / active text layer.
function reflowTargets() {
  const g = multiClips().filter(c => c.text != null);
  if (g.length) return { clips: g, label: `the ${g.length} selected clips` };
  const c = selClip();
  const track = c && c.text != null ? c.track : defaultTrack('text');
  return { clips: state.clips.filter(o => o.text != null && o.track === track), label: `all clips on "${TRACKS[track].name}"` };
}
// Plan the new captions. Neighbouring captions (gap under 0.6 s) are joined into one stream of words,
// then cut into pieces of about maxWords words; the time is shared out in proportion to the words.
// Auto mode: look at the canvas shape and pick the font size and how many lines a caption may use,
// then fill each caption with as many words as really fit (measured with the actual font).
function autoSpec() {
  const r = W / H;
  const shape = r >= 1.5 ? 'wide (16:9)' : r <= 0.75 ? 'tall (9:16)' : 'square (1:1)';
  return { shape, lines: r <= 0.75 ? 3 : 2, size: Math.round(Math.min(W, H) / 18) };
}
function reflowPlan(clips, maxWords, auto = false) {
  const spec = auto ? autoSpec() : null;
  const sorted = clips.slice().sort((a, b) => a.start - b.start);
  const chains = [];
  for (const c of sorted) {
    const last = chains[chains.length - 1];
    const prev = last && last[last.length - 1];
    if (prev && prev.track === c.track && c.start - (prev.start + prev.dur) < 0.6) last.push(c); else chains.push([c]);
  }
  const out = [];
  for (const ch of chains) {
    const words = ch.flatMap(c => c.text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean));
    if (!words.length) { out.push(...ch.map(c => ({ ...c }))); continue; }
    const t0 = ch[0].start, span = ch[ch.length - 1].start + ch[ch.length - 1].dur - t0;
    const pieces = [];
    if (auto) ctx.font = `${ch[0].bold === false ? '' : 'bold '}${spec.size}px ${ch[0].font || TEXT_FONT}`;
    for (let i = 0; i < words.length;) {
      let j = Math.min(words.length, i + maxWords);
      if (auto) {
        j = i + 1;
        while (j < words.length && j - i < 30 && wrapLines(words.slice(i, j + 1).join(' '), W * 0.9 - spec.size * 0.8).length <= spec.lines) j++;
        maxWords = Math.max(2, j - i);
      }
      if (j < words.length) {   // prefer to stop after the end of a sentence if one falls in the second half of the piece
        for (let k = j; k > i + Math.ceil(maxWords / 2); k--) if (/[.?!…]$/.test(words[k - 1])) { j = k; break; }
      }
      pieces.push(words.slice(i, j).join(' '));
      i = j;
    }
    let done = 0;
    for (const t of pieces) {
      const n = t.split(' ').length;
      const a = t0 + span * done / words.length, b = t0 + span * (done + n) / words.length;
      out.push({ ...ch[0], id: uid(), start: a, dur: Math.max(0.1, b - a), text: t, ...(auto ? { size: spec.size } : {}) });
      done += n;
    }
  }
  return out;
}
function updateCl() {
  const { clips, label } = reflowTargets();
  const n = +$('#cl-words').value, auto = $('#cl-auto').checked;
  $('#cl-words').disabled = auto;
  for (const b of document.querySelectorAll('#cl-dialog [data-w]')) b.disabled = auto;
  const sp = autoSpec();
  $('#cl-val').textContent = auto ? 'automatic' : `${n} word${n === 1 ? '' : 's'}`;
  $('#cl-auto-info').textContent = auto ? `Screen is ${W}x${H}, ${sp.shape}: up to ${sp.lines} lines per caption, font ${sp.size}px.` : '';
  $('#cl-info').textContent = clips.length ? `Applies to ${label}: ${clips.length} captions would become ${reflowPlan(clips, n, auto).length}.` : 'No text clips to change.';
}
$('#btn-cl').onclick = () => { updateCl(); $('#cl-dialog').showModal(); };
$('#cl-words').oninput = updateCl;
$('#cl-auto').onchange = updateCl;
for (const b of document.querySelectorAll('#cl-dialog [data-w]')) b.onclick = () => { $('#cl-words').value = b.dataset.w; updateCl(); };
$('#cl-close').onclick = () => $('#cl-dialog').close();
$('#cl-apply').onclick = () => {
  const { clips } = reflowTargets();
  if (!clips.length) return;
  pushHistory();
  const plan = reflowPlan(clips, +$('#cl-words').value, $('#cl-auto').checked);
  const gone = new Set(clips.map(c => c.id));
  state.clips = state.clips.filter(c => !gone.has(c.id)).concat(plan);
  state.multi = plan.map(c => c.id);
  state.sel = plan.length ? plan[0].id : null;
  afterEdit();
  updateCl();
};

// ---------- word count for a time range, optionally shown on the preview ----------
const wc = { on: false, from: '0', to: '' };
function parseT(v, dflt) {
  v = String(v).trim();
  if (!v) return dflt;
  const p = v.split(':').map(Number);
  if (p.some(isNaN)) return dflt;
  return p.reduce((a, n) => a * 60 + n, 0);
}
function wcStats() {
  const from = Math.max(0, parseT(wc.from, 0)), to = Math.max(from, parseT(wc.to, totalDur()));
  const cs = state.clips.filter(c => c.text != null && c.start >= from - 1e-6 && c.start < to);   // text clips that start inside the range
  const words = cs.reduce((n, c) => n + wordCount(c.text), 0);
  const mins = (to - from) / 60;
  return { from, to, clips: cs.length, words, wpm: mins > 0 ? Math.round(words / mins) : 0 };
}
function wcLine(st) { return `Words ${fmt(st.from).slice(0, 5)}-${fmt(st.to).slice(0, 5)}: ${st.words} (${st.wpm} wpm)`; }
function drawWcBadge() {
  if (!wc.on || exporting) return;
  const t = wcLine(wcStats()), f = Math.round(H / 32);
  ctx.save();
  ctx.font = `bold ${f}px -apple-system, sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(t).width + f, h = f * 1.8;
  ctx.fillStyle = 'rgba(0,0,0,.65)';
  ctx.fillRect(f / 2, f / 2, w, h);
  ctx.fillStyle = '#7fd1ff';
  ctx.fillText(t, f, f / 2 + h / 2);
  ctx.restore();
}
function updateWc() {
  const st = wcStats();
  $('#wc-result').textContent = `${st.words} words in ${st.clips} text clip${st.clips === 1 ? '' : 's'} · ${st.wpm} words per minute (${fmt(st.from)} to ${fmt(st.to)})`;
  draw();
}
$('#btn-wc').onclick = () => { $('#wc-to').placeholder = fmt(totalDur()); updateWc(); $('#wc-dialog').showModal(); };
$('#wc-close').onclick = () => $('#wc-dialog').close();
$('#wc-from').oninput = e => { wc.from = e.target.value; updateWc(); };
$('#wc-to').oninput = e => { wc.to = e.target.value; updateWc(); };
$('#wc-show').onchange = e => { wc.on = e.target.checked; draw(); };
$('#wc-here').onclick = () => { $('#wc-from').value = wc.from = String(+state.t.toFixed(2)); updateWc(); };

// ---------- drag on the canvas: move text/pictures, corner handle = size, top handle = rotate ----------
const HANDLE = 9;   // handle half-size in canvas pixels at on-screen scale
const handleSize = () => HANDLE * W / canvas.getBoundingClientRect().width;
const rad = d => d * Math.PI / 180;

function drawTextHandles() {
  const c = selClip();
  const b = c && c.track != null && !exporting && boxes.get(c.id);
  if (!b) return;
  const k = handleSize();
  ctx.save();
  ctx.translate(b.cx, b.cy);
  ctx.rotate(rad(b.rot));
  ctx.strokeStyle = '#19d3c5';
  ctx.fillStyle = '#19d3c5';
  ctx.lineWidth = k / 4;
  ctx.setLineDash([k, k / 2]);
  ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
  ctx.setLineDash([]);
  ctx.fillRect(b.w / 2 - k, b.h / 2 - k, k * 2, k * 2);                 // size handle
  ctx.beginPath(); ctx.moveTo(0, -b.h / 2); ctx.lineTo(0, -b.h / 2 - 3 * k); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -b.h / 2 - 3 * k, k, 0, 7); ctx.fill();   // rotate handle
  ctx.restore();
}

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
// pointer position in the clip's own (unrotated) frame, origin at its centre
function toLocal(p, b) {
  const dx = p.x - b.cx, dy = p.y - b.cy, r = rad(b.rot), cs = Math.cos(r), sn = Math.sin(r);
  return { x: dx * cs + dy * sn, y: -dx * sn + dy * cs };
}
function canvasHit(p) {
  const sel = selClip(), sb = sel && boxes.get(sel.id);
  if (sb) {
    const l = toLocal(p, sb), k = handleSize() * 1.6;
    if (Math.hypot(l.x - sb.w / 2, l.y - sb.h / 2) <= k) return { c: sel, mode: 'resize' };
    if (Math.hypot(l.x, l.y + sb.h / 2 + 3 * handleSize()) <= k) return { c: sel, mode: 'rotate' };
  }
  const order = drawOrder();   // bottom to top
  const hits = state.clips.filter(o => boxes.has(o.id) && (l => Math.abs(l.x) <= boxes.get(o.id).w / 2 && Math.abs(l.y) <= boxes.get(o.id).h / 2)(toLocal(p, boxes.get(o.id))));
  hits.sort((a, b2) => order.indexOf(b2.track) - order.indexOf(a.track));
  return hits.length ? { c: hits[0], mode: 'move' } : null;
}

canvas.style.touchAction = 'none';
canvas.addEventListener('pointermove', e => {
  if (e.buttons) return;
  const h = canvasHit(canvasPoint(e));
  canvas.style.cursor = !h ? '' : h.mode === 'resize' ? 'nwse-resize' : h.mode === 'rotate' ? 'grab' : 'move';
});
canvas.addEventListener('pointerdown', e => {
  const p = canvasPoint(e);
  const h = canvasHit(p);
  if (!h) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const { c, mode } = h;
  if (state.sel !== c.id) { state.sel = c.id; renderTimeline(); renderInspector(); draw(); }
  const b = boxes.get(c.id), isText = c.text != null;
  const kx = isText ? 'x' : 'px', ky = isText ? 'y' : 'py', mid = isText ? 50 : 0;
  const group = isText ? multiClips().map(o => ({ o, x: o.x ?? 50, y: o.y })) : [];
  const start = { x: propNow(c, kx), y: propNow(c, ky), size: isText ? c.size : propNow(c, 'scale'), rot: propNow(c, 'rot') || 0 };
  const d0 = Math.max(1, Math.hypot(p.x - b.cx, p.y - b.cy));
  const a0 = Math.atan2(p.y - b.cy, p.x - b.cx);
  let moved = false;
  const onMove = ev => {
    const q = canvasPoint(ev);
    if (!moved) {
      if (Math.hypot(q.x - p.x, q.y - p.y) < 3) return;
      moved = true;
      pushHistory();
    }
    if (mode === 'move') {
      let nx = start.x + (q.x - p.x) / W * 100, ny = start.y + (q.y - p.y) / H * 100;
      if (!ev.altKey) { if (Math.abs(nx - mid) < 1.5) nx = mid; if (Math.abs(ny - mid) < 1.5) ny = mid; }   // snap to the centre, Alt skips
      const lim = isText ? [0, 100] : [-100, 100];
      setAnim(c, kx, Math.max(lim[0], Math.min(lim[1], nx)));
      setAnim(c, ky, Math.max(lim[0], Math.min(lim[1], ny)));
      for (const g of group) if (g.o !== c) { g.o.x = Math.max(0, Math.min(100, g.x + propNow(c, 'x') - start.x)); g.o.y = Math.max(0, Math.min(100, g.y + propNow(c, 'y') - start.y)); }
    } else if (mode === 'resize') {
      const f = Math.hypot(q.x - b.cx, q.y - b.cy) / d0;
      if (isText) { c.size = Math.max(8, Math.min(300, Math.round(start.size * f))); for (const g of group) g.o.size = c.size; }
      else setAnim(c, 'scale', Math.max(0.1, Math.min(4, +(start.size * f).toFixed(2))));
    } else {
      let r = start.rot + (Math.atan2(q.y - b.cy, q.x - b.cx) - a0) * 180 / Math.PI;
      r = ((r + 180) % 360 + 360) % 360 - 180;
      if (!ev.altKey) { const sn = Math.round(r / 15) * 15; if (Math.abs(r - sn) < 3) r = sn; }   // snap to 15 degrees, Alt skips
      setAnim(c, 'rot', Math.round(r * 10) / 10);
    }
    draw();
  };
  const onUp = () => {
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    if (moved) renderInspector();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
});

// Alt + arrow keys nudge the selected text or picture by 1% (Shift: 5%).
function nudgeSel(dx, dy) {
  const c = selClip();
  if (!c || !boxes.has(c.id)) return;
  pushHistory();
  const isText = c.text != null, kx = isText ? 'x' : 'px', ky = isText ? 'y' : 'py', mid = isText ? 50 : 0, lim = isText ? [0, 100] : [-100, 100];
  setAnim(c, kx, Math.max(lim[0], Math.min(lim[1], propNow(c, kx) + dx)));
  setAnim(c, ky, Math.max(lim[0], Math.min(lim[1], propNow(c, ky) + dy)));
  renderInspector(); draw();
}

// ---------- playback ----------
let playClock = 0, playT0 = 0;

function syncMedia() {
  for (const a of state.assets.values()) {
    if (a.kind === 'image') continue;
    if (a.kind === 'audio') {
      // a player for the clip playing now, or starting within 2 s while playing (so it is ready in time)
      const soon = c => c.assetId === a.id && (active(c, state.t) || (state.playing && c.start > state.t && c.start - state.t < 2));
      if (!state.clips.some(soon)) { if (a.el && (!state.playing || performance.now() - (a.lastUse || 0) > 1500)) releasePlayer(a); else if (a.el && !a.el.paused) a.el.pause(); continue; }
      audioPlayer(a);
    }
    // a video has two players: the picture (a.el) and its sound (a.aEl, used by the clip on the Audio layer)
    const roles = a.kind === 'video' ? [[a.el, o => !o.audioOnly], [a.aEl, o => o.audioOnly]] : [[a.el, () => true]];
    for (const [el, want] of roles) {
      if (!el) continue;
      const c = state.clips.find(o => o.assetId === a.id && active(o, state.t) && want(o));
      if (!c) { if (!el.paused) el.pause(); continue; }
      const target = srcTime(c, state.t);
      el.playbackRate = Math.max(0.0625, Math.min(16, curSpeed(c, state.t)));
      const ts = trackState[c.track], anySolo = trackState.some(o => o.solo);
      const audible = !c.silent && !ts.muted && (!anySolo || ts.solo);
      el.__track = c.track;
      audioApply(el, c, audible ? (kfAt(c, 'vol', state.t) ?? c.vol ?? 1) * fadeFactor(c, state.t) * transVol(c, state.t) * (ts.vol ?? 1) : 0, ts.pan || 0);
      if (state.playing) {
        if (Math.abs(el.currentTime - target) > 0.3) el.currentTime = target;
        if (el.paused) el.play().catch(() => {});
      } else {
        if (!el.paused) el.pause();
        if (Math.abs(el.currentTime - target) > 0.02) el.currentTime = target;
      }
    }
  }
}

function tick(now) {
  if (!state.playing) return;
  const end = totalDur();
  state.t = playT0 + (now - playClock) / 1000;
  if (state.t >= end) { state.t = end; pause(); return; }
  syncMedia(); draw(); updateTime();
  requestAnimationFrame(tick);
}
function play() {
  if (state.playing) return;
  const end = totalDur();
  if (!end) return;
  if (state.t >= end) state.t = 0;
  if (actx && actx.state === 'suspended') actx.resume();
  state.playing = true;
  playClock = performance.now();
  playT0 = state.t;
  setIcon($('#btn-play'), 'pause', false, 16);
  requestAnimationFrame(tick);
}
function pause() {
  const was = state.playing;
  state.playing = false;
  setIcon($('#btn-play'), 'play', false, 16);
  syncMedia(); draw(); updateTime();
  if (was && onEnd) { const f = onEnd; onEnd = null; f(); }
}
let onEnd = null;
function seek(t) {
  state.t = Math.max(0, Math.min(t, Math.max(totalDur(), 0)));
  if (state.playing) { playClock = performance.now(); playT0 = state.t; }
  syncMedia(); draw(); updateTime();
}

function updateTime() {
  $('#time').textContent = `${fmt(state.t)} / ${fmt(totalDur())}`;
  const ph = $('#playhead');
  if (ph) {
    ph.style.left = state.t * state.pps + 'px';
    if (state.playing) {
      const sc = $('#tl-scroll');
      const x = state.t * state.pps;
      if (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft) sc.scrollLeft = x - 40;
    }
  }
}

// ---------- timeline ----------
function niceStep(minSec) {
  return [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300].find(s => s >= minSec) || 600;
}

function timeFromX(clientX) {
  return Math.max(0, (clientX - $('#tl-inner').getBoundingClientRect().left) / state.pps);
}

function renderTimeline() {
  const pps = state.pps;
  const inner = $('#tl-inner');
  const dur = Math.max(totalDur() + 10, 30);
  inner.style.width = dur * pps + 'px';
  inner.innerHTML = '';

  const ruler = mk('div', 'ruler');
  const step = niceStep(80 / pps);
  for (let s = 0; s < dur; s += step) {
    const tk = mk('div', 'tick');
    tk.style.left = s * pps + 'px';
    tk.textContent = fmt(s).slice(0, step < 1 ? 5 : 5);
    ruler.append(tk);
  }
  ruler.addEventListener('mousedown', e => {
    seek(timeFromX(e.clientX));
    const move = ev => seek(timeFromX(ev.clientX));
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); };
    addEventListener('mousemove', move); addEventListener('mouseup', up);
  });
  for (const mt of state.markers) {   // markers show as small yellow flags on the ruler
    const mf = mk('div', 'marker');
    mf.style.left = mt * pps + 'px';
    mf.title = `Marker ${fmt(mt)}`;
    ruler.append(mf);
  }
  inner.append(ruler);

  LANE_ORDER.forEach(ti => {
    const lane = mk('div', 'lane');
    lane.dataset.track = ti;
    lane.addEventListener('mousedown', e => { if (e.target === lane) { state.sel = null; seek(timeFromX(e.clientX)); renderTimeline(); renderInspector(); } });
    lane.addEventListener('dragover', e => { e.preventDefault(); lane.classList.add('over'); });
    lane.addEventListener('dragleave', () => lane.classList.remove('over'));
    lane.addEventListener('drop', e => {
      e.preventDefault();
      lane.classList.remove('over');
      const a = state.assets.get(Number(e.dataTransfer.getData('text/plain')));
      if (!a || !laneOk(a.kind, ti)) return;
      pushHistory();
      const c = addMediaClips(a, ti, timeFromX(e.clientX));
      state.sel = c.id;
      afterEdit();
    });
    for (const c of state.clips.filter(c => c.track === ti)) lane.append(clipEl(c));
    inner.append(lane);
  });

  const ph = mk('div');
  ph.id = 'playhead';
  inner.append(ph);
  updateTime();
}

// ---------- waveform on sound clips ----------
const PEAKS_PER_SEC = 100;
// loudness of the asset's sound, 100 values per second (computed once, in the background)
function getPeaks(a) {
  if (a.peaks) return a.peaks;
  if (a.peaksLoading || !a.file) return null;
  a.peaksLoading = true;
  (async () => {
    try {
      const ac = new AudioContext({ sampleRate: 8000 });
      const buf = await ac.decodeAudioData(await a.file.arrayBuffer());
      ac.close();
      const d = buf.getChannelData(0), block = Math.round(buf.sampleRate / PEAKS_PER_SEC);
      const pk = new Float32Array(Math.ceil(d.length / block));
      let max = 0.0001;
      for (let i = 0; i < pk.length; i++) {
        let m = 0;
        for (let j = i * block, e = Math.min(d.length, j + block); j < e; j++) { const v = Math.abs(d[j]); if (v > m) m = v; }
        pk[i] = m; if (m > max) max = m;
      }
      for (let i = 0; i < pk.length; i++) pk[i] /= max;
      a.peaks = pk;
    } catch { a.peaks = new Float32Array(0); }   // no sound or cannot decode: draw nothing
    renderTimeline();
  })();
  return null;
}
function drawWave(canvas, c) {
  const a = assetOf(c), pk = getPeaks(a);
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d');
  if (!pk || !pk.length) return;
  g.fillStyle = 'rgba(255,255,255,.75)';
  for (let x = 0; x < w; x++) {
    const t0 = c.in + (x / state.pps) * spd(c), t1 = c.in + ((x + 1) / state.pps) * spd(c);
    let m = 0;
    for (let i = Math.floor(t0 * PEAKS_PER_SEC), e = Math.max(i + 1, Math.ceil(t1 * PEAKS_PER_SEC)); i < e && i < pk.length; i++) if (pk[i] > m) m = pk[i];
    const bar = Math.max(1, m * h);
    g.fillRect(x, (h - bar) / 2, 1, bar);
  }
}

function clipEl(c) {
  const kind = clipKind(c);
  const d = mk('div', `clip ${kind}${c.id === state.sel || multiClips().some(m => m.id === c.id) ? ' sel' : ''}`);
  d.style.left = c.start * state.pps + 'px';
  d.style.width = Math.max(4, c.dur * state.pps) + 'px';
  d.title = c.text != null ? (c.fxType ? c.label || c.fxType : (c.speaker ? `${c.speaker}: ` : '') + c.text) : assetOf(c).name;
  if (c.kf) for (const t of new Set(Object.entries(c.kf).filter(([f]) => !f.startsWith('stab')).flatMap(([, v]) => v).map(k => +k.t.toFixed(2)))) { const m = mk('i', 'kfd'); m.style.left = Math.max(0, t * state.pps - 4) + 'px'; d.append(m); }
  if (c.tr) { d.classList.add('has-tr'); d.title += ` (transition: ${TRANSITIONS[c.tr.type] || c.tr.type}, ${c.tr.dur}s)`; }
  const label = mk('span');
  label.textContent = c.text != null ? (c.fxType ? c.label || c.fxType : (c.speaker ? `[${c.speaker}] ` : '') + c.text.replace(/\n/g, ' ')) : assetOf(c).name;
  const hl = mk('div', 'h l'), hr = mk('div', 'h r');
  if (kind === 'audio') {
    const wv = mk('canvas', 'wave');
    wv.width = Math.min(8000, Math.max(4, Math.round(c.dur * state.pps)));
    wv.height = 34;
    d.append(wv);
    drawWave(wv, c);
  }
  d.append(hl, label, hr);
  d.addEventListener('mousedown', e => beginDrag(e, c, e.target === hl ? 'l' : e.target === hr ? 'r' : 'move'));
  return d;
}

let snapOn = true;
function snapPoints(c) {
  const pts = [0, state.t, ...state.markers];
  for (const o of state.clips) if (o.id !== c.id) pts.push(o.start, o.start + o.dur);
  return pts;
}
function snap(v, pts) {
  if (!snapOn) return v;
  const th = 8 / state.pps;
  let best = v, bd = th;
  for (const p of pts) if (Math.abs(p - v) < bd) { bd = Math.abs(p - v); best = p; }
  return best;
}

function beginDrag(e, c, mode) {
  e.stopPropagation();
  e.preventDefault();
  state.sel = c.id;
  pushHistory();
  const orig = { ...c };
  const x0 = e.clientX;
  const kind = clipKind(c);
  const isMedia = kind === 'video' || kind === 'audio';
  const pts = snapPoints(c);
  let moved = false;

  const move = ev => {
    const dx = (ev.clientX - x0) / state.pps;
    let { start, dur, in: inn, track } = orig;
    if (mode === 'move') {
      start = Math.max(0, orig.start + dx);
      const s1 = snap(start, pts), s2 = snap(start + dur, pts) - dur;
      start = Math.abs(s1 - start) <= Math.abs(s2 - start) ? s1 : s2;
      start = Math.max(0, start);
      for (const lane of document.querySelectorAll('.lane')) {
        const r = lane.getBoundingClientRect();
        if (ev.clientY >= r.top && ev.clientY < r.bottom && laneOk(kind, +lane.dataset.track)) track = +lane.dataset.track;
      }
    } else if (mode === 'l') {
      let s = snap(Math.max(0, orig.start + dx), pts);
      const minS = Math.max(0, orig.start - (isMedia ? orig.in / spd(orig) : orig.start));
      s = Math.min(Math.max(s, minS), orig.start + orig.dur - 0.1);
      dur = orig.dur - (s - orig.start);
      inn = srcTime(orig, s);
      start = s;
    } else {
      let end = snap(orig.start + orig.dur + dx, pts);
      dur = Math.min(Math.max(end - orig.start, 0.1), isMedia ? (hasRamp(orig) ? rampMaxDur(orig) : (assetOf(c).dur - orig.in) / spd(orig)) : Infinity);
    }
    if (!fits(c, start, dur, track)) return;
    if (mode === 'l' && orig.kf) { c.kf = kfFront(orig, start - orig.start); if (start > orig.start && kfNeedsLin(orig)) c.kfSmooth = false; }
    Object.assign(c, { start, dur, in: inn, track });
    syncLinked(c);
    moved = true;
    renderTimeline(); syncMedia(); draw();
  };
  const up = () => {
    removeEventListener('mousemove', move);
    removeEventListener('mouseup', up);
    if (!moved) state.history.pop();
    renderTimeline(); renderInspector();
  };
  addEventListener('mousemove', move);
  addEventListener('mouseup', up);
  renderTimeline(); renderInspector();
}

// ---------- inspector ----------
const FONTS = [['Default', TEXT_FONT], ['Serif', 'Georgia, serif'], ['Mono', 'Menlo, monospace'], ['Rounded', '"Arial Rounded MT Bold", sans-serif'], ['Impact', 'Impact, sans-serif'], ['Sinhala', '"Sinhala MN", "Noto Sans Sinhala", sans-serif']];
// Looks, grouped for the dropdown. The values are my own approximations of well known grades
// (teal and orange, bleach bypass, Kodak and Fuji film, pastel, Matrix green, Blade Runner, day for night, golden hour...).
const PRESET_GROUPS = {
  Basic: {
    none: {},
    bw: { contrast: 110, gray: 100 },
    sepia: { sepia: 80 },
    vivid: { bright: 105, contrast: 115, sat: 150 },
    faded: { bright: 110, contrast: 85, sat: 80, sepia: 15 },
    cool: { contrast: 105, sat: 110, hue: 190 },
    dream: { bright: 110, contrast: 95, sat: 120, blur: 3 },
    warm: { temp: 40, tint: 5, sat: 108, exposure: 0.1 },
    cold: { temp: -40, sat: 95 },
    matte: { contrast: 85, shadows: 35, highlights: -15, sat: 90 },
    'airy and bright': { exposure: 0.35, contrast: 90, sat: 95, highlights: -25, shadows: 30, temp: 6, gamma: 1.12 },
    'clean pop': { contrast: 112, sat: 135, exposure: 0.1, sharpen: 25 },
    portrait: { temp: 15, tint: 4, contrast: 95, sat: 105, highlights: -12, shadows: 12, gamma: 1.05 },
  },
  Film: {
    'kodak film': { temp: 18, tint: 4, contrast: 108, sat: 108, shadows: 12, highlights: -8, tone: 20, shadowColor: '#2f4f6f', hiColor: '#ffcf8a', grain: 22, vignette: 15 },
    'fuji film': { temp: -8, tint: -10, contrast: 105, sat: 112, tone: 22, shadowColor: '#1d6b5a', hiColor: '#ffd0e0', grain: 15 },
    vintage: { sepia: 35, contrast: 90, sat: 85, temp: 20, shadows: 15, vignette: 30, grain: 35 },
    'vhs retro': { sat: 80, contrast: 92, temp: 15, tint: 12, shadows: 25, blur: 0.5, grain: 45, tone: 30, shadowColor: '#3a2d7a', hiColor: '#ffb3c1', vignette: 25 },
    'bleach bypass': { sat: 55, contrast: 135, gray: 20, exposure: -0.2, grain: 15 },
    noir: { gray: 100, contrast: 140, exposure: -0.1, vignette: 45, grain: 25 },
    'bw high contrast': { gray: 100, contrast: 160, exposure: -0.2, shadows: -25, highlights: 10, vignette: 55, grain: 30 },
    'cross process': { contrast: 125, sat: 130, temp: -15, tint: -15, tone: 50, shadowColor: '#0aa0a0', hiColor: '#ffe14d' },
  },
  Cinema: {
    cinematic: { contrast: 115, sat: 95, exposure: -0.1, shadows: -10, tone: 35, shadowColor: '#1f6f78', hiColor: '#ff9d4d', vignette: 35, grain: 10 },
    'teal and orange': { contrast: 118, sat: 115, temp: 12, tone: 60, shadowColor: '#0f6a78', hiColor: '#ff9540', highlights: -8, vignette: 20 },
    blockbuster: { contrast: 125, sat: 112, temp: -5, tone: 45, shadowColor: '#0f4c5c', hiColor: '#ff9f55', highlights: -8, shadows: -12, vignette: 25, sharpen: 20 },
    'blade runner': { temp: 35, contrast: 130, sat: 110, exposure: -0.3, shadows: -15, tone: 60, shadowColor: '#0a4a5c', hiColor: '#ff8a3d', vignette: 45, grain: 18 },
    'matrix green': { tint: -45, temp: -10, contrast: 125, sat: 70, exposure: -0.15, tone: 55, shadowColor: '#0b3d1d', hiColor: '#8dff9a', vignette: 30, grain: 15 },
    horror: { sat: 45, contrast: 130, exposure: -0.35, temp: -25, tint: -20, shadows: -25, tone: 35, shadowColor: '#0c2a24', hiColor: '#b8d8c8', vignette: 60, grain: 30 },
    moody: { exposure: -0.35, contrast: 120, sat: 85, temp: -15, shadows: -20, vignette: 50 },
    'day for night': { exposure: -0.9, temp: -60, tint: 8, contrast: 120, sat: 55, highlights: -20, tone: 40, shadowColor: '#0a1f5c', hiColor: '#8fb4ff', vignette: 50 },
  },
  'Mood and color': {
    'golden hour': { exposure: 0.15, temp: 60, tint: 6, contrast: 108, sat: 122, highlights: -10, shadows: 10, tone: 30, shadowColor: '#8a3b12', hiColor: '#ffc766', vignette: 20 },
    sunset: { temp: 55, tint: 10, sat: 125, tone: 30, shadowColor: '#6a1b9a', hiColor: '#ff7043', vignette: 20 },
    autumn: { temp: 45, tint: 8, sat: 125, tone: 25, shadowColor: '#5a2a10', hiColor: '#ffb347' },
    winter: { temp: -50, sat: 85, exposure: 0.1, tone: 30, shadowColor: '#1e3a5f', hiColor: '#e8f4ff' },
    'pastel (Wes Anderson)': { exposure: 0.15, contrast: 90, sat: 85, temp: 12, tint: 6, gamma: 1.1, shadows: 25, highlights: -10, tone: 25, shadowColor: '#f4a6b8', hiColor: '#fff1c1' },
    cyberpunk: { contrast: 115, sat: 140, tint: 30, tone: 50, shadowColor: '#2b0a6b', hiColor: '#00e5ff' },
    'neon night': { sat: 150, contrast: 120, exposure: -0.25, tone: 70, shadowColor: '#5b0fa8', hiColor: '#00ffd5', vignette: 35 },
    duotone: { gray: 100, contrast: 115, tone: 100, shadowColor: '#1b2a6b', hiColor: '#ff6ec7' },
  },
};
// Which look a clip currently has: an exact match with a preset, "<name> (modified)" if sliders were moved after applying one, or "custom".
function lookName(c) {
  const same = n => Object.keys(COLOR_DEFAULTS).every(k => (c[k] ?? COLOR_DEFAULTS[k]) === PRESETS[n][k]);
  const hit = Object.keys(PRESETS).find(same);
  if (hit) return { name: hit, label: hit };
  return c.look && PRESETS[c.look] ? { name: '', label: `${c.look} (modified)` } : { name: '', label: 'custom' };
}
const PRESETS = Object.fromEntries(Object.values(PRESET_GROUPS).flatMap(g => Object.entries(g)).map(([k, v]) => [k, { ...COLOR_DEFAULTS, ...v }]));

// Speaker dropdown (a real <select>, so every name is always listed): people on the timeline, saved Voice Studio voices, Person 1-6, or a new name.
const attrEsc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function speakerChoices(current, noneLabel = 'No speaker', generic = true) {
  const names = new Set();
  if (current) names.add(current);
  for (const o of state.clips) if (o.speaker) names.add(o.speaker);
  if (typeof trNames !== 'undefined') for (const n of Object.values(trNames)) names.add(n);
  if (typeof studioVoices !== 'undefined') for (const n of studioVoices) names.add(n);
  if (generic) for (let i = 1; i <= 6; i++) names.add(`Person ${i}`);
  else for (const n of [...names]) if (/^Person \d+$/.test(n)) names.delete(n);   // in Who is who, "Person N" is the default, not a name to pick
  return `<option value="">${attrEsc(noneLabel)}</option>` + [...names].map(n => `<option value="${attrEsc(n)}"${n === current ? ' selected' : ''}>${attrEsc(n)}</option>`).join('') + '<option value="__new">+ New name…</option>';
}
// "+ New name…" asks for the name, adds it to the list and selects it. Returns the chosen name, or null if cancelled.
function askNewSpeaker(sel, previous) {
  const n = (prompt('Name of the speaker:') || '').trim().slice(0, 40);
  if (!n) { sel.value = previous || ''; return null; }
  if (![...sel.options].some(o => o.value === n)) sel.insertBefore(new Option(n, n), sel.querySelector('[value="__new"]'));
  sel.value = n;
  return n;
}
function kfSync() {   // keep the sliders of an animated clip in step with the playhead
  const c = selClip();
  if (!c || !c.kf) return;
  const box = $('#inspector');
  for (const f in c.kf) {
    const v = kfAt(c, f, state.t);
    if (v === undefined) continue;
    for (const o of box.querySelectorAll(`[data-f=${f}]`)) if (document.activeElement !== o) o.value = o.type === 'number' ? (+v).toFixed(2) : v;
  }
  const l = $('#kf-list'); if (l) l.innerHTML = kfListHtml(c, $('#kf-prop')?.value);
}
function kfListHtml(c, f) {
  const ks = (c.kf && c.kf[f]) || [];
  return ks.length ? ks.map(k => `<a data-kfgo="${k.t}">${k.t.toFixed(1)}s: ${+(+k.v).toFixed(2)}</a>`).join(' · ') : 'No keyframes on this property yet.';
}
function kfSection(c, kind) {
  const props = KF_PROPS[kind === 'text' ? 'text' : kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'media'], f0 = Object.keys(props)[0];
  return `<h3>Keyframes (animation)</h3><p class="muted">Move the playhead, press ◆ Add, move the playhead again and change the value (slider or drag on the picture): the clip animates between the keyframes.</p>`
    + `<label>Property</label><select id="kf-prop">${Object.entries(props).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>`
    + `<div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="kf-add">◆ Add / update here</button><button type="button" id="kf-del">Remove here</button><button type="button" id="kf-clear">Clear this property</button></div>`
    + `<p class="muted" id="kf-list">${kfListHtml(c, f0)}</p>`
    + `<label><input type="checkbox" id="kf-smooth" ${c.kfSmooth === false ? '' : 'checked'}> Smooth start and end between keyframes</label>`
    + (kind === 'video' ? `<label>Speed ramp (changes speed during the clip)</label><div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" data-kfp="rampup">Slow to fast</button><button type="button" data-kfp="rampdown">Fast to slow</button><button type="button" data-kfp="rampdip">Slow-mo dip</button></div>` : '')
    + (kind === 'text' || kind === 'audio' ? '' : `<label>Quick animations</label><div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" data-kfp="zoomin">Slow zoom in</button><button type="button" data-kfp="zoomout">Slow zoom out</button><button type="button" data-kfp="panright">Pan right</button><button type="button" data-kfp="panleft">Pan left</button></div>`)
    + `<div class="row" style="justify-content:flex-start"><button type="button" data-kfp="clear">Remove all keyframes</button></div>`;
}
function renderInspector() {
  const box = $('#inspector');
  const c = selClip();
  if (!c) { box.innerHTML = '<p class="muted">Select a clip</p>'; return; }
  const kind = clipKind(c);
  if (kind === 'text' && c.fxType && typeof fxInspector === 'function') { box.innerHTML = fxInspector(c); return; }   // effects.js: effect and graphic clips
  const visual = kind !== 'audio', media = kind === 'video' || kind === 'audio';
  const num = (f, label, step = 0.01, d = 0) => `<label>${label}</label><input type="number" step="${step}" data-f="${f}" value="${(+(c[f] ?? d)).toFixed(2)}">`;
  const rng = (f, label, min, max, step, d = 1) => `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" data-f="${f}" value="${c[f] ?? d}">`;
  const many = multiClips().length;
  let h = `<h3>${kind[0].toUpperCase() + kind.slice(1)} clip</h3>` + (many ? `<p class="muted">${many} clips selected: changes to look and sound settings apply to all of them. Delete removes all.</p>` : '') + num('start', 'Start (s)') + num('dur', 'Duration (s)');
  if (media) h += rng('speed', 'Speed (0.25x - 4x)', 0.25, 4, 0.05) + (c.silent ? `<p class="muted">Its sound is on a separate Audio layer, linked to this clip: moving, trimming, splitting and deleting change both.</p>` : rng('vol', 'Volume', 0, 1, 0.01));
  if (kind === 'video' && !c.silent) h += `<button type="button" id="sep-audio">Separate audio to its own layer</button>`;
  if (c.audioOnly) h += `<p class="muted">This is the sound of a video clip, linked to the picture clip.</p>`;
  h += rng('fadeIn', 'Fade in (s)', 0, 5, 0.1, 0) + rng('fadeOut', 'Fade out (s)', 0, 5, 0.1, 0);
  if (visual) h += rng('opacity', 'Opacity', 0, 1, 0.01);
  if (kind === 'text') {
    h += `<label>Text</label><textarea rows="4" data-f="text"></textarea><p class="muted" id="word-count">${countText()}</p>`
      + `<label>Speaker (who says this; not shown in the subtitle)</label><select data-f="speaker">${speakerChoices(c.speaker)}</select>`
      + `<label>Font</label><select data-f="font">${FONTS.map(([n, v]) => `<option value='${v}' ${c.font === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`
      + num('size', 'Font size', 1) + rng('size', 'Font size (slider)', 8, 300, 1, 56)
      + rng('rot', 'Rotation (deg)', -180, 180, 1, 0)
      + `<label>Color</label><input type="color" data-f="color" value="${c.color}">`
      + `<label><input type="checkbox" data-f="bg" ${c.bg ? 'checked' : ''}> Background box</label>`
      + `<label><input type="checkbox" data-f="glass" ${c.glass ? 'checked' : ''}> Liquid Glass background</label>`
      + (c.glass ? `<label>Glass theme</label><select data-f="glassTheme"><option value="light" ${c.glassTheme === 'dark' ? '' : 'selected'}>Light glass</option><option value="dark" ${c.glassTheme === 'dark' ? 'selected' : ''}>Dark glass</option></select>`
        + rng('glassRadius', 'Corner radius (%)', 0, 100, 1, 45) + rng('glassBlur', 'Background blur (px)', 0, 40, 1, 14)
        + `<p class="muted">Use Animation in / out below for the entrance and exit.</p>` : '')
      + `<label><input type="checkbox" data-f="bold" ${c.bold === false ? '' : 'checked'}> Bold</label>`
      + rng('x', 'Horizontal position (%)', 0, 100, 1, 50) + rng('y', 'Vertical position (%)', 0, 100, 1)
      + (typeof textFxSection === 'function' ? textFxSection(c) : '');
  } else if (visual) {
    h += `<h3>Transform</h3>` + rng('scale', 'Scale', 0.1, 4, 0.01) + rng('px', 'Position X (%)', -100, 100, 1, 0) + rng('py', 'Position Y (%)', -100, 100, 1, 0) + rng('rot', 'Rotation (deg)', -180, 180, 1, 0)
      + `<h3>Crop (%)</h3>` + rng('cropL', 'Left', 0, 90, 1, 0) + rng('cropR', 'Right', 0, 90, 1, 0) + rng('cropT', 'Top', 0, 90, 1, 0) + rng('cropB', 'Bottom', 0, 90, 1, 0)
      + `<h3>Color grading</h3><p class="look">Current look: <b id="look-now">${lookName(c).label}</b></p><label>Preset (look)</label><select id="preset"><option value="">choose a look…</option>${Object.entries(PRESET_GROUPS).map(([g, items]) => `<optgroup label="${g}">${Object.keys(items).map(k => `<option value="${k}"${lookName(c).name === k ? ' selected' : ''}>${k}</option>`).join('')}</optgroup>`).join('')}</select>`
      + `<canvas id="hist" width="240" height="70" title="RGB histogram of the frame"></canvas>`
      + `<h4>Light</h4>` + rng('exposure', 'Exposure (stops)', -2, 2, 0.05, 0) + rng('bright', 'Brightness (%)', 0, 200, 1, 100) + rng('contrast', 'Contrast (%)', 0, 200, 1, 100)
      + rng('highlights', 'Highlights', -100, 100, 1, 0) + rng('shadows', 'Shadows', -100, 100, 1, 0) + rng('gamma', 'Gamma (midtones)', 0.5, 2, 0.01, 1)
      + `<h4>Color</h4>` + rng('temp', 'Temperature (cool - warm)', -100, 100, 1, 0) + rng('tint', 'Tint (green - magenta)', -100, 100, 1, 0)
      + rng('sat', 'Saturation (%)', 0, 300, 1, 100) + rng('hue', 'Hue rotate (deg)', 0, 360, 1, 0)
      + `<h4>Split toning</h4><label>Shadow color</label><input type="color" data-f="shadowColor" value="${c.shadowColor ?? COLOR_DEFAULTS.shadowColor}"><label>Highlight color</label><input type="color" data-f="hiColor" value="${c.hiColor ?? COLOR_DEFAULTS.hiColor}">`
      + rng('tone', 'Amount', 0, 100, 1, 0)
      + `<h4>Effects</h4>` + rng('vignette', 'Vignette', 0, 100, 1, 0) + rng('grain', 'Film grain', 0, 100, 1, 0) + rng('sharpen', 'Sharpen', 0, 100, 1, 0) + rng('blur', 'Blur (px)', 0, 30, 0.5, 0)
      + rng('gray', 'Grayscale (%)', 0, 100, 1, 0) + rng('sepia', 'Sepia (%)', 0, 100, 1, 0) + rng('invert', 'Invert (%)', 0, 100, 1, 0)
      + `<button type="button" id="cg-reset">Reset color</button><p class="muted">Filters need Chrome, Edge or Firefox.</p>`;
  }
  if (kind === 'video' || kind === 'image') h += fxSection(c, kind);
  if (typeof audioSection === 'function' && kind === 'audio') h += audioSection(c);
  if (kind !== 'audio' && typeof effectsSection === 'function') h += effectsSection(c, kind);   // effects.js: picture in picture, mask, tracking, animation, presets
  h += kfSection(c, kind);
  box.innerHTML = h;
  const ta = box.querySelector('textarea');
  if (ta) ta.value = c.text;
}

$('#inspector').addEventListener('click', e => {
  if (e.target.id === 'cg-reset') {
    const c = selClip();
    if (!c) return;
    pushHistory();
    for (const o of multiClips().length ? multiClips() : [c]) Object.assign(o, COLOR_DEFAULTS, { look: 'none' });
    renderInspector(); draw();
    return;
  }
  if (e.target.id !== 'sep-audio') return;
  const c = selClip();
  if (!c) return;
  pushHistory();
  detachAudio(c);
  afterEdit();
});
$('#inspector').addEventListener('focusin', () => pushHistory());
$('#inspector').addEventListener('change', e => {
  if (e.target.id !== 'preset' || !PRESETS[e.target.value]) return;
  const c = selClip();
  if (!c) return;
  for (const o of multiClips().length ? multiClips() : [c]) Object.assign(o, PRESETS[e.target.value], { look: e.target.value });
  renderInspector(); draw();
});
$('#inspector').addEventListener('input', e => {
  const c = selClip(), f = e.target.dataset.f;
  if (!c || !f) return;
  if (f === 'speaker' && e.target.value === '__new' && askNewSpeaker(e.target, c.speaker) === null) return;
  const v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' || e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
  if (typeof v === 'number' && isNaN(v)) return;
  if (f === 'speed' && hasRamp(c)) {   // a speed ramp is active: the slider sets a key at the playhead
    const keep = JSON.stringify(c.kf.speed);
    setKey(c, 'speed', Math.max(0.25, Math.min(4, v)));
    if (!rampOk(c)) { c.kf.speed = JSON.parse(keep); toast('That would use more video than the file has'); } else kfMirror(c);
    renderTimeline(); syncMedia(); draw(); return;
  }
  const kind = clipKind(c), isMedia = kind === 'video' || kind === 'audio';
  const maxDur = (speed, inn = c.in) => (isMedia ? (hasRamp(c) ? rampMaxDur(c, inn) : (assetOf(c).dur - inn) / speed) : Infinity);
  if (f === 'start' && (v < 0 || !fits(c, v, c.dur, c.track))) return;
  if (f === 'dur' && (v < 0.1 || v > maxDur(spd(c)) + 1e-6 || !fits(c, c.start, v, c.track))) return;
  if (f === 'speed') {
    // keep the same piece of source: a faster clip gets shorter on the timeline
    const dur = c.dur * spd(c) / v;
    if (dur < 0.1 || dur > maxDur(v) + 1e-6 || !fits(c, c.start, dur, c.track)) return;
    kfRetime(c, dur / c.dur); c.dur = dur;
    const d = $('#inspector').querySelector('[data-f=dur]');
    if (d) d.value = dur.toFixed(2);
  }
  if (KF_ANIM.has(f)) setAnim(c, f, v); else c[f] = v;
  if (f === 'glass') renderInspector();
  if (f === 'start' || f === 'dur' || f === 'speed') syncLinked(c);
  { const ln = $('#look-now'), sel = $('#preset'); if (ln) { const l = lookName(c); ln.textContent = l.label; if (sel) sel.value = l.name; } }
  if (f === 'text') { const w = $('#word-count'); if (w) w.textContent = countText(); }
  if (['speaker', 'size', 'color', 'font', 'bg', 'glass', 'glassTheme', 'glassRadius', 'glassBlur', 'bold', 'animIn', 'animOut', 'animDur', 'accent', 'lt', 'mask', 'mw', 'mh', 'feather', 'maskInv', 'round', 'border', 'borderColor', 'shadow', 'amount', 'fxSpeed', 'lw', 'x', 'y', 'rot', 'opacity', 'fadeIn', 'fadeOut', 'vol', 'scale', 'px', 'py', 'bright', 'contrast', 'sat', 'hue', 'gray', 'sepia', 'blur', ...Object.keys(COLOR_DEFAULTS)].includes(f)) for (const o of multiClips()) o[f] = v;
  for (const o of $('#inspector').querySelectorAll(`[data-f=${f}]`)) if (o !== e.target && o.type !== 'checkbox' && o.tagName !== 'TEXTAREA') o.value = o.type === 'number' ? (+v).toFixed(2) : v;
  renderTimeline(); syncMedia(); draw();
});

// ---------- more editing tools ----------
function trimStartToPlayhead() {
  const c = selClip(), t = state.t;
  if (!c || !(t > c.start + 0.05 && t < c.start + c.dur - 0.05)) return;
  pushHistory();
  const newIn = srcTime(c, t), lin = kfNeedsLin(c);
  c.kf = kfFront(c, t - c.start);
  if (lin) c.kfSmooth = false;
  c.in = newIn;
  c.dur -= t - c.start;
  c.start = t;
  afterEdit();
}
function trimEndToPlayhead() {
  const c = selClip(), t = state.t;
  if (!c || !(t > c.start + 0.05 && t < c.start + c.dur - 0.05)) return;
  pushHistory();
  c.dur = t - c.start;
  afterEdit();
}
function rippleDelete() {
  const c = selClip();
  if (!c) return;
  pushHistory();
  rippleRemove(c);
  state.sel = null;
  afterEdit();
}
function saveFrame() {
  canvas.toBlob(b => {
    const a = mk('a');
    a.href = URL.createObjectURL(b);
    a.download = `frame-${fmt(state.t).replace(':', '-')}.png`;
    a.click();
  });
}
// Small line icons for the layer buttons (saves space in the label column).
const ICONS = {
  select: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9c1.5 1.5 1.5 4.5 0 6"/>',
  slash: '<path d="M3 3l18 18"/>',
  start: '<path d="M6 5v14M19 5l-9 7 9 7z"/>',
  play: '<path fill="currentColor" d="M7 4l13 8-13 8z"/>',
  pause: '<path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
  split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
  dup: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  trimin: '<path d="M4 4v16M9 12h11M9 12l4-4M9 12l4 4"/>',
  trimout: '<path d="M20 4v16M15 12H4M15 12l-4-4M15 12l-4 4"/>',
  ripple: '<path d="M3 7h10M6 7V4h4v3M4 7l1 12h6l1-12M16 8l4 4-4 4"/>',
  frame: '<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
  tools: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
};
function setIcon(btn, name, slashed = false, size = 14) {
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}${slashed ? ICONS.slash : ''}</svg>`;
}

function buildLabels() {
  const l = $('#labels');
  l.innerHTML = '';
  LANE_ORDER.forEach(i => {
    const t = TRACKS[i];
    const d = mk('div');
    const grip = mk('span', 'lane-grip');
    grip.textContent = '\u22EE\u22EE';
    grip.title = 'Drag up or down to reorder this layer';
    grip.onpointerdown = e => beginLaneDrag(e, i);
    d.append(grip);
    const name = mk('span');
    name.textContent = (activeTrack[t.kind] === i ? '\u25B8 ' : '') + t.name;
    name.title = 'Click to make this the layer new clips go on';
    name.style.cssText = 'flex:1;cursor:pointer';
    name.onclick = () => { activeTrack[t.kind] = i; buildLabels(); };
    d.append(name);
    const sel = mk('button', 'tg');
    setIcon(sel, 'select');
    sel.title = 'Select all clips on this layer';
    sel.onclick = () => selectLayer(i);
    d.append(sel);
    const rm = mk('button', 'tg rm');
    setIcon(rm, 'trash');
    const sameKind = LANE_ORDER.filter(j => TRACKS[j].kind === t.kind).length;
    rm.disabled = sameKind < 2;
    rm.title = sameKind < 2 ? 'The last layer of its kind cannot be removed' : 'Remove this layer and its clips';
    rm.onclick = () => askRemoveLayer(i);
    d.append(rm);
    if (t.kind !== 'audio') {
      const eye = mk('button', 'tg');
      eye.title = 'Hide / show this layer in the preview';
      const showEye = () => { setIcon(eye, 'eye', trackState[i].hidden); eye.classList.toggle('on', trackState[i].hidden); };
      showEye();
      eye.onclick = () => { trackState[i].hidden = !trackState[i].hidden; showEye(); draw(); };
      d.append(eye);
    }
    if (t.kind !== 'text') {
      const mu = mk('button', 'tg');
      mu.title = 'Mute / unmute this layer';
      const showMu = () => { setIcon(mu, 'speaker', trackState[i].muted); mu.classList.toggle('on', trackState[i].muted); };
      showMu();
      mu.onclick = () => { trackState[i].muted = !trackState[i].muted; showMu(); syncMedia(); };
      d.append(mu);
    }
    l.append(d);
  });
}

// Drag a layer by its grip to a new row. Only LANE_ORDER changes (track indexes stay the same, so clips and undo are unaffected).
// Rows nearer the top are drawn on top of the picture, so this also changes which layer covers which.
function beginLaneDrag(e, i) {
  if (e.button) return;
  e.preventDefault();
  const grip = e.currentTarget, rows = [...$('#labels').children], from = LANE_ORDER.indexOf(i);
  const rowH = rows[from].getBoundingClientRect().height || 52, y0 = e.clientY;
  let to = from;
  try { grip.setPointerCapture(e.pointerId); } catch { /* synthetic events have no pointer to capture */ }
  rows[from].classList.add('lane-drag');
  const move = ev => {
    const dy = Math.max(-from * rowH, Math.min((rows.length - 1 - from) * rowH, ev.clientY - y0));
    to = Math.max(0, Math.min(rows.length - 1, from + Math.round(dy / rowH)));
    rows.forEach((r, k) => {
      r.style.transform = k === from ? `translateY(${dy}px)` : `translateY(${from < to && k > from && k <= to ? -rowH : from > to && k < from && k >= to ? rowH : 0}px)`;
    });
  };
  const up = () => {
    grip.removeEventListener('pointermove', move);
    grip.removeEventListener('pointerup', up);
    grip.removeEventListener('pointercancel', up);
    if (to !== from) {
      LANE_ORDER.splice(from, 1);
      LANE_ORDER.splice(to, 0, i);
      toast(`Moved "${TRACKS[i].name}" ${to < from ? 'up' : 'down'}`);
    }
    buildLabels(); renderTimeline(); draw();
  };
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', up);
  grip.addEventListener('pointercancel', up);
}

// Remove a whole layer (and the clips on it) after the user confirms in a popup. Undo brings it back.
function askRemoveLayer(i) {
  const n = state.clips.filter(c => c.track === i).length;
  $('#rm-msg').textContent = `Remove "${TRACKS[i].name}"? ${n ? `${n} clip${n === 1 ? '' : 's'} on it will be deleted.` : 'It has no clips.'} You can undo this with Cmd+Z.`;
  $('#rm-yes').onclick = () => {
    $('#rm-dialog').close();
    pushHistory();
    state.clips = state.clips.filter(c => c.track !== i);
    LANE_ORDER.splice(LANE_ORDER.indexOf(i), 1);
    for (const k of Object.keys(activeTrack)) if (activeTrack[k] === i) delete activeTrack[k];
    state.multi = [];
    buildLabels();
    afterEdit();
  };
  $('#rm-dialog').showModal();
}
$('#rm-no').onclick = () => $('#rm-dialog').close();

// ---------- export ----------
const EXPORT_NOTES = {
  'mp4-h264': 'Recorded in real time, then converted with ffmpeg.',
  'mp4-h265': 'Smaller files at the same quality. Plays in Safari/QuickTime; Chrome support varies.',
  mov: 'Apple ProRes 422 HQ: large files, made for editing in other apps.',
  webm: 'Direct from the browser (no conversion).',
  avi: 'MPEG-4 video with MP3 sound, for old players.',
  mkv: 'H.264 + AAC in a Matroska container.',
  gif: 'Silent, 15 fps, up to 640 px wide. Keep clips short.',
  mp3: 'Sound only, 256 kbps.',
  wav: 'Sound only, 48 kHz 16-bit, uncompressed.',
  srt: 'Opens the caption export (choose the text layer).',
  vtt: 'Opens the caption export (choose the text layer).',
};
const EXPORT_PRESETS = {
  yt1080: { fmt: 'mp4-h264', w: 1920, h: 1080, fps: 30, note: 'YouTube 1080p: H.264, 1920x1080, 30 fps.' },
  yt4k: { fmt: 'mp4-h264', w: 3840, h: 2160, fps: 30, note: 'YouTube 4K: H.264, 3840x2160, 30 fps. Slow to convert.' },
  tiktok: { fmt: 'mp4-h264', w: 1080, h: 1920, fps: 30, note: 'TikTok: vertical 1080x1920, 30 fps. Other shapes are fitted with black bars.' },
  reels: { fmt: 'mp4-h264', w: 1080, h: 1920, fps: 30, note: 'Instagram Reels: vertical 1080x1920, 30 fps, up to 90 s.' },
  facebook: { fmt: 'mp4-h264', w: 1920, h: 1080, fps: 30, note: 'Facebook: H.264 MP4, 1920x1080, 30 fps.' },
  shorts: { fmt: 'mp4-h264', w: 1080, h: 1920, fps: 30, note: 'YouTube Shorts: vertical 1080x1920, 30 fps, up to 60 s.' },
  cinema4k: { fmt: 'mp4-h265', w: 4096, h: 2160, fps: 24, note: 'Cinema 4K (DCI): H.265, 4096x2160, 24 fps. Slow to convert.' },
  custom: { note: 'Type any width, height and frame rate. The picture is scaled to fit and padded with black.' },
};
$('#ex-preset').onchange = () => {
  const p = EXPORT_PRESETS[$('#ex-preset').value];
  if (!p) { $('#ex-w').value = $('#ex-h').value = $('#ex-fps').value = ''; $('#ex-note').textContent = EXPORT_NOTES[exFmt()] || ''; return; }
  if (p.fmt) { $('#ex-fmt').value = p.fmt; $('#ex-w').value = p.w; $('#ex-h').value = p.h; $('#ex-fps').value = p.fps; }
  $('#ex-note').textContent = p.note;
};
for (const id of ['#ex-w', '#ex-h', '#ex-fps']) $(id).oninput = () => { if ($('#ex-preset').value && $('#ex-preset').value !== 'custom') $('#ex-preset').value = 'custom'; };
const exFmt = () => $('#ex-fmt').value;
$('#ex-fmt').onchange = () => { if ($('#ex-preset').value !== 'custom') $('#ex-preset').value = $('#ex-preset').value && 'custom'; $('#ex-note').textContent = EXPORT_NOTES[exFmt()] || ''; };
async function exportVideo() {
  const fmt = exFmt();
  const end = totalDur();
  if (fmt === 'srt' || fmt === 'vtt') { $('#ex-dialog').close(); $('#btn-srt-out').click(); return; }
  if (!end) { alert('Nothing on the timeline.'); return; }
  $('#ex-dialog').close();
  const btn = $('#btn-export');
  pause();
  seek(0);
  const stream = canvas.captureStream(FPS);
  if (streamDest) streamDest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.min(40e6, Math.round(8e6 * (W * H) / (1280 * 720))) });
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const done = new Promise(res => { rec.onstop = res; });
  btn.disabled = true;
  exporting = true;
  btn.textContent = 'Exporting… keep this tab open';
  try {
    rec.start(250);
    await new Promise(r => setTimeout(r, 200));
    await new Promise(r => { onEnd = r; play(); });
    await new Promise(r => setTimeout(r, 300));
    rec.stop();
    await done;
    let blob = new Blob(chunks, { type: 'video/webm' });
    let ext = 'webm';
    if (fmt !== 'webm') {
      btn.textContent = 'Converting…';
      const r = await fetch(`/api/export?fmt=${fmt}&w=${+$('#ex-w').value || 0}&h=${+$('#ex-h').value || 0}&fps=${+$('#ex-fps').value || 0}`, { method: 'POST', body: blob });
      if (!r.ok) {
        let msg = 'Conversion failed.';
        try { msg = (await r.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      blob = await r.blob();
      ext = { 'mp4-h264': 'mp4', 'mp4-h265': 'mp4' }[fmt] || fmt;
    }
    const a = mk('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'opencut-export.' + ext;
    a.click();
  } catch (e) {
    alert('Export failed: ' + e.message);
  } finally {
    exporting = false;
    draw();
    btn.disabled = false;
    btn.textContent = 'Export…';
  }
}

// ---------- project save / load ----------
function saveProject() {
  const data = {
    nextId, w: W, h: H,
    assets: [...state.assets.values()].map(a => ({ id: a.id, name: a.name })),
    clips: state.clips, markers: state.markers,
    tracks: TRACKS, laneOrder: LANE_ORDER, activeTrack,
  };
  const a = mk('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  a.download = 'project.opencut.json';
  a.click();
}
function loadProject(text) {
  let data;
  try { data = JSON.parse(text); } catch { alert('Not a valid project file.'); return; }
  const byName = new Map([...state.assets.values()].map(a => [a.name, a.id]));
  const map = new Map();
  const missing = [];
  for (const a of data.assets || []) {
    if (byName.has(a.name)) map.set(a.id, byName.get(a.name)); else missing.push(a.name);
  }
  if (missing.length) alert('Import these media files first, then load the project again:\n' + missing.join('\n'));
  if (missing.length) return;
  if (Array.isArray(data.tracks) && data.tracks.length >= 4 && Array.isArray(data.laneOrder)) {
    TRACKS.length = 0; TRACKS.push(...data.tracks);
    LANE_ORDER.length = 0; LANE_ORDER.push(...data.laneOrder);
    trackState.length = 0; TRACKS.forEach(() => trackState.push({ hidden: false, muted: false, vol: 1, pan: 0, solo: false }));
    for (const k of Object.keys(activeTrack)) delete activeTrack[k];
    Object.assign(activeTrack, data.activeTrack || {});
    buildLabels();
  }
  pushHistory();
  state.clips = (data.clips || []).map(c => (c.assetId != null ? { ...c, assetId: map.get(c.assetId) } : c));
  state.markers = Array.isArray(data.markers) ? data.markers : [];
  nextId = Math.max(nextId, data.nextId || 1, ...state.clips.map(c => c.id + 1));
  $('#aspect').value = `${data.w}x${data.h}`;
  setAspect(data.w || 1280, data.h || 720);
  state.sel = null;
  afterEdit();
}

// ---------- wiring ----------
$('#btn-import').onclick = () => $('#file-media').click();
$('#file-media').onchange = e => { addFiles([...e.target.files]); e.target.value = ''; };
$('#btn-srt').onclick = () => $('#file-srt').click();
$('#file-srt').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (f) importCaptions(await f.text()); };
$('#btn-load').onclick = () => $('#file-proj').click();
$('#file-proj').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (f) loadProject(await f.text()); };
$('#btn-save').onclick = saveProject;
$('#btn-export').onclick = () => { $('#ex-note').textContent = EXPORT_NOTES[exFmt()] || ''; $('#ex-dialog').showModal(); };
$('#ex-go').onclick = exportVideo;
$('#ex-cancel').onclick = () => $('#ex-dialog').close();
$('#btn-text').onclick = addText;
$('#btn-selall-text').onclick = selectAllText;
$('#tl-scroll').addEventListener('scroll', e => { $('#labels').scrollTop = e.target.scrollTop; });
$('#btn-layer-text').onclick = () => addLayer('text');
$('#btn-layer-video').onclick = () => addLayer('video');
$('#btn-layer-audio').onclick = () => addLayer('audio');
$('#btn-undo').onclick = undo;
$('#btn-redo').onclick = redo;
$('#btn-play').onclick = () => (state.playing ? pause() : play());
$('#btn-start').onclick = () => seek(0);
$('#btn-split').onclick = splitAtPlayhead;
$('#btn-dup').onclick = duplicateSel;
$('#btn-del').onclick = deleteSel;
$('#btn-ripple').onclick = rippleDelete;
$('#btn-trimin').onclick = trimStartToPlayhead;
$('#btn-trimout').onclick = trimEndToPlayhead;
$('#btn-frame').onclick = saveFrame;
$('#aspect').onchange = e => {
  const [w, h] = e.target.value.split('x').map(Number);
  // keep text the same relative size: scale it by the change of the shorter side (so 4K text is not tiny)
  const k = Math.min(w, h) / Math.min(W, H);
  if (Math.abs(k - 1) > 1e-6 && state.clips.some(c => c.text != null)) {
    pushHistory();
    for (const c of state.clips) if (c.text != null) c.size = Math.max(8, Math.round(c.size * k));
    renderInspector();
  }
  setAspect(w, h);
};
$('#zoom').oninput = e => { state.pps = +e.target.value; renderTimeline(); };

const bin = $('#bin');
bin.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); bin.classList.add('drop'); } });
bin.addEventListener('dragleave', () => bin.classList.remove('drop'));
bin.addEventListener('drop', e => {
  if (!e.dataTransfer.files.length) return;
  e.preventDefault();
  bin.classList.remove('drop');
  addFiles([...e.dataTransfer.files]);
});

addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== 'range') return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  else if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); selectAllText(); }
  else if (e.altKey && e.key.startsWith('Arrow')) {
    e.preventDefault();
    const n = e.shiftKey ? 5 : 1;
    nudgeSel(e.key === 'ArrowLeft' ? -n : e.key === 'ArrowRight' ? n : 0, e.key === 'ArrowUp' ? -n : e.key === 'ArrowDown' ? n : 0);
  }
  else if (e.key === ' ') { e.preventDefault(); state.playing ? pause() : play(); }
  else if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); copyClips(); }
  else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); pasteClips(); }
  else if (e.key === 's' || e.key === 'S') (e.shiftKey ? splitAll() : splitAtPlayhead());
  else if (e.key === 'd' || e.key === 'D') duplicateSel();
  else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.shiftKey ? rippleDelete() : deleteSel(); }
  else if (e.key === 'q' || e.key === 'Q') trimStartToPlayhead();
  else if (e.key === 'w' || e.key === 'W') trimEndToPlayhead();
  else if (e.key === 'ArrowLeft') seek(state.t - 1 / FPS);
  else if (e.key === 'ArrowRight') seek(state.t + 1 / FPS);
  else if (e.key === 'Home') seek(0);
  else if (e.key === 'm' || e.key === 'M') toggleMarker();
  else if (e.key === 'n' || e.key === 'N') toggleSnap();
  else if (e.key === ',') nudgeClip(-1);
  else if (e.key === '.') nudgeClip(1);
  else if (e.key === 'ArrowUp') { e.preventDefault(); jumpCut(-1); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); jumpCut(1); }
});

buildLabels();
renderTimeline();
renderInspector();
draw();

// ---------- Claude AI (via server.py -> local `claude` CLI, uses your Claude login) ----------
const AI = {
  clean: {
    label: 'Scope', placeholder: 'Leave empty to clean all captions',
    system: 'You fix captions. You receive a JSON array of {"i":number,"text":string}. Fix spelling, grammar and punctuation without changing meaning or language. Keep line breaks. Reply with ONLY a JSON array of {"i","text"} in the same order, no commentary.',
  },
  translate: {
    label: 'Target language', placeholder: 'e.g. Sinhala',
    system: [
      'You are a professional subtitle translator. You receive the consecutive captions of ONE continuous spoken video as a JSON array of {"i":number,"text":string}, plus a target language.',
      'Rules:',
      '1. Translate the MEANING of each caption accurately and naturally into the target language, using the surrounding captions as context. Captions are often fragments of longer sentences, so keep the sentence flow across neighbours but never move words from one caption into another.',
      '2. Return exactly one output item per input item, with the same "i". Never merge, split, skip or add items.',
      '3. Detect the source language yourself. Keep names, brands, numbers, URLs and emails exactly as they are.',
      '4. Do not add explanations, notes or quotation marks. Keep each translation about as short as the original so it fits on screen.',
      '5. If a caption is already in the target language, return it unchanged. If a caption is meaningless noise, return it unchanged instead of guessing.',
      'Some captions may be marked in "context_before": these are earlier captions for context only, do NOT translate or return them.',
      'Reply with ONLY a JSON array of {"i","text"} in the same order, no commentary.',
    ].join('\n'),
  },
  shorten: {
    label: 'Max characters per caption (optional, or extra instructions)', placeholder: 'e.g. 40. Empty = fit the screen (about 42 per line)',
    system: 'You shorten on-screen captions so they fit the screen. You receive a screen description, a maximum length in characters per caption, and a JSON array of {"i":number,"text":string}. Rewrite every caption to be at most that many characters, keeping the key meaning and the SAME language and script (never translate). Prefer cutting filler words over changing meaning. Reply with ONLY a JSON array of {"i","text"} in the same order, no commentary.',
  },
  write: {
    label: 'Topic, language and length', placeholder: 'e.g. 30 second intro about our coffee shop, in English',
    system: 'You write on-screen captions for a short video. Reply with ONLY a JSON array of {"text":string,"dur":number} where dur is seconds on screen (2 to 5), each text under 80 characters, total length matching the requested length. No commentary.',
  },
};

function updateAiForm() {
  const a = AI[$('#ai-action').value];
  $('#ai-label').textContent = a.label;
  $('#ai-input').placeholder = a.placeholder;
}

async function askClaude(system, prompt) {
  const r = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system, prompt }) });
  const j = await r.json().catch(() => ({ error: 'Server returned an unreadable reply. Open the editor through server.py (python3 server.py).' }));
  if (!r.ok) throw new Error(j.error || 'request failed');
  return j.text;
}

// A caption that is one word repeated over and over (a failed transcript) cannot be translated accurately.
function looksGarbled(t) {
  const w = t.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (w.length < 5) return false;
  const f = new Map();
  for (const x of w) f.set(x, (f.get(x) || 0) + 1);
  return Math.max(...f.values()) / w.length > 0.5 || f.size / w.length < 0.25;
}

// ---- Sinhala gets extra care: strict script rules, a script check on every line, and a proofreading pass ----
const isSinhala = lang => /sinhal|සිංහල/i.test(lang) || /^si$/i.test(lang.trim());
const SINHALA_RULES = [
  'The target language is SINHALA (සිංහල). Extra rules:',
  '- Write ONLY in Sinhala Unicode script. Never use Latin transliteration (no Singlish) and never use Tamil, Malayalam or Hindi letters.',
  '- Use clear, natural, modern Sinhala the way a native speaker would say it in a video (spoken style, short sentences). Never translate word for word.',
  '- Use correct Sinhala spelling, conjuncts and ZWJ forms (for example ක්‍ර, ද්‍ය, ශ්‍රී) and correct verb endings for the subject.',
  '- Brand names and technical names (ChatGPT, LinkedIn, URLs, email addresses) stay in Latin letters. Common loanwords may be written in Sinhala letters (for example ඊමේල්). Keep digits as digits.',
].join('\n');
const SINHALA_REVIEW = [
  'You are a native Sinhala editor and proofreader. You receive a JSON array of {"i","source","text"} where "text" is a Sinhala draft translation of "source".',
  'Fix mistranslations, unnatural or word-for-word phrasing, grammar, spelling and ZWJ conjuncts. Keep the meaning faithful to "source". Write only in Sinhala script (brand names, URLs and digits may stay as they are), never Tamil, Malayalam or Latin transliteration. Keep each line about as short as the draft.',
  'Return exactly one item per input with the same "i". Reply with ONLY a JSON array of {"i","text"}, no commentary.',
].join('\n');
// true when the line is proper Sinhala: no letters from other Indic scripts and mostly Sinhala letters
function sinhalaOk(t) {
  if (/[\u0900-\u097F\u0B80-\u0BFF\u0D00-\u0D7F]/.test(t)) return false;
  const letters = t.match(/\p{L}/gu) || [];
  if (!letters.length) return true;
  const si = (t.match(/[\u0D80-\u0DFF]/g) || []).length;
  if (si === 0) return t.trim().split(/\s+/).length <= 3;   // a short brand or name may stay in Latin, a whole English sentence may not
  return si / letters.length >= 0.3;                         // Sinhala with some English names or terms mixed in is fine
}

// Translate in order, in batches, giving Claude the previous captions as context, and retry anything it skipped.
async function translateAll(texts, language, status) {
  const sorted = texts.slice().sort((a, b) => a.start - b.start);
  const good = sorted.filter(c => !looksGarbled(c.text));
  const skipped = sorted.length - good.length;
  const result = new Map();
  const BATCH = 25;
  const si = isSinhala(language);
  const ask = async (items, before, strict = false) => {
    const prompt = `Target language: ${language}\n` + (before.length ? `context_before: ${JSON.stringify(before)}\n` : '') + JSON.stringify(items.map(c => ({ i: c.id, text: c.text })));
    const system = AI.translate.system + (si ? '\n' + SINHALA_RULES + (strict ? '\nYour previous answer used the wrong script or mixed scripts. Answer again strictly in Sinhala script only.' : '') : '');
    for (const o of parseJsonArray(await askClaude(system, prompt))) {
      if (typeof o.text !== 'string' || !o.text.trim() || !items.some(c => c.id === o.i)) continue;
      if (si && !sinhalaOk(o.text.trim())) continue;   // reject wrong-script lines, they get retried below
      result.set(o.i, o.text.trim());
    }
  };
  // second pass for Sinhala: a proofreader checks every draft line against its source
  const review = async items => {
    const drafts = items.filter(c => result.has(c.id)).map(c => ({ i: c.id, source: c.text, text: result.get(c.id) }));
    if (!drafts.length) return;
    try {
      for (const o of parseJsonArray(await askClaude(SINHALA_REVIEW, JSON.stringify(drafts)))) {
        if (typeof o.text === 'string' && o.text.trim() && result.has(o.i) && sinhalaOk(o.text.trim())) result.set(o.i, o.text.trim());
      }
    } catch { /* keep the drafts if the review reply cannot be read */ }
  };
  for (let k = 0; k < good.length; k += BATCH) {
    status.textContent = `Claude is translating… ${Math.min(k + BATCH, good.length)} of ${good.length} captions`;
    const items = good.slice(k, k + BATCH), before = good.slice(Math.max(0, k - 4), k).map(c => c.text);
    await ask(items, before);
    const missing = items.filter(c => !result.has(c.id));
    if (missing.length) await ask(missing, before, true);   // one retry for anything Claude left out or wrote in the wrong script
    for (let m = 0; m < items.length; m += 5) {              // last chance: whatever is still missing, in small groups of 5
      const still = items.slice(m, m + 5).filter(c => !result.has(c.id));
      if (still.length) await ask(still, before, true);
    }
    if (si) { status.textContent = `Proofreading the Sinhala… ${Math.min(k + BATCH, good.length)} of ${good.length}`; await review(items); }
  }
  return { out: [...result].map(([i, text]) => ({ i, text })), skipped, failed: good.filter(c => !result.has(c.id)).length };
}

function parseJsonArray(text) {
  const s = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const a = JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
  if (!Array.isArray(a)) throw new Error('not a list');
  return a;
}

async function runAi() {
  const kind = $('#ai-action').value, input = $('#ai-input').value.trim();
  const status = $('#ai-status'), run = $('#ai-run');
  let texts = state.clips.filter(c => c.text != null && !c.fxType && !c.lt && !(kind === 'translate' && TRACKS[c.track].name.startsWith('Translation:')));
  let prompt, spec = null, maxChars = 0, base_n = 0;
  if (kind === 'write') {
    if (!input) { status.textContent = 'Describe the topic first.'; return; }
    prompt = input;
  } else {
    if (!texts.length) { status.textContent = 'No text or caption clips on the timeline.'; return; }
    if (kind === 'translate' && !input) { status.textContent = 'Enter the target language.'; return; }
    if (kind === 'shorten') {
      // how many characters fit: measure the real font on the real captions for this screen shape
      const pool = multiClips().filter(c => c.text != null);
      const base = pool.length ? pool : texts;
      spec = autoSpec();
      ctx.font = `bold ${spec.size}px ${TEXT_FONT}`;
      const all = base.map(c => c.text.replace(/\s+/g, ' ')).join(' ');
      const avg = ctx.measureText(all).width / Math.max(1, all.length);
      const fit = Math.floor(0.9 * spec.lines * (W * 0.9 - spec.size * 0.8) / avg);
      const typed = /^\d+$/.test(input) ? +input : 0;   // a number in the box is the character limit
      maxChars = Math.max(10, typed || Math.min(fit, spec.lines * 42));   // 42 characters per line is the usual subtitle rule
      base_n = base.length;
      texts = base.filter(c => c.text.length > maxChars);
      if (!texts.length) { status.textContent = `All captions already fit (up to ${maxChars} characters on this screen).`; return; }
      prompt = `Screen: ${W}x${H}, ${spec.shape}. Maximum ${maxChars} characters per caption.${input && !typed ? `\nExtra instructions: ${input}` : ''}\n` + JSON.stringify(texts.map(c => ({ i: c.id, text: c.text })));
    } else prompt = (kind === 'translate' ? `Target language: ${input}\n` : '') + JSON.stringify(texts.map(c => ({ i: c.id, text: c.text })));
  }
  run.disabled = true;
  status.textContent = 'Claude is working… (up to a minute)';
  try {
    let tr = null;
    const out = kind === 'translate' ? (tr = await translateAll(texts, input, status)).out : parseJsonArray(await askClaude(AI[kind].system, prompt));
    if (kind === 'translate' && !out.length) throw new Error(tr.skipped ? 'These captions look like a failed transcript (the same word repeated), so they cannot be translated accurately. Transcribe the audio again first.' : 'Claude returned no translations. Try again.');
    pushHistory();
    if (kind === 'write') {
      let start = laneEnd(0);
      for (const o of out) {
        const dur = Math.min(Math.max(+o.dur || 3, 1), 10);
        const c = newTextClip(String(o.text), start, dur);
        c.size = Math.round(H / 20); c.bg = true; c.y = 88;
        state.clips.push(c);
        start += dur;
      }
    } else {
      const byId = new Map(texts.map(c => [c.id, c]));
      if (kind === 'translate') {
        // translations go on their own new text layer, the originals stay untouched
        addLayer('text');
        const track = TRACKS.length - 1;
        TRACKS[track].name = `Translation: ${input.slice(0, 20)}`;
        buildLabels();
        const done = new Set(out.map(o => o.i));
        for (const c of texts) if (!done.has(c.id)) {   // nothing may be missing: captions that could not be translated are copied as they are, in orange
          state.clips.push({ ...c, id: uid(), track, y: Math.max(5, (c.y ?? 85) - 10), color: '#ff9f43' });
        }
        for (const o of out) {
          const src = byId.get(o.i);
          if (!src || typeof o.text !== 'string' || !o.text) continue;
          state.clips.push({ ...src, id: uid(), track, text: o.text, y: Math.max(5, (src.y ?? 85) - 10), ...(isSinhala(input) ? { font: FONTS.find(f => f[0] === 'Sinhala')[1] } : {}) });   // a little above the original
        }
      } else {
        for (const o of out) if (byId.has(o.i) && typeof o.text === 'string' && o.text) { const c = byId.get(o.i); c.text = o.text; if (spec) c.size = spec.size; }
      }
    }
    afterEdit();
    if (tr) status.textContent = `Done: translated ${out.length} captions${tr.skipped || tr.failed ? `. ${tr.skipped + tr.failed} could not be translated (${tr.skipped} look like a failed transcript, ${tr.failed} failed): they are copied as they are in orange so no caption is missing` : ''}.`;
    else status.textContent = kind === 'shorten' ? `Done: shortened ${out.length} of ${base_n} captions to at most ${maxChars} characters.` : `Done (${out.length} captions).`;
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
  }
  run.disabled = false;
}

$('#btn-ai').onclick = () => { updateAiForm(); $('#ai-status').textContent = ''; $('#ai-dialog').showModal(); };
$('#ai-cancel').onclick = () => $('#ai-dialog').close();
$('#ai-action').onchange = updateAiForm;
$('#ai-run').onclick = runAi;


// ---------- Claude chat: describe an edit in words, Claude replies with actions, the editor runs them ----------
const CHAT_SYSTEM = `You control a video editor. The user describes an edit; you reply with ONLY one JSON object:
{"reply": "<one or two short sentences for the user>", "actions": [ ... ]}
Times are in seconds. Tracks: 0=Text, 1=Video 2, 2=Video 1, 3=Audio. Refer to clips by the "id" in the editor state. If no clip id is given an action uses the selected clip. After split, add_text and add_asset the NEW clip (the right-hand part after a split) becomes selected, so later actions in the same list can omit "clip" to target it. You CANNOT see video yourself, but the editor can show you still frames: each file in "folder" may have "desc" (what is visible), "tags" and "dur" (seconds) written from its frames. For requests that depend on what is IN the footage (find clips with trains, a clip with people, the beach scene...) match the request against desc and tags and use add_asset for the matches. If many folder files have no desc yet (see folderAnalyzed), output {"type":"analyze_folder"} as the ONLY action with a short reply like "Looking at your clips first…"; the editor will analyze the folder and ask you again. Never ask the user to look through the clips or read dates. Files in "folder" are in the user's media folder and not imported yet: add_asset with such a name imports them automatically and puts them on the timeline, so you can build the edit from the folder (for example add several clips one after another, each starting where the last ends). A video clip's sound is a separate linked audio clip on the Audio layer (listed with linkedTo): moving, trimming, splitting, speed changes and deleting one also change its partner. Output nothing outside the JSON object.
Action types:
{"type":"add_text","text":"...","start":0,"dur":3,"props":{"size":56,"color":"#ffffff","y":85,"bg":false}}
{"type":"add_asset","asset":"<asset name>","track":2,"start":0}   (track and start optional)
{"type":"set","clip":ID,"props":{...}}
{"type":"split","clip":ID,"at":T}   (clip optional: any clip at that time)
{"type":"delete","clip":ID}   {"type":"ripple_delete","clip":ID}
{"type":"move","clip":ID,"start":T,"track":N}   (track optional)
{"type":"select","clip":ID}   {"type":"seek","t":T}   {"type":"play"}   {"type":"pause"}
{"type":"track","index":N,"hidden":true,"muted":false}
{"type":"analyze_folder"}   (describe the media-folder files from their frames, so you can search by content)
{"type":"aspect","value":"16:9"}   (16:9, 1080p, 2k, 4k, cinema, cinema 4k, dci 4k, 9:16, 9:16 4k, 1:1, 4:5)
{"type":"transcribe","clip":ID,"language":"english","captions":true}   (clip and language optional; leave language out to auto-detect)
{"type":"detect_scenes","clip":ID,"split":false,"sensitivity":0.3}   (finds scene changes in a video clip, adds markers; split:true also cuts the clip there; clip optional)
{"type":"remove_silence","clip":ID,"minPause":0.6}   (cuts out pauses longer than minPause seconds from a clip with speech and closes the gaps; clip optional)
{"type":"find_highlights","clip":ID,"count":5}   (finds the most interesting moments from the loudness and the captions and adds markers; clip optional. For better picks transcribe first)
Props for set/add_text: start, dur, speed(0.25-4), vol(0-1), opacity(0-1), fadeIn, fadeOut (seconds),
 text clips: text, font(Default|Serif|Mono|Rounded|Impact|Sinhala), size, color(#rrggbb), bg(bool), bold(bool), x(0-100), y(0-100), rot(-180..180);
 picture clips: scale, px, py(-100..100), rot(-180..180), cropL, cropR, cropT, cropB(0-90), bright, contrast(0-200), sat(0-300), hue(0-360), gray, sepia(0-100), blur(0-30), exposure(-2..2 stops), highlights, shadows, temp (cool..warm), tint (green..magenta)(-100..100), gamma(0.5-2), tone(split toning 0-100), vignette, grain, sharpen, invert(0-100), preset (a look name such as kodak film, fuji film, teal and orange, bleach bypass, blade runner, matrix green, horror, day for night, golden hour, pastel (Wes Anderson), vhs retro, noir, cinematic, moody, vintage).
You cannot hear the media yourself, but for any request to transcribe, caption or subtitle speech you MUST use the transcribe action: the editor runs a speech-to-text model locally and adds the captions. If no clip is on the timeline it uses the first imported video or audio file. Otherwise, if asked to do something impossible, say so in "reply" with an empty actions list. Generating video from text or images, removing video backgrounds, face enhancement and eye contact correction are done by the user in the menu AI > AI Cloud tools (paid); you cannot run them: say so with an empty actions list. Never invent clip ids or asset names.`;

const chatHistory = [];
function chatSay(text, cls) {
  const d = mk('div', `msg ${cls}`);
  d.textContent = text;
  const log = $('#chat-log');
  log.append(d);
  log.scrollTop = log.scrollHeight;
}

function editorSnapshot() {
  return JSON.stringify({
    canvas: `${W}x${H}`, playhead: +state.t.toFixed(2), duration: +totalDur().toFixed(2), selected: state.sel,
    assets: [...state.assets.values()].map(a => ({ name: a.name, kind: a.kind, dur: +a.dur.toFixed(2) })),
    folder: folderFiles.filter(f => ![...state.assets.values()].some(a => a.name === f.name)).slice(0, 200).map(f => { const d = folderDescOf(f); return { name: f.name, kind: f.kind, mb: f.mb, ...(d ? { dur: d.dur, desc: d.desc, tags: d.tags } : {}) }; }),
    folderAnalyzed: `${folderFiles.filter(f => folderDescOf(f)).length} of ${folderFiles.filter(f => f.kind !== 'audio').length} video/image files described`,
    clips: state.clips.map(c => ({
      id: c.id, track: c.track, start: +c.start.toFixed(2), dur: +c.dur.toFixed(2), speed: spd(c),
      ...(c.text != null ? { text: c.text.slice(0, 120) } : { asset: assetOf(c).name, kind: clipKind(c), ...(c.link ? { linkedTo: state.clips.filter(o => o.link === c.link && o.id !== c.id).map(o => o.id) } : {}) }),
    })),
  });
}

const NUM_PROPS = {
  speed: [0.25, 4], vol: [0, 1], opacity: [0, 1], fadeIn: [0, 10], fadeOut: [0, 10], size: [8, 300], x: [0, 100], y: [0, 100],
  scale: [0.1, 4], px: [-100, 100], py: [-100, 100], rot: [-180, 180], cropL: [0, 90], cropR: [0, 90], cropT: [0, 90], cropB: [0, 90],
  bright: [0, 200], contrast: [0, 200], sat: [0, 300], hue: [0, 360], gray: [0, 100], sepia: [0, 100], blur: [0, 30],
  exposure: [-2, 2], highlights: [-100, 100], shadows: [-100, 100], gamma: [0.5, 2], temp: [-100, 100], tint: [-100, 100], tone: [0, 100], vignette: [0, 100], grain: [0, 100], sharpen: [0, 100], invert: [0, 100],
};
const TEXT_ONLY = new Set(['text', 'font', 'size', 'color', 'bg', 'bold', 'x', 'y']);
const VISUAL_ONLY = new Set(['scale', 'px', 'py', 'cropL', 'cropR', 'cropT', 'cropB', 'bright', 'contrast', 'sat', 'hue', 'gray', 'sepia', 'blur', 'exposure', 'highlights', 'shadows', 'gamma', 'temp', 'tint', 'tone', 'vignette', 'grain', 'sharpen', 'invert']);

function setProp(c, k, v) {
  const kind = clipKind(c), isMedia = kind === 'video' || kind === 'audio';
  if (TEXT_ONLY.has(k) && kind !== 'text') throw new Error(`"${k}" only applies to text clips`);
  if (VISUAL_ONLY.has(k) && (kind === 'text' || kind === 'audio')) throw new Error(`"${k}" only applies to picture clips`);
  if ((k === 'speed' || k === 'vol') && !isMedia) throw new Error(`"${k}" only applies to video/audio clips`);
  if (k === 'start') {
    if (typeof v !== 'number' || v < 0 || !fits(c, v, c.dur, c.track)) throw new Error('start would overlap another clip');
    c.start = v;
  } else if (k === 'dur') {
    const max = isMedia ? (assetOf(c).dur - c.in) / spd(c) : Infinity;
    if (typeof v !== 'number' || v < 0.1 || v > max + 1e-6 || !fits(c, c.start, v, c.track)) throw new Error('duration not possible here');
    c.dur = v;
  } else if (k === 'speed') {
    if (typeof v !== 'number') throw new Error('speed must be a number');
    v = Math.min(4, Math.max(0.25, v));
    const dur = c.dur * spd(c) / v;
    if (dur < 0.1 || dur > (assetOf(c).dur - c.in) / v + 1e-6 || !fits(c, c.start, dur, c.track)) throw new Error('speed change would not fit');
    kfRetime(c, dur / c.dur); c.dur = dur; c.speed = v;
  } else if (k in NUM_PROPS) {
    if (typeof v !== 'number' || isNaN(v)) throw new Error(`"${k}" must be a number`);
    c[k] = Math.min(NUM_PROPS[k][1], Math.max(NUM_PROPS[k][0], v));
  } else if (k === 'text') {
    c.text = String(v);
  } else if (k === 'color') {
    if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error('color must look like #ff0000');
    c.color = v;
  } else if (k === 'font') {
    const f = FONTS.find(([n]) => n.toLowerCase() === String(v).toLowerCase());
    if (!f) throw new Error('unknown font');
    c.font = f[1];
  } else if (k === 'bg' || k === 'bold') {
    c[k] = !!v;
  } else {
    throw new Error(`unknown property "${k}"`);
  }
}

async function chatExec(a) {
  const pick = () => {
    const c = a.clip != null ? state.clips.find(o => o.id === a.clip) : selClip();
    if (!c) throw new Error('clip not found');
    return c;
  };
  switch (a.type) {
    case 'add_text': {
      const dur = typeof a.dur === 'number' && a.dur > 0.1 ? a.dur : 3;
      let start = typeof a.start === 'number' ? Math.max(0, a.start) : state.t;
      if (!fits({ id: -1 }, start, dur, 0)) start = laneEnd(0);
      const c = newTextClip(String(a.text ?? ''), start, dur);
      state.clips.push(c);
      for (const [k, v] of Object.entries(a.props || {})) setProp(c, k, v);
      state.sel = c.id;
      break;
    }
    case 'add_asset': {
      const q = String(a.asset || '').toLowerCase();
      const as = [...state.assets.values()];
      let asset = as.find(x => x.name.toLowerCase() === q) || as.find(x => x.name.toLowerCase().includes(q));
      if (!asset) {   // not imported yet: look in the media folder and import it automatically
        const f = folderFind(q);
        if (f) asset = await importFromFolder(f);
      }
      if (!asset) throw new Error(`no imported media or media-folder file named "${a.asset}"`);
      const track = Number.isInteger(a.track) && a.track >= 0 && a.track < TRACKS.length ? a.track : defaultTrack(asset.kind);
      if (!laneOk(asset.kind, track)) throw new Error(`${asset.kind} cannot go on ${TRACKS[track].name}`);
      let start = typeof a.start === 'number' ? Math.max(0, a.start) : laneEnd(track);
      const c = addMediaClips(asset, track, start);
      state.sel = c.id;
      break;
    }
    case 'set': {
      const c = pick();
      for (const [k, v] of Object.entries(a.props || {})) {
        if (k === 'preset') {   // a named colour look
          const key = Object.keys(PRESETS).find(n => n.toLowerCase() === String(v).toLowerCase());
          if (!key || clipKind(c) === 'text' || clipKind(c) === 'audio') throw new Error(`unknown look "${v}" or not a picture clip`);
          Object.assign(c, PRESETS[key], { look: key });
        } else setProp(c, k, v);
      }
      syncLinked(c);
      break;
    }
    case 'split': {
      const t = typeof a.at === 'number' ? a.at : state.t;
      const c = a.clip != null ? pick() : state.clips.find(o => t > o.start + 0.05 && t < o.start + o.dur - 0.05);
      if (!c || !(t > c.start + 0.05 && t < c.start + c.dur - 0.05)) throw new Error('nothing to split at that time');
      const right = splitClip(c, t);
      if (isMediaClip(c)) splitCaptionsAt(t, new Set([c.id, right.id, ...partners(c).map(p => p.id), ...partners(right).map(p => p.id)]));
      state.sel = right.id;
      break;
    }
    case 'delete': { const c = pick(); removeClips([c]); if (!selClip()) state.sel = null; break; }
    case 'ripple_delete': {
      rippleRemove(pick());
      state.sel = null;
      break;
    }
    case 'move': {
      const c = pick();
      const track = Number.isInteger(a.track) ? a.track : c.track;
      const start = typeof a.start === 'number' ? Math.max(0, a.start) : c.start;
      if (track < 0 || track >= TRACKS.length || !laneOk(clipKind(c), track)) throw new Error('that clip cannot go on that track');
      if (!fits(c, start, c.dur, track)) throw new Error('move would overlap another clip');
      c.start = start; c.track = track;
      syncLinked(c);
      break;
    }
    case 'select': state.sel = pick().id; break;
    case 'seek': if (typeof a.t !== 'number') throw new Error('seek needs a time'); seek(a.t); break;
    case 'play': play(); break;
    case 'pause': pause(); break;
    case 'track': {
      const ts = trackState[a.index];
      if (!ts) throw new Error('no such track');
      if (typeof a.hidden === 'boolean') ts.hidden = a.hidden;
      if (typeof a.muted === 'boolean') ts.muted = a.muted;
      buildLabels();
      break;
    }
    case 'aspect': {
      const v = { '16:9': [1280, 720], '1080p': [1920, 1080], '2k': [2560, 1440], '4k': [3840, 2160], 'cinema': [1920, 804], 'cinema 4k': [3840, 1608], 'dci 4k': [4096, 2160], '9:16': [720, 1280], '9:16 4k': [2160, 3840], '1:1': [1080, 1080], '4:5': [1080, 1350] }[String(a.value).toLowerCase()];
      if (!v) throw new Error('aspect must be one of 16:9, 1080p, 2k, 4k, cinema, cinema 4k, dci 4k, 9:16, 9:16 4k, 1:1, 4:5');
      $('#aspect').value = v.join('x');
      $('#aspect').onchange({ target: $('#aspect') });
      break;
    }
    case 'analyze_folder': {
      if (!folderHandle) throw new Error('no media folder is open (use the Media folder button first)');
      const tag = mk('div', 'msg bot');
      $('#chat-log').append(tag);
      try { await analyzeFolder(m => { tag.textContent = m; $('#chat-log').scrollTop = $('#chat-log').scrollHeight; }); }
      finally { tag.remove(); }
      break;
    }
    case 'detect_scenes': case 'remove_silence': case 'find_highlights': return window.aiToolsChat(a, pick);
    case 'transcribe': return chatTranscribe(a, pick);
    default: throw new Error(`unknown action "${a.type}"`);
  }
}

async function chatTranscribe(a, pick) {
  const c = a.clip != null ? pick() : trClip();
  if (!c) throw new Error('import a video or audio file first');
  const tag = mk('div', 'msg bot');
  $('#chat-log').append(tag);
  const say = m => { tag.textContent = m; $('#chat-log').scrollTop = $('#chat-log').scrollHeight; };
  try {
    const lang = String(a.language || '').toLowerCase();
    // Sinhala: the Whisper model trained on Sinhala; large-v3 only as a fallback (it loops on Sinhala); browser models garble it
    const model = lang === 'sinhala' ? (sinhalaAsrReady ? 'local:sinhala' : localWhisperReady ? 'local:large-v3' : 'Xenova/whisper-base') : 'Xenova/whisper-base';
    const segs = await transcribeClips(a.clip != null ? [c] : trClips(), model, lang, say);
    trSegments = segs;
    $('#tr-text').value = segs.map(s => `[${fmt(s.start)}] ${s.text}`).join('\n');
    for (const id of ['tr-caps', 'tr-srt', 'tr-txt']) $('#' + id).disabled = !segs.length;
    if (!segs.length) throw new Error('no speech found');
    const added = a.captions === false ? 0 : addCaptionClips(segs);
    say(`Transcribed ${segs.length} lines${added ? ` and added ${added} captions` : ''}. The Transcript button has the text and SRT download.`);
  } catch (e) {
    tag.remove();
    throw e;
  }
}

async function chatSend() {
  const input = $('#chat-input'), btn = $('#chat-send');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  chatSay(msg, 'user');
  btn.disabled = true;
  const thinking = mk('div', 'msg bot');
  thinking.textContent = '…';
  $('#chat-log').append(thinking);
  try {
    const convo = chatHistory.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
    let note = '', lastReply = '';
    for (let round = 0; round < 2; round++) {
      const prompt = `Editor state:\n${editorSnapshot()}\n\nRecent conversation:\n${convo || '(none)'}\n\nUser request: ${msg}${note}`;
      const raw = await askClaude(CHAT_SYSTEM, prompt);
      const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
      const acts = Array.isArray(j.actions) ? j.actions : [];
      const before = JSON.stringify(state.clips);
      pushHistory();
      const errors = [];
      for (const a of acts) {
        try { await chatExec(a); } catch (e) { errors.push(`${a.type}: ${e.message}`); }
      }
      if (JSON.stringify(state.clips) === before) state.history.pop();
      afterEdit();
      lastReply = String(j.reply || 'Done.');
      if (errors.length) chatSay('Could not do:\n' + errors.join('\n'), 'err');
      if (round === 0 && acts.some(a => a.type === 'analyze_folder') && !errors.length) {
        chatSay(lastReply, 'bot');   // "Looking at your clips first…"
        note = '\n(System note: the media folder has now been analyzed, see desc and tags in the editor state. Carry out the user request now. Do not output analyze_folder again.)';
        continue;
      }
      break;
    }
    thinking.remove();
    chatSay(lastReply, 'bot');
    chatHistory.push({ role: 'User', text: msg }, { role: 'Assistant', text: lastReply });
  } catch (e) {
    thinking.remove();
    chatSay('Error: ' + e.message, 'err');
  }
  btn.disabled = false;
}

$('#chat-send').onclick = chatSend;
$('#chat-input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); } });
chatSay('Tell me what to edit, for example "add the title Welcome for 4 seconds" or "make the first clip 2x faster". Each request can be undone with Cmd+Z.', 'bot');


// ---------- Bridge to the MCP connector (opencut_mcp.py): runs commands queued by server.py ----------
const BRIDGE_OPS = {
  help: async () => CHAT_SYSTEM,
  get_state: async () => JSON.parse(editorSnapshot()),
  run_actions: async ({ actions }) => {
    if (!Array.isArray(actions)) throw new Error('actions must be a list');
    const before = JSON.stringify(state.clips), errors = [];
    pushHistory();
    for (const a of actions) {
      try { await chatExec(a); } catch (e) { errors.push(`${a && a.type}: ${e.message}`); }
    }
    if (JSON.stringify(state.clips) === before) state.history.pop();
    afterEdit();
    return { errors, state: JSON.parse(editorSnapshot()) };
  },
  undo: async () => { undo(); return JSON.parse(editorSnapshot()); },
  redo: async () => { redo(); return JSON.parse(editorSnapshot()); },
  screenshot: async ({ t }) => {
    if (typeof t === 'number') seek(Math.max(0, Math.min(totalDur(), t)));
    await new Promise(r => setTimeout(r, 400));   // let the video element show the frame
    draw();
    return { mime: 'image/jpeg', b64: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], t: +state.t.toFixed(2) };
  },
};
(async function bridgeLoop() {
  for (;;) {
    try {
      const r = await fetch('/api/bridge/next');
      if (r.status === 200) {
        const cmd = await r.json();
        let out;
        try {
          if (exporting) throw new Error('The editor is exporting; try again when it is done.');
          const op = BRIDGE_OPS[cmd.op];
          if (!op) throw new Error('unknown op ' + cmd.op);
          out = { id: cmd.id, ok: true, result: await op(cmd.args || {}) };
        } catch (e) { out = { id: cmd.id, ok: false, error: e.message }; }
        await fetch('/api/bridge/result', { method: 'POST', body: JSON.stringify(out) });
      } else if (r.status !== 204) await new Promise(r2 => setTimeout(r2, 3000));
    } catch { await new Promise(r2 => setTimeout(r2, 3000)); }
  }
})();


// ---------- Transcript (Whisper in the browser, see transcribe.js) ----------
let trSegments = [];   // [{start,end,text}] in timeline seconds

function srtTime(s) {
  const ms = Math.round(s * 1000);
  const p = (n, w) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)},${p(ms % 1000, 3)}`;
}
function download(name, text) {
  const a = mk('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  a.download = name;
  a.click();
}
function trClip() {
  const c = selClip();
  if (c && c.text == null && clipKind(c) !== 'image') return c;
  const onTimeline = state.clips.filter(o => o.text == null && clipKind(o) !== 'image' && !o.silent).sort((a, b) => a.start - b.start)[0];
  if (onTimeline) return onTimeline;
  // nothing on the timeline: use the first imported video/audio file, whole length
  const a = [...state.assets.values()].find(x => x.kind !== 'image');
  return a ? { id: -1, assetId: a.id, start: 0, in: 0, dur: a.dur, speed: 1 } : null;
}

// Every clip to transcribe: the selected clip if any, otherwise all video/audio clips on the timeline in order.
function trClips() {
  const c = selClip();
  if (c && c.text == null && clipKind(c) !== 'image') return [c];
  const all = state.clips.filter(o => o.text == null && clipKind(o) !== 'image' && !o.silent).sort((a, b) => a.start - b.start);
  if (all.length) return all;
  const one = trClip();
  return one ? [one] : [];
}
async function transcribeClips(cs, model, language, onStatus) {
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const tag = cs.length > 1 ? `Clip ${i + 1}/${cs.length}: ` : '';
    try { out.push(...await transcribeClip(cs[i], model, language, m => onStatus(tag + m))); }
    catch (e) { if (cs.length === 1 || !/No audio/.test(e.message)) throw e; }
  }
  return out;
}

// Decode the part of the clip that is on the timeline to 16 kHz mono, which is what Whisper expects.
async function clipAudio(c) {
  const a = assetOf(c);
  const buf = await (await fetch(a.url)).arrayBuffer();
  const ac = new AudioContext({ sampleRate: 16000 });
  let decoded;
  try { decoded = await ac.decodeAudioData(buf); }
  catch { throw new Error('This browser could not read audio from the file.'); }
  finally { ac.close(); }
  const ch = decoded.numberOfChannels, n = decoded.length;
  const mono = new Float32Array(n);
  for (let i = 0; i < ch; i++) { const d = decoded.getChannelData(i); for (let j = 0; j < n; j++) mono[j] += d[j] / ch; }
  const from = Math.floor(c.in * 16000), to = Math.min(n, Math.floor((c.in + c.dur * spd(c)) * 16000));
  return mono.subarray(from, to);
}

const LANG_CODES = { english: 'en', sinhala: 'si', tamil: 'ta', hindi: 'hi', chinese: 'zh', spanish: 'es', french: 'fr', german: 'de', japanese: 'ja' };

// Large-v3 runs in a Python process on this Mac (via server.py), much more accurate than the in-browser models.
async function localWhisper(audio, model, language, onStatus) {
  const pcm = new Int16Array(audio.length);
  for (let i = 0; i < audio.length; i++) pcm[i] = Math.max(-1, Math.min(1, audio[i])) * 32767;
  onStatus(`Running Whisper ${model} on this Mac… long clips take a while. Keep this tab open.`);
  const r = await fetch(`/api/transcribe?model=${model}&lang=${LANG_CODES[language] || ''}`, { method: 'POST', body: pcm });
  const j = await r.json().catch(() => ({ error: 'Unreadable reply. Open the editor through server.py.' }));
  if (!r.ok) throw new Error(j.error);
  return j.segments;
}

async function transcribeClip(c, model, language, onStatus) {
  if (!window.whisperTranscribe) throw new Error('The speech model code is still loading (or could not load, check your internet connection). Try again in a moment.');
  onStatus('Reading audio…');
  const audio = await clipAudio(c);
  if (audio.length < 1600) throw new Error('No audio in this clip.');
  let segs = model.startsWith('local:') ? await localWhisper(audio, model.slice(6), language, onStatus)
    : await window.whisperTranscribe(audio, { model, language }, onStatus);
  segs = await labelSpeakers(audio, segs, onStatus);
  return segs.map(s => ({ start: c.start + s.start / spd(c), end: c.start + s.end / spd(c), text: s.text, speaker: s.speaker }));
}

// Who speaks each line: voice fingerprints + clustering on this Mac (server.py). A failure never loses the transcript.
async function labelSpeakers(audio, segs, onStatus) {
  const on = $('#tr-spk')?.checked;
  if (!on || !segs.length) return segs;
  if (!speakerDetectReady) { onStatus('Speaker labels skipped: the server is outdated. Restart LexCut (Stop LexCut, then open it again).'); await new Promise(r => setTimeout(r, 2500)); return segs; }
  try {
    onStatus('Recognizing who is speaking…');
    const pcm = new Int16Array(audio.length);
    for (let i = 0; i < audio.length; i++) pcm[i] = Math.max(-1, Math.min(1, audio[i])) * 32767;
    const head = new TextEncoder().encode(JSON.stringify(segs.map(s => ({ start: s.start, end: s.end }))) + '\n');
    const r = await fetch(`/api/diarize?speakers=${$('#tr-spk-n').value}`, { method: 'POST', body: new Blob([head, pcm.buffer]) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error);
    if (j.prints) trPrints = j.prints;
    for (const [n, name] of Object.entries(j.matches || {})) if (!trNames[n] && !Object.values(trNames).includes(name)) trNames[n] = name;   // saved Voice Studio voices recognised
    return segs.map((s, i) => ({ ...s, speaker: j.speakers[i] }));
  } catch (e) { onStatus('Speaker labels skipped: ' + e.message); await new Promise(r => setTimeout(r, 1500)); return segs; }
}
let trNames = {};
let trPrints = {};   // speaker number -> voice print from the last detection (sent to the server when you name a person)   // speaker number -> chosen name, e.g. {1: 'Nissanka'}
const nameOf = n => trNames[n] || `Person ${n}`;
const spkName = s => s.speaker ? nameOf(s.speaker) : '';
const spkPrefix = s => s.speaker ? `[${spkName(s)}] ` : '';
const trLine = s => `[${fmt(s.start)}] ${spkPrefix(s)}${s.text}`;
const trOut = s => ($('#tr-spk-out')?.checked ? spkPrefix(s) : '') + s.text;

function addCaptionClips(segs) {
  let added = 0;
  for (const s of segs) {
    const dur = Math.max(0.3, s.end - s.start);
    if (!fits({ id: -1 }, s.start, dur, 0)) continue;
    const c = newTextClip(s.text, s.start, dur);
    if (s.speaker) c.speaker = spkName(s);
    c.size = Math.round(H / 20); c.bg = true; c.y = 88;
    state.clips.push(c);
    added++;
  }
  return added;
}

async function runTranscript() {
  const c = trClip(), status = $('#tr-status'), run = $('#tr-run');
  if (!c) { status.textContent = 'Import a video or audio file first.'; return; }
  run.disabled = true;
  $('#tr-text').value = ''; trNames = {};
  try {
    const lang = $('#tr-lang').value;
    let model = $('#tr-model').value;
    if (lang === 'sinhala' && sinhalaAsrReady && model !== 'local:sinhala') { model = 'local:sinhala'; $('#tr-model').value = model; }
    else if (lang === 'sinhala' && !sinhalaAsrReady && localWhisperReady && model !== 'local:large-v3') { model = 'local:large-v3'; $('#tr-model').value = model; }
    if (model === 'local:sinhala' && lang !== 'sinhala') { status.textContent = 'The Sinhala Whisper model only understands Sinhala. Choose Sinhala as the language, or another model.'; run.disabled = false; return; }
    if (lang === 'sinhala' && model !== 'local:sinhala') status.textContent = 'Warning: Sinhala is inaccurate with this model. Run ./install.sh to get the Sinhala Whisper model.';
    trSegments = await transcribeClips(trClips(), model, lang, m => { status.textContent = m; });
    $('#tr-text').value = trSegments.map(trLine).join('\n');
    $('#tr-text').readOnly = false;
    renderNames();
    status.textContent = trSegments.length ? `Done: ${trSegments.length} lines.` + (lang === 'sinhala' ? ' Tip: “Fix grammar & style with Claude” below corrects misheard Sinhala words.' : '') : 'No speech found.';
  } catch (e) {
    status.textContent = 'Error: ' + e.message;
  }
  for (const id of ['tr-caps', 'tr-srt', 'tr-txt']) $('#' + id).disabled = !trSegments.length;
  run.disabled = false;
}

// "Who is who": rename Person 1, Person 2… to a saved Voice Studio voice or any name you type.
const esc = t => String(t ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
let studioVoices = [];
const loadStudioVoices = () => fetch('/api/voice/voices').then(r => r.json()).then(j => { studioVoices = (j.voices || []).map(v => v.name); $('#tr-voices').innerHTML = studioVoices.map(n => `<option value="${esc(n)}">`).join(''); }).catch(() => {});
function renderNames() {
  const nums = [...new Set(trSegments.map(s => s.speaker).filter(Boolean))].sort((a, b) => a - b), box = $('#tr-names');
  box.hidden = !nums.length;
  box.innerHTML = nums.length ? '<span class="muted">Who is who (choose a Voice Studio voice, or add a new name):</span>' + nums.map(n =>
    `<div class="tr-who"><span>Person ${n} →</span><select data-n="${n}">${speakerChoices(trNames[n] || '', `Person ${n} (no name)`, false)}</select></div>`).join('') : '';
  for (const sel of box.querySelectorAll('select')) {
    sel.onchange = () => {
      const n = +sel.dataset.n;
      if (sel.value === '__new') { const name = askNewSpeaker(sel, trNames[n]); if (name === null) return; renameSpeaker(n, name); }
      else renameSpeaker(n, sel.value);
    };
  }
}
function renameSpeaker(n, name) {
  const cur = trCurrent();                       // keep any text edits, read with the OLD names
  if (name && Object.entries(trNames).some(([k, v]) => +k !== n && v === name)) { $('#tr-status').textContent = `“${name}” is already used by another person.`; renderNames(); return; }
  if (/^Person \d+$/.test(name) || !name) delete trNames[n]; else trNames[n] = name;
  if (name && !/^Person \d+$/.test(name) && trPrints[n] && $('#tr-remember')?.checked)
    fetch('/api/diarize/remember', { method: 'POST', body: JSON.stringify({ name, print: trPrints[n] }) }).then(r => r.json()).then(j => { if (j.saved) $('#tr-status').textContent = `Remembered ${name}’s voice from this video (${j.saved} saved). Next videos will recognise it.`; }).catch(() => {});
  trSegments = cur;
  $('#tr-text').value = trSegments.map(trLine).join('\n');
  renderNames();
  window.dispatchEvent(new Event('tr-names'));
}
// The textarea can be edited; read the lines back (timestamps are kept from the segments in order).
function trCurrent() {
  const lines = $('#tr-text').value.split('\n').filter(l => l.trim());
  if (lines.length !== trSegments.length) return trSegments;
  return trSegments.map((s, i) => {
    let t = lines[i].replace(/^\[[^\]]*\]\s*/, '');
    let sp = trSegments.some(x => x.speaker) ? s.speaker : undefined;
    const m = t.match(/^\[([^\]]{1,40})\]\s*/) || t.match(/^(.{1,40}?):\s+/);   // [Person 1] text (older "Person 1: text" still read)
    if (m) {
      const label = m[1].trim(), pm = label.match(/^person\s*(\d+)$/i);
      const hit = pm ? +pm[1] : +(Object.keys(trNames).find(k => trNames[k].toLowerCase() === label.toLowerCase()) || 0);
      if (hit) { sp = hit; t = t.slice(m[0].length); }
    }
    return { ...s, text: t.trim(), speaker: sp };
  });
}

$('#btn-tr').onclick = () => {
  const c = trClip();
  const cs = trClips();
  $('#tr-clip').textContent = cs.length > 1 ? `Source: ${cs.length} clips on the timeline (select one clip to transcribe only that)` : c ? `Source: ${assetOf(c).name} (${fmt(c.dur)} of audio)` : 'Import a video or audio file first.';
  loadStudioVoices(); renderNames();
  $('#tr-dialog').showModal();
};
$('#tr-close').onclick = () => $('#tr-dialog').close();
$('#tr-lang').onchange = e => { if (e.target.value === 'sinhala') { if (sinhalaAsrReady) $('#tr-model').value = 'local:sinhala'; else if (localWhisperReady) $('#tr-model').value = 'local:large-v3'; } else if ($('#tr-model').value === 'local:sinhala') $('#tr-model').value = localWhisperReady ? 'local:large-v3' : 'Xenova/whisper-base'; };
$('#tr-run').onclick = runTranscript;
let localWhisperReady = false;
let speakerDetectReady = false;
let sinhalaAsrReady = false;
fetch('/api/status').then(r => r.json()).then(j => { localWhisperReady = !!j.whisper; speakerDetectReady = !!j.speakers; sinhalaAsrReady = !!j.sinhala; }).catch(() => {});
$('#tr-caps').onclick = () => {
  pushHistory();
  const added = addCaptionClips(trCurrent());
  afterEdit();
  $('#tr-status').textContent = `Added ${added} caption clips on the Text track.`;
};
$('#tr-srt').onclick = () => download('transcript.srt', trCurrent().map((s, i) => `${i + 1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text}\n`).join('\n'));
$('#tr-txt').onclick = () => download('transcript.txt', trCurrent().map(trOut).join('\n'));



// ---------- autosave: the project and its media survive a page refresh (IndexedDB) ----------
const DB = new Promise((res, rej) => {
  const rq = indexedDB.open('opencut', 1);
  rq.onupgradeneeded = () => { rq.result.createObjectStore('kv'); rq.result.createObjectStore('media'); };
  rq.onsuccess = () => res(rq.result);
  rq.onerror = () => rej(rq.error);
});
const idb = async (store, mode, fn) => {
  const db = await DB;
  return new Promise((res, rej) => {
    const tx = db.transaction(store, mode), r = fn(tx.objectStore(store));
    tx.oncomplete = () => res(r && r.result);
    tx.onerror = () => rej(tx.error);
  });
};

function projectSnapshot() {
  return JSON.stringify({
    nextId, w: W, h: H, t: state.t, pps: state.pps, aspect: $('#aspect').value,
    assets: [...state.assets.keys()],
    clips: state.clips, markers: state.markers, tracks: TRACKS, laneOrder: LANE_ORDER, activeTrack, trackState,
  });
}
let lastSaved = null, storedMedia = new Set(), restoring = true;
// Several LexCut tabs share one saved project. Each save bumps a revision number ('rev'); a tab only saves
// when the stored revision is still the one it loaded or last wrote. A tab that fell behind stops saving
// (so it cannot overwrite newer work from another tab, or delete that tab's media) and shows a banner.
let myRev = 0, staleTab = false, mediaWarned = new Set();
const saveChan = 'BroadcastChannel' in window ? new BroadcastChannel('opencut-autosave') : null;
const tabId = Math.random().toString(36).slice(2);
function markStale() {
  if (staleTab) return;
  staleTab = true;
  let b = document.getElementById('stale-banner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'stale-banner';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100000;background:#b3261e;color:#fff;padding:10px 16px;font:14px -apple-system,sans-serif;display:flex;gap:12px;align-items:center;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.4)';
    b.innerHTML = '<b style="flex:1;min-width:240px">This project was changed in another LexCut tab. This tab has stopped saving so it does not overwrite that work.</b>'
      + '<button type="button" id="stale-reload" style="padding:6px 12px">Reload to get the latest version</button>'
      + '<button type="button" id="stale-keep" style="padding:6px 12px" title="Saves this tab over the other tab\'s changes">Keep this tab\'s version instead</button>';
    document.body.append(b);
    b.querySelector('#stale-reload').onclick = () => location.reload();
    b.querySelector('#stale-keep').onclick = async () => {
      if (!confirm('Save this tab\'s version? Changes made in the other tab since then will be replaced.')) return;
      myRev = (await idb('kv', 'readonly', st => st.get('rev'))) || 0;
      staleTab = false; lastSaved = null; b.remove(); autosave();
    };
  }
}
if (saveChan) saveChan.onmessage = e => { if (e.data && e.data.tab !== tabId && e.data.rev !== myRev && !restoring) markStale(); };
// write the snapshot only if nobody else saved since our last read or write (one transaction, so two tabs cannot both win)
async function putIfCurrent(snap) {
  const db = await DB;
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite'), st = tx.objectStore('kv'), g = st.get('rev');
    let ok = false;
    g.onsuccess = () => { if ((g.result || 0) === myRev) { ok = true; st.put(snap, 'project'); st.put(myRev + 1, 'rev'); } };
    tx.oncomplete = () => res(ok);
    tx.onerror = () => rej(tx.error);
  });
}
async function autosave() {
  if (restoring || staleTab) return;
  const snap = projectSnapshot();
  if (snap === lastSaved) return;
  try {
    const rev = (await idb('kv', 'readonly', st => st.get('rev'))) || 0;
    if (rev !== myRev) return markStale();
    for (const a of state.assets.values()) {   // one file that cannot be stored must not stop the project itself from saving
      if (storedMedia.has(a.id)) continue;
      try { await idb('media', 'readwrite', st => st.put({ file: a.file, name: a.name, type: a.file.type }, a.id)); storedMedia.add(a.id); mediaWarned.delete(a.id); }
      catch (e) {
        console.warn('LexCut could not store media', a.name, e);
        if (!mediaWarned.has(a.id)) { mediaWarned.add(a.id); toast(`Could not save "${a.name}" in the browser (${e.name || 'error'}). The project is saved, but this file will be missing after a reload. Use File → Save project to keep a copy.`); }
      }
    }
    for (const id of [...storedMedia]) {
      if (!state.assets.has(id)) { await idb('media', 'readwrite', st => st.delete(id)); storedMedia.delete(id); }
    }
    if (!(await putIfCurrent(snap))) return markStale();
    myRev++;
    lastSaved = snap;
    if (saveChan) saveChan.postMessage({ tab: tabId, rev: myRev });
  } catch (e) { console.warn('LexCut autosave failed:', e); }
}
setInterval(autosave, 1000);
addEventListener('visibilitychange', autosave);

async function restoreProject() {
  try {
    myRev = (await idb('kv', 'readonly', st => st.get('rev'))) || 0;   // the revision this tab starts from
    const snap = await idb('kv', 'readonly', st => st.get('project'));
    if (!snap) return;
    const d = JSON.parse(snap);
    for (const id of d.assets || []) {
      const m = await idb('media', 'readonly', st => st.get(id));
      if (!m) continue;
      try { const a = await loadAsset(new File([m.file], m.name, { type: m.type }), id); state.assets.set(id, a); storedMedia.add(id); }
      catch (e) { console.warn('could not restore', m.name, e); }
    }
    if (Array.isArray(d.tracks) && d.tracks.length >= 4) {
      TRACKS.length = 0; TRACKS.push(...d.tracks);
      LANE_ORDER.length = 0; LANE_ORDER.push(...d.laneOrder);
      trackState.length = 0; trackState.push(...(d.trackState || TRACKS.map(() => ({ hidden: false, muted: false, vol: 1, pan: 0, solo: false }))));
      for (const k of Object.keys(activeTrack)) delete activeTrack[k];
      Object.assign(activeTrack, d.activeTrack || {});
    }
    state.clips = (d.clips || []).filter(c => c.assetId == null || state.assets.has(c.assetId));
    const dropped = (d.clips || []).length - state.clips.length;
    if (dropped) setTimeout(() => toast(`${dropped} clip${dropped > 1 ? 's' : ''} could not be restored because ${dropped > 1 ? 'their media files are' : 'its media file is'} missing.`), 1500);
    state.markers = Array.isArray(d.markers) ? d.markers : [];
    nextId = Math.max(nextId, d.nextId || 1, ...state.clips.map(c => c.id + 1), ...state.assets.keys());
    if (d.aspect) $('#aspect').value = d.aspect;
    setAspect(d.w || 1280, d.h || 720);
    if (d.pps) { state.pps = d.pps; $('#zoom').value = d.pps; }
    state.sel = null;
    buildLabels(); renderBin(); afterEdit();
    seek(Math.min(d.t || 0, totalDur()));
  } catch (e) { console.warn('LexCut restore failed:', e); }
}
restoreProject().finally(() => { restoring = false; });


// ---------- resizable panels: drag the thin bars between the panels (double-click a bar to reset it) ----------
(() => {
  const KEY = 'opencut-layout';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* ignore */ }
  const root = document.documentElement;
  for (const [k, v] of Object.entries(saved)) root.style.setProperty('--' + k, v + 'px');
  const save = (k, v) => { if (v == null) delete saved[k]; else saved[k] = Math.round(v); localStorage.setItem(KEY, JSON.stringify(saved)); };

  // name: css variable, dir: 'x' or 'y', sign: +1 when dragging right/down makes the panel bigger
  function splitter({ parent, name, dir, sign, size, min, max, style }) {
    const h = mk('div', `splitter ${dir === 'x' ? 'v' : 'h'}`);
    Object.assign(h.style, style);
    h.title = 'Drag to resize, double-click to reset';
    h.onpointerdown = e => {
      e.preventDefault();
      try { h.setPointerCapture(e.pointerId); } catch { /* synthetic events have no pointer to capture */ }
      h.classList.add('active');
      const start = size(), p0 = dir === 'x' ? e.clientX : e.clientY;
      const move = ev => {
        const d = ((dir === 'x' ? ev.clientX : ev.clientY) - p0) * sign;
        const v = Math.max(min, Math.min(max(), start + d));
        root.style.setProperty('--' + name, v + 'px');
        save(name, v);
        draw();
      };
      const up = () => {
        h.classList.remove('active');
        h.removeEventListener('pointermove', move);
        h.removeEventListener('pointerup', up);
        h.removeEventListener('pointercancel', up);
        renderTimeline(); draw();
      };
      h.addEventListener('pointermove', move);
      h.addEventListener('pointerup', up);
      h.addEventListener('pointercancel', up);
    };
    h.ondblclick = () => { root.style.removeProperty('--' + name); save(name, null); renderTimeline(); draw(); };
    parent.append(h);
  }
  const w = sel => () => $(sel).getBoundingClientRect().width, ht = sel => () => $(sel).getBoundingClientRect().height;
  splitter({ parent: $('main'), name: 'left', dir: 'x', sign: 1, size: w('#left'), min: 160, max: () => innerWidth * 0.5, style: { left: 'calc(var(--left, 300px) - 3px)' } });
  splitter({ parent: $('main'), name: 'right', dir: 'x', sign: -1, size: w('#inspector'), min: 230, max: () => innerWidth * 0.5, style: { right: 'calc(var(--right, 260px) - 3px)' } });
  splitter({ parent: $('#chat'), name: 'chat', dir: 'y', sign: -1, size: ht('#chat'), min: 90, max: () => $('#left').getBoundingClientRect().height - 100, style: { top: '-3px' } });
  splitter({ parent: $('#timeline'), name: 'tl', dir: 'y', sign: -1, size: ht('#timeline'), min: 110, max: () => innerHeight * 0.75, style: { top: '-3px' } });
  splitter({ parent: $('#timeline'), name: 'labels', dir: 'x', sign: 1, size: w('#labels'), min: 90, max: () => 420, style: { left: 'calc(var(--labels, 190px) - 3px)' } });
})();


// ---------- new project ----------
function newProject(keepMedia) {
  pause();
  if (!keepMedia) {
    for (const a of state.assets.values()) { if (a.el && a.el.pause) a.el.pause(); if (a.aEl) a.aEl.pause(); URL.revokeObjectURL(a.url); }
    state.assets.clear();
  }
  state.clips = []; state.markers = []; state.sel = null; state.multi = []; state.history = []; state.future = []; state.t = 0;
  TRACKS.length = 0;
  TRACKS.push({ name: 'Text', kind: 'text' }, { name: 'Video 2', kind: 'video' }, { name: 'Video 1', kind: 'video' }, { name: 'Audio', kind: 'audio' });
  LANE_ORDER.length = 0; LANE_ORDER.push(0, 1, 2, 3);
  trackState.length = 0; TRACKS.forEach(() => trackState.push({ hidden: false, muted: false, vol: 1, pan: 0, solo: false }));
  for (const k of Object.keys(activeTrack)) delete activeTrack[k];
  trSegments = [];
  $('#aspect').value = '1280x720';
  setAspect(1280, 720);
  buildLabels(); renderBin(); renderTimeline(); renderInspector(); updateTime(); draw();
}
$('#btn-new').onclick = () => { $('#np-keep').checked = false; $('#np-dialog').showModal(); };
$('#np-cancel').onclick = () => $('#np-dialog').close();
$('#np-save').onclick = () => { saveProject(); };
$('#np-yes').onclick = () => { $('#np-dialog').close(); newProject($('#np-keep').checked); };


// ---------- media folder: pick a folder, list its media, and let Claude add files to the timeline ----------
const EXT_KIND = { mp4: 'video', mov: 'video', m4v: 'video', webm: 'video', mkv: 'video', avi: 'video', mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', ogg: 'audio', flac: 'audio', png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image' };
const EXT_MIME = { mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', flac: 'audio/flac', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };
let folderHandle = null, folderFiles = [], folderState = '';   // folderFiles: {name, path, kind, mb, handle}

async function scanFolder(dir, path = '', depth = 0) {
  const out = [];
  for await (const [name, h] of dir.entries()) {
    if (name.startsWith('.')) continue;
    if (h.kind === 'directory') { if (depth < 2) out.push(...await scanFolder(h, path + name + '/', depth + 1)); continue; }
    const ext = name.split('.').pop().toLowerCase();
    if (!EXT_KIND[ext]) continue;
    let size = 0, mtime = 0;
    try { const f = await h.getFile(); size = f.size; mtime = f.lastModified; } catch { /* ignore */ }
    out.push({ name, path: path + name, kind: EXT_KIND[ext], mb: Math.round(size / 1048576), size, mtime, handle: h });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
}
async function refreshFolder() {
  if (!folderHandle) return;
  try { folderFiles = await scanFolder(folderHandle); folderState = ''; }
  catch (e) { folderFiles = []; folderState = 'Could not read the folder: ' + e.message; }
  renderFolder();
}
function folderFind(q) {
  q = q.toLowerCase();
  return folderFiles.find(f => f.name.toLowerCase() === q || f.path.toLowerCase() === q) || folderFiles.find(f => f.name.toLowerCase().includes(q));
}
async function importFromFolder(f) {
  const have = [...state.assets.values()].find(a => a.name === f.name);
  if (have) return have;
  const file = await f.handle.getFile();
  const ext = f.name.split('.').pop().toLowerCase();
  const a = await loadAsset(file.type ? file : new File([file], file.name, { type: EXT_MIME[ext] }), uid());
  state.assets.set(a.id, a);
  renderBin();
  return a;
}
function renderFolder() {
  const box = $('#folder-box');
  box.innerHTML = '';
  if (!folderHandle) return;
  const head = mk('div', 'folder-head');
  const title = mk('b');
  title.textContent = `Folder: ${folderHandle.name} (${folderFiles.length})`;
  const rf = mk('button', 'tg'); rf.textContent = 'Refresh'; rf.onclick = refreshFolder;
  const cl = mk('button', 'tg'); cl.textContent = 'Close'; cl.title = 'Stop using this folder';
  cl.onclick = async () => { folderHandle = null; folderFiles = []; await idb('kv', 'readwrite', st => st.delete('folder')).catch(() => {}); renderFolder(); };
  const an = mk('button', 'tg');
  const left = folderFiles.filter(f => f.kind !== 'audio' && !folderDescOf(f)).length;
  an.textContent = analyzing ? 'Stop' : left ? `Analyze (${left})` : 'Re-analyze';
  an.title = 'Let Claude look at frames from each clip and write a short description, so you can ask for clips by what is in them';
  an.onclick = async () => {
    if (analyzing) { analyzeStop = true; return; }
    const msg = mk('p', 'muted'); box.append(msg);
    try { await analyzeFolder(m => { msg.textContent = m; }, left > 0); } catch (e) { alert('Could not analyze: ' + e.message); }
  };
  head.append(title, an, rf, cl);
  box.append(head);
  if (folderState) { const p = mk('p', 'muted'); p.textContent = folderState; box.append(p); }
  for (const f of folderFiles) {
    const row = mk('div', 'asset');
    const meta = mk('div', 'meta');
    meta.innerHTML = '<div class="name"></div><div class="dur"></div>';
    meta.firstChild.textContent = f.path;
    meta.lastChild.textContent = `${f.kind} · ${f.mb} MB${[...state.assets.values()].some(a => a.name === f.name) ? ' · imported' : ''}`;
    const add = mk('button', 'tg'); add.textContent = '+'; add.title = 'Add to the timeline';
    const go = async () => { try { addAssetAtEnd(await importFromFolder(f)); renderFolder(); } catch (e) { alert(`Could not load ${f.name}: ${e.message}`); } };
    add.onclick = go;
    row.ondblclick = go;
    const d = folderDescOf(f);
    if (d) { const t = mk('div', 'desc'); t.textContent = d.desc + (d.tags.length ? `  [${d.tags.join(', ')}]` : ''); meta.append(t); }
    row.append(meta, add);
    box.append(row);
  }
  if (!folderFiles.length && !folderState) { const p = mk('p', 'muted'); p.textContent = 'No video, audio or image files found in this folder.'; box.append(p); }
}
async function pickFolder() {
  if (!window.showDirectoryPicker) { alert('Picking a folder needs Chrome or Edge.'); return; }
  try {
    folderHandle = await showDirectoryPicker({ mode: 'read' });
    await idb('kv', 'readwrite', st => st.put(folderHandle, 'folder')).catch(() => {});
    await refreshFolder();
  } catch (e) { if (e.name !== 'AbortError') alert('Could not open the folder: ' + e.message); }
}
$('#btn-folder').onclick = pickFolder;
// after a reload: reopen the remembered folder (the browser may ask once more for permission, shown as a Reconnect button)
(async () => {
  try {
    const h = await idb('kv', 'readonly', st => st.get('folder'));
    if (!h) return;
    folderHandle = h;
    if ((await h.queryPermission({ mode: 'read' })) === 'granted') await refreshFolder();
    else {
      renderFolder();
      const b = mk('button'); b.textContent = `Reconnect to "${h.name}"`;
      b.onclick = async () => { if ((await h.requestPermission({ mode: 'read' })) === 'granted') await refreshFolder(); };
      $('#folder-box').append(b);
    }
  } catch { /* no remembered folder */ }
})();


// ---------- let Claude "look" at the folder: sample frames from each clip, ask for a short description, cache it ----------
let folderDesc = {};   // path -> {key, desc, tags, dur}
let analyzing = false, analyzeStop = false;
lutLoad();
idb('kv', 'readonly', st => st.get('folderDesc')).then(d => { if (d) { folderDesc = d; renderFolder(); } }).catch(() => {});
const folderKey = f => `${f.size}|${f.mtime}`;
const folderDescOf = f => { const d = folderDesc[f.path]; return d && d.key === folderKey(f) ? d : null; };

function shot(src, w, h, max = 384) {
  const k = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.6).split(',')[1];
}
async function grabFrames(file, kind) {
  const url = URL.createObjectURL(file);
  try {
    if (kind === 'image') { const img = new Image(); img.src = url; await img.decode(); return { frames: [shot(img, img.naturalWidth, img.naturalHeight, 512)], dur: 0 }; }
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.src = url;
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('cannot decode')); });
    let d = v.duration;
    if (!isFinite(d)) {   // some recordings (webm) do not store their length: seeking far ahead reveals it
      await new Promise(r => { const to = setTimeout(r, 8000); v.onseeked = v.ondurationchange = () => { if (isFinite(v.duration)) { clearTimeout(to); r(); } }; v.currentTime = 1e6; });
      d = isFinite(v.duration) ? v.duration : 1;
    }
    const frames = [];
    for (const f of d < 3 ? [0.5] : [0.12, 0.5, 0.88]) {
      const t = Math.max(0, Math.min(d - 0.05, d * f));
      await new Promise(r => { const to = setTimeout(r, 8000); v.onseeked = () => { clearTimeout(to); r(); }; v.currentTime = t; });
      frames.push(shot(v, v.videoWidth, v.videoHeight));
    }
    return { frames, dur: Math.round(d * 10) / 10 };
  } finally { URL.revokeObjectURL(url); }
}
const VISION_SYSTEM = 'You describe video clips and photos for a video editor so the user can search their footage by content. For each file you get its name and 1 to 3 still frames in time order. Reply with ONLY a JSON array of {"name": the exact file name, "description": one short literal sentence (max 20 words) about what is visible and happening, "tags": up to 8 lowercase keywords for the main objects, scenes, people, vehicles, places and actions (for example train, railway, platform, people, car, beach, indoor, night)}. If the frames are unclear, say so in the description. No commentary.';

async function analyzeFolder(progress = () => {}, onlyMissing = true) {
  if (analyzing) throw new Error('already analyzing the folder');
  analyzing = true; analyzeStop = false;
  try {
    const todo = folderFiles.filter(f => f.kind !== 'audio' && !(onlyMissing && folderDescOf(f)));
    let done = 0;
    for (let i = 0; i < todo.length && !analyzeStop; i += 4) {
      const batch = todo.slice(i, i + 4), images = [], durs = {};
      progress(`Claude is looking at your clips… ${done} of ${todo.length}`);
      for (const f of batch) {
        try {
          const { frames, dur } = await grabFrames(await f.handle.getFile(), f.kind);
          durs[f.name] = dur;
          frames.forEach((b64, k) => images.push({ label: `File "${f.name}", frame ${k + 1} of ${frames.length}:`, b64, mime: 'image/jpeg' }));
        } catch (e) { folderDesc[f.path] = { key: folderKey(f), desc: `could not read this file (${e.message})`, tags: [], dur: 0 }; }
      }
      if (images.length) {
        const r = await fetch('/api/vision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system: VISION_SYSTEM, prompt: 'Describe each file.', images }) });
        const j = await r.json().catch(() => ({ error: 'unreadable reply from the server (restart it with python3 server.py)' }));
        if (!r.ok) throw new Error(j.error || 'request failed');
        for (const o of parseJsonArray(j.text)) {
          const f = batch.find(x => x.name === o.name);
          if (f) folderDesc[f.path] = { key: folderKey(f), desc: String(o.description || '').slice(0, 200), tags: (Array.isArray(o.tags) ? o.tags : []).map(String).slice(0, 8), dur: durs[f.name] || 0 };
        }
      }
      done += batch.length;
      await idb('kv', 'readwrite', st => st.put(folderDesc, 'folderDesc')).catch(() => {});
      renderFolder();
    }
  } finally { analyzing = false; renderFolder(); }
}

// ---------- top menus: click to open, hover to switch, click outside or Esc to close ----------
(() => {
  const menus = [...document.querySelectorAll('.menu')];
  const closeAll = () => menus.forEach(m => { m.classList.remove('open'); m.firstElementChild.setAttribute('aria-expanded', 'false'); });
  const open = m => { closeAll(); m.classList.add('open'); m.firstElementChild.setAttribute('aria-expanded', 'true'); };
  for (const m of menus) {
    const btn = m.firstElementChild;
    btn.onclick = e => { e.stopPropagation(); m.classList.contains('open') ? closeAll() : open(m); };
    btn.onmouseenter = () => { if (menus.some(o => o.classList.contains('open')) && !m.classList.contains('open')) open(m); };
    m.querySelector('.menu-panel').addEventListener('click', () => setTimeout(closeAll, 0));   // after the item has done its job
  }
  addEventListener('click', closeAll);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
})();


// ---------- timeline tools (the icon bar under the preview and its tools menu) ----------
for (const [id, icon] of [['btn-start', 'start'], ['btn-play', 'play'], ['btn-split', 'split'], ['btn-dup', 'dup'], ['btn-trimin', 'trimin'], ['btn-trimout', 'trimout'], ['btn-del', 'trash'], ['btn-ripple', 'ripple'], ['btn-frame', 'frame'], ['btn-tlmenu', 'tools']]) setIcon($('#' + id), icon, false, 16);

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = mk('div'); t.id = 'toast'; document.body.append(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}
function toggleSnap() { snapOn = !snapOn; $('#tl-snap').firstChild.textContent = `${snapOn ? '\u2713 ' : ''}Snapping `; toast(`Snapping ${snapOn ? 'on' : 'off'}`); }
$('#tl-snap').firstChild.textContent = '\u2713 Snapping ';

function splitAll() {   // cut every layer at the playhead
  const t = state.t, done = new Set();
  const hit = state.clips.filter(o => t > o.start + 0.05 && t < o.start + o.dur - 0.05);
  if (!hit.length) return toast('Nothing to split at the playhead');
  pushHistory();
  for (const o of hit) {
    if (done.has(o.id)) continue;
    done.add(o.id); partners(o).forEach(p => done.add(p.id));
    splitClip(o, t);
  }
  afterEdit();
}
let clipboard = [];
function copyClips() {
  const base = multiClips().length ? multiClips() : [selClip()].filter(Boolean);
  if (!base.length) return toast('Select a clip to copy');
  const all = new Map();
  for (const c of base) { all.set(c.id, c); partners(c).forEach(p => all.set(p.id, p)); }
  clipboard = JSON.parse(JSON.stringify([...all.values()]));
  toast(`Copied ${clipboard.length} clip${clipboard.length === 1 ? '' : 's'}`);
}
function pasteClips() {
  if (!clipboard.length) return toast('Nothing copied yet');
  const t0 = Math.min(...clipboard.map(c => c.start));
  let at = state.t;
  const place = (start) => clipboard.map(c => ({ ...c, kf: cloneKf(c.kf), start: c.start - t0 + start }));
  let items = place(at);
  if (!items.every(c => fits({ id: -1 }, c.start, c.dur, c.track))) {   // not free there: put the whole group after the last clip on those layers
    at = Math.max(...clipboard.map(c => laneEnd(c.track)));
    items = place(at);
  }
  pushHistory();
  const links = new Map();
  const fresh = items.map(c => {
    const n = { ...c, id: uid() };
    if (c.link) { if (!links.has(c.link)) links.set(c.link, uid()); n.link = links.get(c.link); }
    return n;
  });
  state.clips.push(...fresh);
  state.sel = fresh[0].id;
  state.multi = fresh.length > 1 ? fresh.map(c => c.id) : [];
  afterEdit();
}
function setSpeedTo(v) {
  const c = selClip();
  if (!c) return toast('Select a clip first');
  const kind = clipKind(c);
  if (kind === 'text' || kind === 'image') return toast('Speed works on video and audio clips');
  if (hasRamp(c)) return toast('This clip has a speed ramp. Remove it first (Keyframes, Remove all keyframes).');
  const targets = [c, ...partners(c)], dur = c.dur * spd(c) / v;
  if (dur < 0.1 || dur > (assetOf(c).dur - c.in) / v + 1e-6 || !targets.every(o => fits(o, o.start, dur, o.track))) return toast('Not enough room for that speed');
  pushHistory();
  for (const o of targets) { kfRetime(o, dur / o.dur); o.speed = v; o.dur = dur; }
  afterEdit();
}
function fadeSel() {
  const base = multiClips().length ? multiClips() : [selClip()].filter(Boolean);
  if (!base.length) return toast('Select a clip first');
  pushHistory();
  for (const c of base) { const f = Math.min(1, c.dur / 2); c.fadeIn = f; c.fadeOut = f; for (const p of partners(c)) { p.fadeIn = f; p.fadeOut = f; } }
  afterEdit();
}
async function freezeFrame() {
  const t = state.t, isVid = o => o.text == null && !o.audioOnly && assetOf(o) && assetOf(o).kind === 'video' && t > o.start + 0.05 && t < o.start + o.dur - 0.05;
  const sel = selClip(), c = sel && isVid(sel) ? sel : state.clips.find(isVid);
  if (!c) return toast('Put the playhead inside a video clip first');
  const a = assetOf(c);
  pause(); syncMedia();
  await new Promise(r => { if (Math.abs(a.el.currentTime - srcTime(c, t)) < 0.03) return r(); const to = setTimeout(r, 2500); a.el.onseeked = () => { clearTimeout(to); r(); }; });
  const cv = document.createElement('canvas');
  cv.width = a.el.videoWidth; cv.height = a.el.videoHeight;
  cv.getContext('2d').drawImage(a.el, 0, 0);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  state.freezeN = (state.freezeN || 0) + 1;
  const asset = await loadAsset(new File([blob], `freeze frame ${state.freezeN}.png`, { type: 'image/png' }), uid());
  state.assets.set(asset.id, asset);
  renderBin();
  pushHistory();
  const HOLD = 2, right = splitClip(c, t);
  const rightIds = new Set([right.id, ...partners(right).map(p => p.id)]);
  const tracks = new Set(state.clips.filter(o => rightIds.has(o.id)).map(o => o.track));
  for (const o of state.clips) if (rightIds.has(o.id) || (tracks.has(o.track) && o.start >= t - 1e-6 && o.id !== c.id && !partners(c).some(p => p.id === o.id))) o.start += HOLD;
  const fc = newMediaClip(asset, c.track, t);
  fc.dur = HOLD;
  for (const k of ['opacity', 'scale', 'px', 'py', 'rot', 'cropL', 'cropR', 'cropT', 'cropB', ...Object.keys(COLOR_DEFAULTS)]) if (c[k] != null) fc[k] = c[k];
  state.clips.push(fc);
  state.sel = fc.id;
  afterEdit();
}
function gapTrack() { const c = selClip(); return c ? c.track : defaultTrack('video'); }
function deleteGap() {
  const t = state.t, track = gapTrack(), cs = state.clips.filter(o => o.track === track).sort((a, b) => a.start - b.start);
  if (cs.some(o => o.start < t - 1e-6 && o.start + o.dur > t + 1e-6)) return toast('The playhead is on a clip, not on a gap');
  const next = cs.find(o => o.start >= t - 1e-6);
  if (!next) return toast('No clip after the playhead on this layer');
  const prevEnd = Math.max(0, ...cs.filter(o => o.start + o.dur <= t + 1e-6).map(o => o.start + o.dur));
  const gap = next.start - prevEnd;
  if (gap <= 1e-4) return toast('There is no gap here');
  pushHistory();
  for (const o of cs) if (o.start >= next.start - 1e-6) { o.start -= gap; syncLinked(o); }
  afterEdit();
}
function closeGaps() {
  const track = gapTrack(), cs = state.clips.filter(o => o.track === track).sort((a, b) => a.start - b.start);
  if (cs.length < 2) return toast('Nothing to close on this layer');
  let pos = cs[0].start, changed = false;
  const moves = cs.map(o => { const m = [o, pos]; if (Math.abs(o.start - pos) > 1e-4) changed = true; pos += o.dur; return m; });
  if (!changed) return toast('There are no gaps on this layer');
  pushHistory();
  for (const [o, p] of moves) { o.start = p; syncLinked(o); }
  afterEdit();
}
function nudgeClip(dir) {
  const c = selClip();
  if (!c) return;
  const ns = Math.round((c.start + dir / FPS) * FPS) / FPS;
  if (ns < 0 || !fits(c, ns, c.dur, c.track)) return;
  pushHistory();
  c.start = ns; syncLinked(c);
  afterEdit();
}
function toggleMarker() {
  const i = state.markers.findIndex(m => Math.abs(m - state.t) < 0.05);
  if (i >= 0) state.markers.splice(i, 1); else state.markers.push(+state.t.toFixed(3));
  state.markers.sort((a, b) => a - b);
  renderTimeline();
}
function jumpMarker(dir) {
  const ms = state.markers.slice().sort((a, b) => a - b);
  const m = dir > 0 ? ms.find(x => x > state.t + 1e-3) : ms.reverse().find(x => x < state.t - 1e-3);
  if (m == null) return toast(dir > 0 ? 'No marker after the playhead' : 'No marker before the playhead');
  seek(m);
}
function jumpCut(dir) {
  const pts = [...new Set(state.clips.flatMap(c => [c.start, c.start + c.dur]).map(x => +x.toFixed(4)))].sort((a, b) => a - b);
  const m = dir > 0 ? pts.find(x => x > state.t + 1e-3) : pts.reverse().find(x => x < state.t - 1e-3);
  if (m == null) return toast(dir > 0 ? 'No cut after the playhead' : 'No cut before the playhead');
  seek(m);
}
function setZoom(v) { state.pps = Math.max(10, Math.min(300, v)); $('#zoom').value = state.pps; renderTimeline(); }

$('#tl-snap').onclick = toggleSnap;
$('#tl-splitall').onclick = splitAll;
$('#tl-copy').onclick = copyClips;
$('#tl-paste').onclick = pasteClips;
$('#tl-freeze').onclick = () => freezeFrame().catch(e => toast('Freeze frame failed: ' + e.message));
$('#tl-speed05').onclick = () => setSpeedTo(0.5);
$('#tl-speed1').onclick = () => setSpeedTo(1);
$('#tl-speed2').onclick = () => setSpeedTo(2);
$('#tl-fade').onclick = fadeSel;

// ---------- keyframe buttons (inspector) ----------
const kfRefresh = () => { renderTimeline(); kfSync(); draw(); };
$('#inspector').addEventListener('click', e => {
  const b = e.target.closest('button, a');
  const c = selClip();
  if (!b || !c) return;
  if (b.dataset.kfgo !== undefined) { seek(c.start + +b.dataset.kfgo); return; }
  const f = $('#kf-prop') && $('#kf-prop').value;
  if (b.id === 'kf-add' && f) { pushHistory(); const keep = JSON.stringify(c.kf && c.kf[f]); setKey(c, f, propNow(c, f)); if (f === 'speed') { if (!rampOk(c)) { if (keep === undefined) delete c.kf[f]; else c.kf[f] = JSON.parse(keep); return toast('That would use more video than the file has'); } kfMirror(c); } kfRefresh(); }
  else if (b.id === 'kf-del' && f && c.kf && c.kf[f]) {
    pushHistory();
    const r = Math.max(0, Math.min(c.dur, state.t - c.start));
    c.kf[f] = c.kf[f].filter(k => Math.abs(k.t - r) >= 0.05);
    if (!c.kf[f].length) delete c.kf[f];
    if (!Object.keys(c.kf).length) delete c.kf;
    if (f === 'speed') kfMirror(c);
    kfRefresh();
  } else if (b.id === 'kf-clear' && f && c.kf && c.kf[f]) {
    pushHistory();
    c[f] = propNow(c, f);   // keep how it looks right now
    if (f === 'speed') c.speed = 1;
    delete c.kf[f];
    if (!Object.keys(c.kf).length) delete c.kf;
    if (f === 'speed') kfMirror(c);
    kfRefresh();
  } else if (b.dataset.kfp) {
    pushHistory();
    const k = b.dataset.kfp, d = c.dur, s0 = propNow(c, 'scale');
    if (k === 'clear') { const had = hasRamp(c); if (c.kf) for (const f2 in c.kf) if (!f2.startsWith('stab')) delete c.kf[f2]; if (c.kf && !Object.keys(c.kf).length) delete c.kf; if (had) kfMirror(c); }
    else if (k.startsWith('ramp')) {
      const keep = c.kf && c.kf.speed ? JSON.stringify(c.kf.speed) : null;
      c.kf = c.kf || {};
      c.kf.speed = k === 'rampup' ? [{ t: 0, v: 0.5 }, { t: d, v: 2 }] : k === 'rampdown' ? [{ t: 0, v: 2 }, { t: d, v: 0.5 }]
        : [{ t: 0, v: 1 }, { t: d * 0.35, v: 1 }, { t: d * 0.5, v: 0.3 }, { t: d * 0.65, v: 1 }, { t: d, v: 1 }];
      if (!rampOk(c)) { if (keep) c.kf.speed = JSON.parse(keep); else { delete c.kf.speed; if (!Object.keys(c.kf).length) delete c.kf; } toast('That ramp would use more video than the file has. Shorten the clip or use a clip with spare video at its end.'); }
      else kfMirror(c);
    } else {
      c.kf = c.kf || {};
      if (k === 'zoomin') c.kf.scale = [{ t: 0, v: s0 }, { t: d, v: Math.min(4, +(s0 * 1.3).toFixed(2)) }];
      if (k === 'zoomout') c.kf.scale = [{ t: 0, v: Math.min(4, +(s0 * 1.3).toFixed(2)) }, { t: d, v: s0 }];
      if (k === 'panright' || k === 'panleft') {
        if (!(c.kf.scale && c.kf.scale.length)) c.scale = Math.max(c.scale ?? 1, 1.15);   // a little zoom so the pan does not show empty edges
        c.kf.px = k === 'panright' ? [{ t: 0, v: -6 }, { t: d, v: 6 }] : [{ t: 0, v: 6 }, { t: d, v: -6 }];
      }
    }
    renderInspector(); renderTimeline(); draw();
  }
});
$('#inspector').addEventListener('change', e => {
  const c = selClip();
  if (!c) return;
  if (e.target.id === 'kf-smooth') { pushHistory(); c.kfSmooth = e.target.checked; draw(); }
  else if (e.target.id === 'kf-prop') kfSync();
});

// ---------- LUT import and key colour detection ----------
const lutInput = Object.assign(document.createElement('input'), { type: 'file', accept: '.cube,.CUBE', hidden: true });
document.body.append(lutInput);
lutInput.onchange = async () => {
  const f = lutInput.files[0], c = selClip();
  lutInput.value = '';
  if (!f || !c) return;
  try {
    const L = parseCube(await f.text()), id = 'lut-' + Date.now().toString(36);
    lutReg.set(id, { name: L.title || f.name.replace(/\.cube$/i, ''), n: L.n, rgb: L.rgb, rgba: L.rgba });
    pushHistory(); c.lut = id; c.lutAmt = 100;
    lutSave(); renderInspector(); draw();
    toast(`LUT “${lutReg.get(id).name}” applied (${L.n}×${L.n}×${L.n})`);
  } catch (e) { toast('Could not use this LUT: ' + e.message); }
};
$('#inspector').addEventListener('click', e => {
  const b = e.target.closest('button'), c = selClip();
  if (!b || !c) return;
  if (b.id === 'lut-import') lutInput.click();
  else if (b.id === 'stab-run') {
    const st = $('#stab-status'), id = c.id;
    b.disabled = true; st.textContent = 'Analyzing the camera movement… keep this tab open.';
    stabilizeClip(c, +$('#stab-win').value, p => { st.textContent = `Analyzing the camera movement… ${Math.round(p * 100)}%`; }).then(r => {
      const cc = state.clips.find(o => o.id === id);
      if (!cc) return;
      pushHistory();
      cc.kf = cc.kf || {}; cc.kf.stabx = r.cx; cc.kf.staby = r.cy; cc.stabOn = true; cc.stabZoom = r.zoom;
      renderInspector(); renderTimeline(); draw();
      const s2 = $('#stab-status'); if (s2) s2.textContent = `Done. The camera moved by up to ${(r.shake * 100).toFixed(1)}% of the picture width; the picture is zoomed ${r.zoom}x to hide the edges.`;
    }).catch(e => { b.disabled = false; st.textContent = 'Could not stabilize: ' + e.message; });
  } else if (b.id === 'stab-rm') {
    pushHistory();
    if (c.kf) { delete c.kf.stabx; delete c.kf.staby; if (!Object.keys(c.kf).length) delete c.kf; }
    c.stabOn = false; renderInspector(); renderTimeline(); draw();
  }
  else if (b.id === 'key-detect') {
    const col = detectKeyColor(c);
    if (!col) return toast('The picture is not ready yet. Move the playhead onto the clip and try again.');
    pushHistory(); c.keyColor = col; c.keyOn = true; renderInspector(); draw();
  }
});

// ---------- merge: join touching pieces of the same clip back into one ----------
const MERGE_SKIP = new Set(['id', 'start', 'dur', 'in', 'link', 'tr', 'fadeIn', 'fadeOut', 'kf']);
const sameLook = (a, b) => {
  const ka = Object.keys(a).filter(k => !MERGE_SKIP.has(k) && a[k] !== undefined), kb = Object.keys(b).filter(k => !MERGE_SKIP.has(k) && b[k] !== undefined);
  return ka.length === kb.length && ka.every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
};
const canMerge = (a, b) => a.text == null && b.text == null && a.track === b.track && a.assetId === b.assetId && !!a.audioOnly === !!b.audioOnly
  && Math.abs(a.start + a.dur - b.start) < 0.05 && Math.abs(a.in + a.dur * spd(a) - b.in) < 0.05 && spd(a) === spd(b) && sameLook(a, b);
function mergeSel() {
  let list = multiClips().length ? multiClips().slice() : [selClip()].filter(Boolean);
  if (!list.length) return toast('Select the clips to merge (or one clip to merge it with the next one)');
  list = list.filter(c => c.text == null).sort((a, b) => a.start - b.start);
  if (list.length === 1) {   // one clip: join it with the clip right after it
    const c = list[0], n = state.clips.filter(o => o.id !== c.id && o.track === c.track && o.text == null && Math.abs(o.start - (c.start + c.dur)) < 0.05)[0];
    if (!n) return toast('There is no clip touching the end of this one');
    list.push(n);
  }
  if (list.some(c => c.kf)) return toast('Clips with keyframes cannot be merged. Remove their keyframes first.');
  for (let i = 1; i < list.length; i++) if (!canMerge(list[i - 1], list[i])) return toast('These clips cannot be merged: they must touch, come from the same file in order (no part missing), and have the same settings and speed.');
  pushHistory();
  const gone = new Set();
  const first = list[0];
  for (let i = 1; i < list.length; i++) {
    const n = list[i];
    // the linked sound of the two pieces joins too
    for (const pb of partners(n)) {
      const pa2 = partners(first).find(p => p.track === pb.track && p.assetId === pb.assetId);
      if (pa2) { pa2.dur += n.dur; pa2.fadeOut = pb.fadeOut; gone.add(pb.id); }
      else gone.add(pb.id);
    }
    first.dur += n.dur; first.fadeOut = n.fadeOut;
    gone.add(n.id);
  }
  state.clips = state.clips.filter(c => !gone.has(c.id));
  state.sel = first.id; state.multi = [];
  afterEdit();
  toast(`Merged ${list.length} clips into one`);
}
$('#tl-merge').onclick = mergeSel;
$('#tl-delgap').onclick = deleteGap;
$('#tl-closegaps').onclick = closeGaps;
$('#tl-nudgel').onclick = () => nudgeClip(-1);
$('#tl-nudger').onclick = () => nudgeClip(1);
$('#tl-marker').onclick = toggleMarker;
$('#tl-prevmk').onclick = () => jumpMarker(-1);
$('#tl-nextmk').onclick = () => jumpMarker(1);
$('#tl-prevcut').onclick = () => jumpCut(-1);
$('#tl-nextcut').onclick = () => jumpCut(1);
$('#tl-selall').onclick = () => state.clips.length ? selectClips(state.clips) : toast('No clips yet');
$('#tl-selfwd').onclick = () => { const cs = state.clips.filter(c => c.start >= state.t - 1e-6); cs.length ? selectClips(cs) : toast('No clips after the playhead'); };
$('#tl-zoomfit').onclick = () => setZoom(($('#tl-scroll').clientWidth - 40) / Math.max(1, totalDur()));
$('#tl-zoomin').onclick = () => setZoom(state.pps * 1.4);
$('#tl-zoomout').onclick = () => setZoom(state.pps / 1.4);
