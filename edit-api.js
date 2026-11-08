'use strict';
// Extra edit actions for the Claude connector (opencut_mcp.py → BRIDGE_OPS.run_actions → chatExec).
// They give an agent the tools of a full edit: trimmed clips from any point of the source, title presets,
// text animation / title styles, transitions on cuts and keyframe animation (e.g. a slow push-in).
(() => {
  const base = window.chatExec;
  if (typeof base !== 'function') return;
  const num = (v, name) => { if (typeof v !== 'number' || !isFinite(v)) throw new Error(`${name} must be a number`); return v; };
  const findClip = id => { const c = state.clips.find(o => o.id === id); if (!c) throw new Error(`clip ${id} not found`); return c; };
  const findAsset = q => {
    q = String(q || '').toLowerCase();
    const as = [...state.assets.values()];
    return as.find(x => x.name.toLowerCase() === q) || as.find(x => x.name.toLowerCase().includes(q));
  };
  // style keys that may be written straight onto a clip (text look, animation, title styles, lower thirds)
  const STYLE_KEYS = new Set(['animIn', 'animOut', 'animDur', 'ts', 'lt', 'sub', 'accent', 'glass', 'glassTheme', 'glassRadius', 'glassBlur',
    'bold', 'bg', 'color', 'size', 'x', 'y', 'rot', 'opacity', 'fadeIn', 'fadeOut', 'text', 'fontCss', 'vol', 'look']);

  async function exec(a) {
    switch (a && a.type) {
      case 'add_clip': {   // {asset, track?, start?, in?, dur?, speed?} a piece of a video/image/audio file, with its linked sound
        const asset = findAsset(a.asset);
        if (!asset) throw new Error(`no imported media named "${a.asset}"`);
        const track = Number.isInteger(a.track) ? a.track : defaultTrack(asset.kind);
        if (!TRACKS[track] || !laneOk(asset.kind, track)) throw new Error(`${asset.kind} cannot go on track ${track}`);
        const sp = typeof a.speed === 'number' ? Math.min(4, Math.max(0.25, a.speed)) : 1;
        const inPt = asset.kind === 'image' ? 0 : Math.max(0, Math.min(asset.dur - 0.1, typeof a.in === 'number' ? a.in : 0));
        const maxDur = asset.kind === 'image' ? 3600 : (asset.dur - inPt) / sp;
        const dur = Math.min(maxDur, typeof a.dur === 'number' && a.dur > 0.1 ? a.dur : maxDur);
        const start = typeof a.start === 'number' ? Math.max(0, a.start) : laneEnd(track);
        const c = { ...newMediaClip(asset, track, start), in: inPt, dur };
        if (sp !== 1) c.speed = sp;
        if (!fits(c, start, dur, track)) throw new Error(`clip would overlap another clip on track ${track} at ${start}s`);
        state.clips.push(c);
        if (asset.kind === 'video') detachAudio(c);
        state.sel = c.id;
        return;
      }
      case 'add_title': {   // {preset, text?, sub?, start, dur?, props?} one of the title presets (Titles & lower thirds dialog)
        const T = window.TITLE_API;
        if (!T || !T.TITLES) throw new Error('title presets are not loaded');
        const want = String(a.preset || '').toLowerCase();
        const p = T.TITLES.find(t => t.k.toLowerCase() === want) || T.TITLES.find(t => t.k.toLowerCase().includes(want));
        if (!p) throw new Error(`unknown title preset "${a.preset}". Presets: ${T.TITLES.map(t => t.k).join(', ')}`);
        const c = T.addTitle(p, a.text, a.sub, typeof a.start === 'number' ? a.start : state.t, true);
        if (typeof a.dur === 'number' && a.dur > 0.1) c.dur = a.dur;
        for (const [k, v] of Object.entries(a.props || {})) styleProp(c, k, v);
        state.sel = c.id;
        return;
      }
      case 'style': {   // {clip, props} text look, animation and title style fields
        const c = findClip(a.clip);
        for (const [k, v] of Object.entries(a.props || {})) styleProp(c, k, v);
        return;
      }
      case 'transition': {   // {clip, kind, dur} on the cut before this clip (and its linked sound)
        const c = findClip(a.clip);
        if (c.text != null) throw new Error('transitions go on video, picture or audio clips');
        const kind = String(a.kind || a.style || 'fade');
        if (!TRANSITIONS[kind]) throw new Error(`unknown transition "${kind}". Use: ${Object.keys(TRANSITIONS).join(', ')}`);
        const tr = { type: kind, dur: Math.max(0.1, Math.min(3, typeof a.dur === 'number' ? a.dur : 0.6)) };
        for (const o of [c, ...partners(c)]) o.tr = { ...tr };
        return;
      }
      case 'keyframes': {   // {clip, prop, keys: [[t, v], ...], smooth?} t in seconds from the clip start
        const c = findClip(a.clip), f = String(a.prop);
        if (!Array.isArray(a.keys) || !a.keys.length) throw new Error('keys must be a list of [time, value]');
        c.kf = c.kf || {};
        c.kf[f] = a.keys.map(([t, v]) => ({ t: Math.max(0, Math.min(c.dur, num(t, 'key time'))), v: num(v, 'key value') })).sort((x, y) => x.t - y.t);
        if (a.smooth === false) c.kfSmooth = false;
        return;
      }
      case 'add_media_url':
      case 'add_audio_url': {   // {url, name, start, dur?, track?:"AI Voice", vol?, fadeIn?, fadeOut?} e.g. a generated voice line from /api/voice/jobs/ID/audio
        const url = String(a.url || '');
        if (!url.startsWith('/') || url.startsWith('//')) throw new Error('url must be a path on this editor server (starting with /)');
        const r = await fetch(url);
        if (!r.ok) throw new Error(`could not load ${url} (${r.status})`);
        const blob = await r.blob(), ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
        const type = (blob.type && blob.type !== 'application/octet-stream') ? blob.type : (EXT_MIME[ext] || 'audio/wav');
        let name = String(a.name || url.split('/').pop() || 'media').replace(/[\\/:*?"<>|]/g, '');
        if (!/\.[a-z0-9]{2,4}$/i.test(name)) name += '.' + (ext && EXT_MIME[ext] ? ext : 'wav');
        const asset = await loadAsset(new File([blob], name, { type }), uid());
        if (!asset) throw new Error(`could not read ${url} as video, audio or a picture`);
        state.assets.set(asset.id, asset); renderBin();
        const track = Number.isInteger(a.track) ? a.track : asset.kind === 'audio' ? namedAudioTrack(String(a.track || 'AI Voice')) : defaultTrack(asset.kind);
        if (!laneOk(asset.kind, track)) throw new Error(`${asset.kind} cannot go on track ${track}`);
        const c = newMediaClip(asset, track, typeof a.start === 'number' ? Math.max(0, a.start) : laneEnd(track));
        if (typeof a.dur === 'number' && a.dur > 0.1) c.dur = Math.min(c.dur, a.dur);
        if (!fits(c, c.start, c.dur, track)) throw new Error(`audio would overlap another clip on track ${track} at ${c.start}s`);
        if (asset.kind === 'audio' || typeof a.vol === 'number') c.vol = typeof a.vol === 'number' ? a.vol : 1;
        if (typeof a.fadeIn === 'number') c.fadeIn = a.fadeIn;
        if (typeof a.fadeOut === 'number') c.fadeOut = a.fadeOut;
        if (a.text) c.ai = { voiceName: String(a.voice || ''), text: String(a.text) };
        state.clips.push(c); state.sel = c.id;
        return;
      }
      case 'track_label': {   // {clip, at, u, v, text, sub?, start?, dur?, box?, dx?, dy?, size?, accent?, dot?} name tag that follows a tracked object
        const c = findClip(a.clip), TR = window.FX_TRACK, T = window.TITLE_API;
        if (!TR) throw new Error('motion tracking is not loaded');
        const u = num(a.u, 'u'), v = num(a.v, 'v'), at = typeof a.at === 'number' ? a.at : c.start;
        if (at < c.start || at >= c.start + c.dur) throw new Error(`"at" must be inside clip ${c.id} (${c.start}..${c.start + c.dur}s)`);
        const start = Math.max(at, typeof a.start === 'number' ? a.start : at), dur = Math.min(typeof a.dur === 'number' ? a.dur : 3, c.start + c.dur - start);
        state.t = at;
        const r = await TR.trackRun(c, u, v, Math.round(typeof a.box === 'number' ? a.box : 14), () => {});
        const pts = r.pts.map(([tl, pu, pv]) => { const abs = c.start + tl, [X, Y] = TR.trackPoint(withKf(c, abs), pu, pv); return [abs, X / W * 100, Y / H * 100]; })
          .filter(([abs]) => abs >= start - 0.051 && abs <= start + dur + 0.051);
        if (pts.length < 2) throw new Error('tracking found too few positions');
        const dx = typeof a.dx === 'number' ? a.dx : 4, dy = typeof a.dy === 'number' ? a.dy : -3, acc = a.accent || '#ffffff';
        const clampX = x => Math.max(3, Math.min(typeof a.maxX === 'number' ? a.maxX : 55, x)), clampY = y => Math.max(8, Math.min(80, y));
        const kfOf = (f, off, cl, t0) => pts.map(p => ({ t: +(p[0] - t0).toFixed(3), v: +cl(p[f] + off).toFixed(2) }));
        const preset = T.TITLES.find(t => t.k === 'Location & date');
        const lab = T.addTitle({ ...preset, p: { ...preset.p, dur } }, a.text, a.sub || '', start, true);
        placeOnFreeText(lab, start, dur);
        Object.assign(lab, { dur,size: typeof a.size === 'number' ? a.size : 30, lt: 'minimal', accent: acc, animIn: 'left', animOut: 'fade', animDur: 0.5, trkLost: r.lost });
        lab.kf = { x: kfOf(1, dx, clampX, start), y: kfOf(2, dy, clampY, start) }; lab.kfSmooth = true;
        if (a.dot !== false) {   // a small marker on the object itself
          await base({ type: 'add_text', text: '◉', start, dur, props: { size: typeof a.dotSize === 'number' ? a.dotSize : 26, color: acc, bg: false, bold: false } });
          const d = state.clips.find(o => o.id === state.sel);
          placeOnFreeText(d, start, dur);
          Object.assign(d, { animIn: 'pop', animOut: 'fade', animDur: 0.4 });
          d.kf = { x: kfOf(1, 0, x => x, start), y: kfOf(2, 0, y => y, start) }; d.kfSmooth = true;
        }
        state.sel = lab.id;
        if (r.lost > 3) throw new Error(`tracked, but the object was lost in ${r.lost} frames: check the label (clip ${lab.id})`);
        return;
      }
      default:
        return base(a);
    }
  }
  function placeOnFreeText(c, start, dur) {   // put a text clip at start..start+dur on a text layer with room there (adds a layer if all are busy)
    const ok = k => !state.clips.some(o => o !== c && o.track === k && o.start < start + dur - 1e-6 && o.start + o.dur > start + 1e-6);
    let k = ok(c.track) ? c.track : LANE_ORDER.find(i => TRACKS[i] && TRACKS[i].kind === 'text' && ok(i));
    if (k == null) { addLayer('text'); k = TRACKS.length - 1; buildLabels(); renderTimeline(); }
    c.track = k; c.start = start; c.dur = dur;
  }
  function namedAudioTrack(name) {   // an audio layer with this name (created if missing), like the AI Voice layer of AI Voice Studio
    let i = TRACKS.findIndex((t, k) => t.kind === 'audio' && t.name === name && LANE_ORDER.includes(k));
    if (i >= 0) return i;
    addLayer('audio'); i = TRACKS.length - 1; TRACKS[i].name = name; buildLabels(); renderTimeline();
    return i;
  }
  function styleProp(c, k, v) {
    if (k === 'preset' || k === 'start' || k === 'dur' || k === 'speed' || k === 'font' || k in NUM_PROPS && !STYLE_KEYS.has(k)) {
      setProp(c, k, v); return;
    }
    if (!STYLE_KEYS.has(k)) throw new Error(`unknown style property "${k}"`);
    if (k === 'fontCss') { c.font = String(v); return; }
    if (k === 'animIn' && !window.TEXT_ANIM.ANIM_IN[v]) throw new Error(`animIn must be one of ${Object.keys(window.TEXT_ANIM.ANIM_IN).join(', ')}`);
    if (k === 'animOut' && !window.TEXT_ANIM.ANIM_OUT[v]) throw new Error(`animOut must be one of ${Object.keys(window.TEXT_ANIM.ANIM_OUT).join(', ')}`);
    if (k === 'ts' && !(window.TITLE_API.TS_STYLES || {})[v]) throw new Error(`ts must be one of ${Object.keys(window.TITLE_API.TS_STYLES).join(', ')}`);
    if (k === 'lt' && !(window.TITLE_API.LT_STYLES || {})[v]) throw new Error(`lt must be one of ${Object.keys(window.TITLE_API.LT_STYLES).join(', ')}`);
    c[k] = v;
  }
  window.chatExec = exec;

  const EXTRA_HELP = `
Extra actions (pro editing):
{"type":"add_clip","asset":"<name>","track":2,"start":0,"in":12.5,"dur":4,"speed":1}   (a piece of a file: "in" = where in the source it starts; its sound goes on the Audio layer, linked)
{"type":"add_title","preset":"Elegance title","text":"VENICE","sub":"ITALY","start":2,"dur":4,"props":{"accent":"#ffffff"}}
   presets: ${(window.TITLE_API && window.TITLE_API.TITLES || []).map(t => t.k).join(', ')}
{"type":"style","clip":ID,"props":{"animIn":"up","animOut":"fade","animDur":0.8,"ts":"frame","sub":"...","accent":"#19d3c5","fontCss":"\\"Avenir Next\\", sans-serif"}}
   animIn: ${Object.keys(window.TEXT_ANIM ? window.TEXT_ANIM.ANIM_IN : {}).join(', ')}; animOut: ${Object.keys(window.TEXT_ANIM ? window.TEXT_ANIM.ANIM_OUT : {}).join(', ')}
   ts (title style): ${Object.keys(window.TITLE_API && window.TITLE_API.TS_STYLES || {}).join(', ')}; lt (lower third): ${Object.keys(window.TITLE_API && window.TITLE_API.LT_STYLES || {}).join(', ')}
{"type":"transition","clip":ID,"kind":"fade","dur":0.6}   (on the cut before the clip; kinds: ${Object.keys(TRANSITIONS).join(', ')})
{"type":"add_media_url","url":"/media/intro.mp4","track":2,"start":0}   (import a video/picture/audio file the editor server hosts, e.g. a rendered intro, and place it)
{"type":"add_audio_url","url":"/api/voice/jobs/<job id>/audio","name":"Narration 1","start":4.4,"track":"AI Voice","vol":1,"fadeOut":0.1}   (put generated audio, e.g. an AI voice line, on a named audio layer)
{"type":"track_label","clip":ID,"at":19.3,"u":0.35,"v":0.18,"text":"Hermannsdenkmal","sub":"Teutoburg Forest","start":19.3,"dur":2.8,"dx":4,"dy":-3}   (tracks the point u,v (0..1 of the video frame at time "at") and adds a name tag + marker dot that follow it)
{"type":"keyframes","clip":ID,"prop":"scale","keys":[[0,1],[4,1.12]]}   (animate scale, px, py, rot, opacity, x, y, vol over the clip; t from the clip start)`;
  // Project switching for the connector: export the open project as JSON, start a new one, load a saved one.
  const projectData = () => ({ nextId, w: W, h: H, assets: [...state.assets.values()].map(a => ({ id: a.id, name: a.name })),
    clips: state.clips, markers: state.markers, tracks: TRACKS, laneOrder: LANE_ORDER, activeTrack });
  BRIDGE_OPS.project_json = async () => ({ project: projectData() });
  BRIDGE_OPS.project_new = async ({ keepMedia = true } = {}) => { newProject(!!keepMedia); return JSON.parse(editorSnapshot()); };
  BRIDGE_OPS.project_load = async ({ url }) => {   // url: a project JSON on this editor server, e.g. /work/x/y.opencut.json
    if (!url || !String(url).startsWith('/') || String(url).startsWith('//')) throw new Error('url must be a path on this editor server');
    const r = await fetch(url); if (!r.ok) throw new Error(`could not load ${url} (${r.status})`);
    const text = await r.text(), data = JSON.parse(text), have = new Set([...state.assets.values()].map(a => a.name));
    const missing = (data.assets || []).map(a => a.name).filter(n => !have.has(n));
    if (missing.length) throw new Error('import these media files first: ' + missing.join(', '));
    loadProject(text); return JSON.parse(editorSnapshot());
  };
  BRIDGE_OPS.idb_info = async () => {   // read-only look at the browser autosave
    const db = await new Promise((r, j) => { const q = indexedDB.open('opencut'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error); });
    const get = (s, k) => new Promise(r => { const q = k === undefined ? db.transaction(s).objectStore(s).getAllKeys() : db.transaction(s).objectStore(s).get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null); });
    const snap = await get('kv', 'project'); let d = null; try { d = JSON.parse(snap); } catch (e) {}
    return { rev: await get('kv', 'rev'), snapLen: snap ? snap.length : 0, clips: d && d.clips ? d.clips.length : null, assets: d && d.assets, media: await get('media') };
  };
  const help = BRIDGE_OPS.help;
  BRIDGE_OPS.help = async () => (await help()) + EXTRA_HELP;
})();
