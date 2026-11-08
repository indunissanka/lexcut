'use strict';
// Text and titles: text animations (in/out), animated title and lower-third presets, custom fonts, SRT/VTT export.
// Rendering hooks are called from drawText() in app.js (textFx, textFxApply, textFxLines, drawLowerThird).
// Clip fields used: animIn, animOut, animDur (s), lt ('bar'|'box'|'line' = lower third), sub (second line), accent (colour).
(() => {
const attr = t => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const clamp01 = x => Math.max(0, Math.min(1, x));
const outCubic = p => 1 - Math.pow(1 - p, 3);
const outBack = p => { const s = 1.70158; p -= 1; return p * p * ((s + 1) * p + s) + 1; };

const ANIM_IN = { none: 'None', fade: 'Fade in', up: 'Slide up', down: 'Slide down', left: 'Slide in from left', right: 'Slide in from right', pop: 'Pop (bounce)', zoom: 'Zoom in', blur: 'Blur in', wipe: 'Wipe (reveal)', type: 'Typewriter (letters)', words: 'Word by word' };
const ANIM_OUT = { none: 'None', fade: 'Fade out', up: 'Slide up', down: 'Slide down', left: 'Slide out to left', right: 'Slide out to right', shrink: 'Shrink', blur: 'Blur out', wipe: 'Wipe away', type: 'Erase (letters)' };

window.TEXT_ANIM = { ANIM_IN, ANIM_OUT };
window.TITLE_API = {};   // filled in below: presets and addTitle, for edit-api.js
// ---------- animation state of a text clip at time t ----------
window.textFx = function (c, t) {
  const ai = c.animIn && c.animIn !== 'none' ? c.animIn : null, ao = c.animOut && c.animOut !== 'none' ? c.animOut : null;
  if (!ai && !ao) return null;
  const d = Math.max(0.05, Math.min(c.animDur ?? 0.6, c.dur / 2));
  const fx = { a: 1, dx: 0, dy: 0, sc: 1, blur: 0, wipe: 1, chars: 1, words: false };
  const apply = (type, p, s) => {   // p: 0..1 progress of the edge, s: +1 entering, -1 leaving
    if (!type || p >= 1) return;
    const u = 1 - outCubic(p);   // 1 = fully hidden, 0 = settled
    switch (type) {
      case 'fade': fx.a *= 1 - u; break;
      case 'up': fx.dy += s * u * 0.08; fx.a *= 1 - u; break;
      case 'down': fx.dy -= s * u * 0.08; fx.a *= 1 - u; break;
      case 'left': fx.dx -= u * 0.12; fx.a *= 1 - u; break;
      case 'right': fx.dx += u * 0.12; fx.a *= 1 - u; break;
      case 'pop': fx.sc *= Math.max(0.001, outBack(p)); fx.a *= clamp01(p * 3); break;
      case 'shrink': fx.sc *= 1 - 0.35 * u; fx.a *= 1 - u; break;
      case 'zoom': fx.sc *= 1 + 0.6 * u; fx.a *= 1 - u; break;
      case 'blur': fx.blur = Math.max(fx.blur, u * 24); fx.a *= 1 - u * 0.8; break;
      case 'wipe': fx.wipe = Math.min(fx.wipe, 1 - u); break;
      case 'type': fx.chars = Math.min(fx.chars, p); break;
      case 'words': fx.chars = Math.min(fx.chars, p); fx.words = true; break;
    }
  };
  apply(ai, clamp01((t - c.start) / d), 1);
  apply(ao, clamp01((c.start + c.dur - t) / d), -1);
  return fx;
};
// move / scale / blur / wipe the already-rotated drawing space around the centre (X, cy) of the box
window.textFxApply = function (fx, X, cy, box) {
  ctx.translate(fx.dx * W, fx.dy * H);
  if (fx.sc !== 1) { ctx.translate(X, cy); ctx.scale(fx.sc, fx.sc); ctx.translate(-X, -cy); }
  if (fx.blur > 0.3) ctx.filter = `blur(${(fx.blur * H / 720).toFixed(1)}px)`;
  if (fx.wipe < 1) { ctx.beginPath(); ctx.rect(box.x - 6, box.y - 6, (box.w + 12) * fx.wipe, box.h + 12); ctx.clip(); }
};
window.textFxLines = function (lines, fx) {   // the visible part of each line for typewriter / word by word
  const total = lines.reduce((n, l) => n + l.length, 0);
  let n = Math.round(total * fx.chars);
  return lines.map(l => {
    let k = Math.min(n, l.length);
    n -= k;
    if (fx.words && k > 0 && k < l.length) { const sp = l.indexOf(' ', k); k = sp < 0 ? l.length : sp; }
    return l.slice(0, k);
  });
};

// ---------- lower third ----------
// Styles: bar, box, line (classic) and news, minimal, pill, kicker (professional broadcast / corporate looks).
const LT_STYLES = { bar: 'Dark box with colour bar', box: 'Solid colour box', line: 'Text with colour line', news: 'News: colour name bar + white strip', minimal: 'Minimal: thin colour line, no box', pill: 'Rounded colour tag', kicker: 'Kicker: small label above a big title' };
const capsSub = c => c.lt === 'minimal' || c.lt === 'kicker';   // second line in spaced capitals
const subOf = c => capsSub(c) ? String(c.sub || '').toUpperCase() : (c.sub || '');
const setSpacing = px => { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`; };
function ltSizes(c) {
  const size = c.size, kick = c.lt === 'kicker', sub = subOf(c);
  const ss = Math.max(8, Math.round(size * (kick ? 0.36 : capsSub(c) ? 0.42 : 0.55))), fam = c.font || TEXT_FONT;
  const sp = capsSub(c) ? ss * 0.2 : 0;
  const f1 = `${c.bold === false ? '' : 'bold '}${size}px ${fam}`, f2 = `${kick || c.lt === 'news' ? '600 ' : ''}${ss}px ${fam}`;
  ctx.font = f1; setSpacing(0); const tw = ctx.measureText(c.text || '').width;
  ctx.font = f2; setSpacing(sp); const sw = sub ? ctx.measureText(sub).width : 0; setSpacing(0);
  const pad = size * 0.45, thin = c.lt === 'minimal';
  const barW = c.lt === 'bar' ? Math.max(4, size * 0.12) : thin ? Math.max(3, size * 0.06) : 0, gap = barW ? pad * (thin ? 0.7 : 0.5) : 0;
  const lh1 = size * 1.2, lh2 = sub ? ss * (kick ? 1.7 : 1.35) : 0;
  const m = { size, ss, sp, sub, f1, f2, tw, sw, pad, barW, gap, lh1, lh2, w: Math.max(tw, sw) + pad * 2 + barW + gap, h: lh1 + lh2 + pad * 1.2 };
  if (c.lt === 'news') { m.r1 = lh1 + pad * 0.5; m.r2 = sub ? lh2 + pad * 0.5 : 0; m.h = m.r1 + m.r2; }
  return m;
}
window.drawLowerThird = function (c) {
  const fx = textFx(c, state.t), m = ltSizes(c), acc = c.accent || '#4da3ff', lt = c.lt;
  const left = W * (c.x ?? 5) / 100, cy = H * (c.y ?? 82) / 100, top = cy - m.h / 2, X = left + m.w / 2;
  boxes.set(c.id, { cx: X, cy, w: m.w, h: m.h, rot: 0 });
  ctx.save();
  ctx.globalAlpha = (c.opacity ?? 1) * fadeFactor(c, state.t) * (fx ? fx.a : 1);
  if (fx) textFxApply(fx, X, cy, { x: left, y: top, w: m.w, h: m.h });
  let y1 = top + m.pad * 0.6 + m.lh1 / 2, y2 = top + m.pad * 0.6 + m.lh1 + m.lh2 / 2, subColor = c.color;
  if (lt === 'bar') { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(left, top, m.w, m.h); ctx.fillStyle = acc; ctx.fillRect(left, top, m.barW, m.h); }
  else if (lt === 'box') { ctx.fillStyle = acc; ctx.fillRect(left, top, m.w, m.h); }
  else if (lt === 'pill') { ctx.fillStyle = acc; ctx.beginPath(); ctx.roundRect(left, top, m.w, m.h, Math.min(m.h / 2, m.size * 0.6)); ctx.fill(); }
  else if (lt === 'news') {   // name on a colour bar, second line on a white strip below it
    ctx.fillStyle = acc; ctx.fillRect(left, top, m.tw + m.pad * 2, m.r1);
    if (m.sub) { ctx.fillStyle = '#ffffff'; ctx.fillRect(left, top + m.r1, m.sw + m.pad * 2, m.r2); ctx.fillStyle = acc; ctx.fillRect(left, top + m.r1, Math.max(3, m.size * 0.08), m.r2); }
    y1 = top + m.r1 / 2; y2 = top + m.r1 + m.r2 / 2; subColor = '#111111';
  }
  else if (lt === 'minimal') { ctx.fillStyle = acc; ctx.fillRect(left, top + m.pad * 0.4, m.barW, m.h - m.pad * 0.8); }
  else if (lt === 'kicker') {   // small accent label first, then the big title, with a short accent rule under it
    y2 = top + m.pad * 0.6 + m.lh2 / 2; y1 = top + m.pad * 0.6 + m.lh2 + m.lh1 / 2; subColor = acc;
    ctx.fillStyle = acc; ctx.fillRect(left + m.pad, top + m.pad * 0.6 + m.lh2 + m.lh1, Math.min(m.tw, m.size * 1.6), Math.max(3, m.size * 0.06));
  }
  else {   // 'line': no box, an accent rule between the two lines
    ctx.fillStyle = acc; ctx.fillRect(left + m.pad, top + m.pad * 0.6 + m.lh1 - m.size * 0.02, Math.max(m.tw, m.sw), Math.max(3, m.size * 0.07));
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const x0 = left + m.pad + m.barW + m.gap;
  const vis = fx && fx.chars < 1 ? textFxLines([c.text || '', m.sub], fx) : [c.text || '', m.sub];
  const outline = lt === 'line', soft = lt === 'minimal' || lt === 'kicker';
  if (soft) { ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = m.size * 0.3; ctx.shadowOffsetY = m.size * 0.04; }
  ctx.lineWidth = Math.max(2, m.size / 14); ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.fillStyle = c.color;
  ctx.font = m.f1; setSpacing(0); if (outline) ctx.strokeText(vis[0], x0, y1); ctx.fillText(vis[0], x0, y1);
  if (m.sub) {
    ctx.font = m.f2; setSpacing(m.sp); ctx.fillStyle = subColor; if (lt !== 'news' && lt !== 'kicker') ctx.globalAlpha *= 0.9;
    if (outline) ctx.strokeText(vis[1], x0, y2); ctx.fillText(vis[1], x0, y2); setSpacing(0);
  }
  ctx.restore();
};

// ---------- minimal kinetic title styles (clip field ts) ----------
// Clean monochrome looks: a frame that draws itself, an open bracket frame, a white bar with cut-out text,
// a quote with a name tag, and stacked lines. Second line in c.sub, bar/frame colour in c.accent.
const TS_STYLES = { frame: 'Title in a thin frame', bracket: 'Open bracket frame', inverse: 'White bar, cut-out text', quote: 'Quote with name tag', stack: 'Stacked lines (bar / spaced / bar)',
  neon: 'Neon glow', highlight: 'Highlighted words (*word*)', elegance: 'Big serif + spaced subtitle', boxline: 'Second line on a white box', tilt: 'Tilted outline + colour word', sale: 'Sale ribbon', sport: 'Sport title + script word', slant: 'Slanted logo + name bar' };
const TRENDY = new Set(['neon', 'highlight', 'elegance', 'boxline', 'tilt', 'sale', 'sport', 'slant']);
const STYLE_FONT = {
  elegance: '"Rockwell", "Didot", Georgia, serif',
  sport: '"Avenir Next Condensed", Impact, "Arial Narrow", sans-serif',
  sale: '"Avenir Next Condensed", Impact, sans-serif',
  tilt: '"Avenir Next", Futura, sans-serif',
};
const SCRIPT = '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive';
const para = (x, y, w, h, k) => { const o = h * k; ctx.beginPath(); ctx.moveTo(x + o, y); ctx.lineTo(x + w + o, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); };   // slanted box
function drawTrendy(c, fx, grow) {
  const st = c.ts, s = c.size, acc = c.accent || '#ffffff', ink = '#111111', fam = c.font || STYLE_FONT[st] || MODERN;
  const X = W * (c.x ?? 50) / 100, cy = H * (c.y ?? 50) / 100;
  const reveal = arr => fx && fx.chars < 1 ? textFxLines(arr, fx) : arr;
  const font = (w, px, sp = 0, f = fam) => { ctx.font = `${w} ${px}px ${f}`; setSpacing(sp); return ctx; };
  const place = (box, rot = 0) => { boxes.set(c.id, { cx: box.x + box.w / 2, cy: box.y + box.h / 2, w: box.w, h: box.h, rot }); if (fx) textFxApply(fx, box.x + box.w / 2, box.y + box.h / 2, box); };
  const rotate = (deg, x, y) => { ctx.translate(x, y); ctx.rotate(deg * Math.PI / 180); ctx.translate(-x, -y); };
  const soft = () => { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = s * 0.25; ctx.shadowOffsetY = s * 0.03; };
  const noShadow = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };
  const text = c.text || '', sub = c.sub || '';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  if (st === 'neon') {   // glowing tube text that flickers on, with a glowing underline
    font('italic 800', s, s * 0.02); const tw = ctx.measureText(text).width;
    const ss = s * 0.32, h = s * 1.2 + (sub ? ss * 1.8 : 0), top = cy - h / 2, ty = top + s * 0.6;
    place({ x: X - tw / 2 - s * 0.3, y: top, w: tw + s * 0.6, h });
    if (grow < 1 && Math.sin(state.t * 70) < -0.2) ctx.globalAlpha *= 0.3;
    const vis = reveal([text, sub]);
    for (const b of [s * 0.9, s * 0.45, s * 0.18]) { ctx.shadowColor = acc; ctx.shadowBlur = b; ctx.fillStyle = acc; ctx.fillText(vis[0], X, ty); }
    ctx.shadowBlur = s * 0.08; ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= 0.85; ctx.fillText(vis[0], X, ty); ctx.globalAlpha /= 0.85;
    ctx.strokeStyle = acc; ctx.lineWidth = Math.max(2, s * 0.05); ctx.lineCap = 'round'; ctx.shadowBlur = s * 0.4;
    polyPart([[X - tw / 2, ty + s * 0.62], [X + tw / 2, ty + s * 0.62]], grow);
    if (sub) { font(700, ss, ss * 0.3); ctx.shadowBlur = ss; ctx.fillStyle = '#ffffff'; ctx.fillText(vis[1], X, ty + s * 0.62 + ss * 1.2); }
  }
  else if (st === 'highlight') {   // *marked* words get a colour highlighter behind them
    font(800, s); const lh = s * 1.3, lines = text.split('\n');
    const rows = lines.map(l => { const toks = l.split(/(\*[^*]+\*)/).filter(Boolean).map(t => ({ t: t.replace(/\*/g, ''), hi: /^\*.*\*$/.test(t) })); toks.forEach(o => o.w = ctx.measureText(o.t).width); return { toks, w: toks.reduce((n, o) => n + o.w, 0) }; });
    const bw = Math.max(...rows.map(r => r.w)), top = cy - rows.length * lh / 2;
    place({ x: X - bw / 2 - s * 0.3, y: top, w: bw + s * 0.6, h: rows.length * lh });
    const plain = rows.map(r => r.toks.map(o => o.t).join('')), vis = reveal(plain);
    ctx.textAlign = 'left';
    rows.forEach((r, i) => {
      let x = X - r.w / 2, left = vis[i].length; const y = top + lh * (i + 0.5);
      for (const o of r.toks) {
        if (o.hi) { noShadow(); ctx.fillStyle = acc; ctx.fillRect(x - s * 0.08, y - s * 0.55, (o.w + s * 0.16) * grow, s * 1.1); }
        soft(); if (o.hi) noShadow(); ctx.fillStyle = c.color;
        ctx.fillText(o.t.slice(0, Math.max(0, left)), x, y); left -= o.t.length; x += o.w;
      }
    });
  }
  else if (st === 'elegance') {   // heavy serif title, small widely spaced subtitle
    font(900, s, s * 0.03); const tw = ctx.measureText(text).width;
    const ss = s * 0.2, h = s * 1.1 + (sub ? ss * 2.4 : 0), top = cy - h / 2;
    place({ x: X - tw / 2 - s * 0.2, y: top, w: tw + s * 0.4, h });
    const vis = reveal([text, sub]); soft(); ctx.fillStyle = c.color;
    ctx.fillText(vis[0], X, top + s * 0.55);
    if (sub) { font(700, ss, ss * 0.6, MODERN); ctx.fillText(vis[1], X + ss * 0.3, top + s * 1.1 + ss * 1.2); }
  }
  else if (st === 'boxline') {   // first line plain, second line in dark text on a white box
    font(800, s, s * 0.06); const tw = ctx.measureText(text).width;
    font(900, s, s * 0.06); const sw = ctx.measureText(sub).width;
    const bh = s * 1.3, h = s * 1.25 + (sub ? bh : 0), top = cy - h / 2;
    place({ x: X - Math.max(tw, sw) / 2 - s * 0.5, y: top, w: Math.max(tw, sw) + s, h });
    const vis = reveal([text, sub]);
    soft(); font(800, s, s * 0.06); ctx.fillStyle = c.color; ctx.fillText(vis[0], X, top + s * 0.6);
    if (sub) {
      noShadow(); const bw = (sw + s * 0.8) * grow, by = top + s * 1.25;
      ctx.fillStyle = acc; ctx.fillRect(X - bw / 2, by, bw, bh);
      ctx.save(); ctx.beginPath(); ctx.rect(X - bw / 2, by, bw, bh); ctx.clip();
      font(900, s, s * 0.06); ctx.fillStyle = ink; ctx.fillText(vis[1], X, by + bh / 2 + s * 0.03); ctx.restore();
    }
  }
  else if (st === 'tilt') {   // tilted: outlined word, then a solid colour word below
    const ang = -8; font('italic 900', s, s * 0.02); const tw = ctx.measureText(text).width;
    const s2 = s * 1.15; font('italic 900', s2, s2 * 0.02); const sw = ctx.measureText(sub).width;
    const h = s * 1.1 + (sub ? s2 * 0.95 : 0), top = cy - h / 2;
    place({ x: X - Math.max(tw, sw) / 2 - s * 0.3, y: top, w: Math.max(tw, sw) + s * 0.6, h }, ang);
    rotate(ang, X, cy); const vis = reveal([text, sub]);
    font('italic 900', s, s * 0.02); ctx.strokeStyle = c.color; ctx.lineWidth = Math.max(2, s * 0.045); ctx.lineJoin = 'round'; ctx.strokeText(vis[0], X - s * 0.2, top + s * 0.55);
    if (sub) { font('italic 900', s2, s2 * 0.02); soft(); ctx.fillStyle = acc; ctx.fillText(vis[1], X + s * 0.25, top + s * 1.1 + s2 * 0.42); }
  }
  else if (st === 'sale') {   // slanted colour ribbon with dark italic text, black tag below
    const ang = -4; font('italic 900', s, s * 0.01); const tw = ctx.measureText(text).width;
    const ss = s * 0.34, bh = s * 1.25, bw = tw + s * 0.9, th = ss * 1.7;
    font('italic 800', ss, ss * 0.08); const sw = ctx.measureText(sub).width;
    const h = bh + (sub ? th * 0.85 : 0), top = cy - h / 2;
    place({ x: X - bw / 2, y: top, w: bw, h }, ang);
    rotate(ang, X, cy); const vis = reveal([text, sub]);
    noShadow(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = s * 0.3; ctx.shadowOffsetY = s * 0.06;
    ctx.fillStyle = acc; para(X - bw / 2, top, bw * grow, bh, 0.25); ctx.fill(); noShadow();
    ctx.save(); para(X - bw / 2, top, bw * grow, bh, 0.25); ctx.clip();
    font('italic 900', s, s * 0.01); ctx.fillStyle = ink; ctx.fillText(vis[0], X, top + bh / 2 + s * 0.04); ctx.restore();
    if (sub) {
      const tw2 = sw + ss * 1.6, tx = X + bw / 2 - tw2 - s * 0.2, ty = top + bh - th * 0.15;
      ctx.fillStyle = '#111111'; para(tx, ty, tw2 * grow, th, 0.3); ctx.fill();
      font('italic 800', ss, ss * 0.08); ctx.fillStyle = acc; ctx.fillText(vis[1], tx + tw2 / 2 + th * 0.15, ty + th / 2);
    }
  }
  else if (st === 'sport') {   // heavy condensed italic title with a handwritten word over it
    font('italic 900', s, s * 0.01); const tw = ctx.measureText(text).width;
    const h = s * 1.4, top = cy - h / 2;
    place({ x: X - tw / 2 - s * 0.3, y: top, w: tw + s * 0.6, h });
    const vis = reveal([text, sub]); soft(); ctx.fillStyle = c.color; ctx.fillText(vis[0], X, cy);
    if (sub) {
      font(700, s * 0.75, 0, SCRIPT); const sw = ctx.measureText(sub).width, sx = X + tw / 2 - sw / 2, sy = cy + s * 0.48;
      ctx.save(); ctx.beginPath(); ctx.rect(sx - sw / 2 - s, sy - s, (sw + s * 2) * grow, s * 2); ctx.clip();
      rotate(-8, sx, sy); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = s * 0.15; ctx.fillStyle = acc; ctx.fillText(vis[1], sx, sy); ctx.restore();
    }
  }
  else if (st === 'slant') {   // broadcast name bar: slanted colour block with a logo / show name, then a silver bar with the name
    const left = W * (c.x ?? 6) / 100, h = s * 1.7, top = cy - h / 2, k = 0.35;
    font(900, s * 0.55, s * 0.04); const lw = ctx.measureText(sub).width + s * 1.2;
    font(700, s, s * 0.05); const nw = ctx.measureText(text).width + s * 2.2;
    const total = (sub ? lw : 0) + nw;
    boxes.set(c.id, { cx: left + total / 2, cy, w: total, h, rot: 0 });
    if (fx) textFxApply(fx, left + total / 2, cy, { x: left, y: top, w: total, h });
    const vis = reveal([text, sub]);
    const bx = left + (sub ? lw - h * k : 0), barW = (nw + h * k) * grow;
    const g = ctx.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, 'rgba(240,240,240,.92)'); g.addColorStop(1, 'rgba(160,160,165,.88)');
    ctx.fillStyle = g; para(bx, top, barW, h, k); ctx.fill();
    ctx.save(); para(bx, top, barW, h, k); ctx.clip(); font(700, s, s * 0.05); ctx.fillStyle = '#222222'; ctx.textAlign = 'left'; ctx.fillText(vis[0], bx + h * k + s * 0.9, cy + s * 0.04); ctx.restore();
    if (sub) {
      const lg = ctx.createLinearGradient(left, 0, left + lw, 0); lg.addColorStop(0, acc); lg.addColorStop(1, '#0b1f4d');
      ctx.fillStyle = lg; para(left, top, lw, h, k); ctx.fill();
      font(900, s * 0.55, s * 0.04); ctx.fillStyle = '#ffffff'; ctx.fillText(vis[1], left + lw / 2 + h * k / 2, cy + s * 0.03);
    }
  }
  setSpacing(0);
}
const MODERN = '"Avenir Next", Futura, "Helvetica Neue", sans-serif';
function polyPart(pts, p) {   // stroke the first p (0..1) of a polyline
  const seg = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
  let left = total * p;
  if (left <= 0) return;
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const k = Math.min(1, left / seg[i - 1]), a = pts[i - 1], b = pts[i];
    ctx.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); left -= seg[i - 1];
  }
  ctx.stroke();
}
window.drawStyledTitle = function (c) {
  const fx = textFx(c, state.t), fam = c.font || MODERN, s = c.size, acc = c.accent || '#ffffff', ink = '#111111', st = c.ts;
  const X = W * (c.x ?? 50) / 100, cy = H * (c.y ?? 50) / 100;
  const d = Math.max(0.05, Math.min(c.animDur ?? 0.6, c.dur / 2));
  const grow = outCubic(Math.min(clamp01((state.t - c.start) / (d * 1.5)), clamp01((c.start + c.dur - state.t) / d)));   // frames and bars draw on, then off
  if (TRENDY.has(st)) {
    ctx.save(); ctx.globalAlpha = (c.opacity ?? 1) * fadeFactor(c, state.t) * (fx ? fx.a : 1);
    drawTrendy(c, fx, grow); ctx.restore(); return;
  }
  const reveal = arr => fx && fx.chars < 1 ? textFxLines(arr, fx) : arr;
  const font = (w, px, sp = 0) => { ctx.font = `${w} ${px}px ${fam}`; setSpacing(sp); };
  ctx.save();
  ctx.globalAlpha = (c.opacity ?? 1) * fadeFactor(c, state.t) * (fx ? fx.a : 1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'miter';
  const lw = Math.max(2, s * 0.06);
  let box;
  if (st === 'frame' || st === 'bracket' || st === 'inverse') {
    const text = c.text || '';
    font(c.bold === false ? 400 : 800, s, s * 0.04); const tw = ctx.measureText(text).width;
    const padX = s * (st === 'inverse' ? 0.75 : 0.6), padY = s * (st === 'inverse' ? 0.55 : 0.4);
    box = { x: X - tw / 2 - padX, y: cy - s * 0.55 - padY, w: tw + padX * 2, h: s * 1.1 + padY * 2 };
    boxes.set(c.id, { cx: X, cy, w: box.w, h: box.h, rot: 0 });
    if (fx) textFxApply(fx, X, cy, box);
    ctx.strokeStyle = acc; ctx.lineWidth = lw;
    const { x, y, w, h } = box;
    if (st === 'bracket') {
      polyPart([[x + w * 0.4, y], [x, y], [x, y + h], [x + w * 0.08, y + h]], grow);
      polyPart([[x + w * 0.6, y + h], [x + w, y + h], [x + w, y], [x + w * 0.92, y]], grow);
    } else polyPart([[X, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y], [X, y]], grow);
    if (st === 'inverse') {   // white bar that opens from the centre, dark text cut into it
      const bw = (tw + s * 0.6) * grow, bh = s * 1.05;
      ctx.fillStyle = acc; ctx.fillRect(X - bw / 2, cy - bh / 2, bw, bh);
      ctx.save(); ctx.beginPath(); ctx.rect(X - bw / 2, cy - bh / 2, bw, bh); ctx.clip();
      ctx.fillStyle = ink; ctx.fillText(reveal([text])[0], X, cy + s * 0.04); ctx.restore();
    } else { ctx.fillStyle = c.color; ctx.fillText(reveal([text])[0], X, cy + s * 0.04); }
  } else if (st === 'quote') {
    font(c.bold === false ? 500 : 700, s); const lines = wrapLines(c.text || '', W * 0.72), lh = s * 1.25;
    const ss = s * 0.78, tagH = ss * 1.4, gap = s * 0.5;
    const tw = Math.max(...lines.map(l => ctx.measureText(l).width));
    font(400, ss); const sw = c.sub ? ctx.measureText(c.sub).width : 0;
    const h = lines.length * lh + (c.sub ? gap + tagH : 0), top = cy - h / 2;
    box = { x: X - Math.max(tw, sw) / 2 - s * 0.4, y: top - s * 0.2, w: Math.max(tw, sw) + s * 0.8, h: h + s * 0.4 };
    boxes.set(c.id, { cx: X, cy, w: box.w, h: box.h, rot: 0 });
    if (fx) textFxApply(fx, X, cy, box);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = s * 0.3;
    font(c.bold === false ? 500 : 700, s); ctx.fillStyle = c.color;
    reveal(lines).forEach((l, i) => { ctx.textAlign = 'left'; ctx.fillText(l, X - ctx.measureText(lines[i]).width / 2, top + lh * (i + 0.5)); });
    ctx.textAlign = 'center'; ctx.shadowBlur = 0;
    if (c.sub) {
      const ty = top + lines.length * lh + gap, tagW = (sw + ss * 0.9) * grow;
      ctx.fillStyle = acc; ctx.fillRect(X - tagW / 2, ty, tagW, tagH);
      ctx.save(); ctx.beginPath(); ctx.rect(X - tagW / 2, ty, tagW, tagH); ctx.clip();
      font(400, ss); ctx.fillStyle = ink; ctx.fillText(c.sub, X, ty + tagH / 2); ctx.restore();
    }
  } else {   // 'stack': even lines on a white bar in thin dark capitals, odd lines in white spaced bold capitals
    const lines = String(c.text || '').toUpperCase().split('\n'), gapY = s * 0.18;
    const spec = lines.map((l, i) => {
      const bar = i % 2 === 0, px = bar ? s : s * 0.62, sp = bar ? s * 0.01 : s * 0.38;
      font(bar ? 300 : 800, px, sp); return { l, bar, px, sp, w: ctx.measureText(l).width, h: bar ? s * 1.2 : px * 1.5 };
    });
    const bw = Math.max(...spec.map(o => o.w)) + s * 0.6, H2 = spec.reduce((n, o) => n + o.h, 0) + gapY * (spec.length - 1);
    box = { x: X - bw / 2, y: cy - H2 / 2, w: bw, h: H2 };
    boxes.set(c.id, { cx: X, cy, w: box.w, h: box.h, rot: 0 });
    if (fx) textFxApply(fx, X, cy, box);
    const vis = reveal(spec.map(o => o.l));
    let y = box.y;
    spec.forEach((o, i) => {
      font(o.bar ? 300 : 800, o.px, o.sp);
      if (o.bar) { ctx.fillStyle = acc; ctx.fillRect(box.x, y, bw * grow, o.h); ctx.fillStyle = ink; }
      else ctx.fillStyle = c.color;
      ctx.textAlign = 'left'; ctx.fillText(vis[i], X - o.w / 2, y + o.h / 2 + o.px * 0.04);
      y += o.h + gapY;
    });
  }
  setSpacing(0);
  ctx.restore();
};

// ---------- inspector section for text clips ----------
window.textFxSection = function (c) {
  const sel = (f, map, cur) => `<select data-f="${f}">${Object.entries(map).map(([k, v]) => `<option value="${k}" ${(cur || 'none') === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
  return `<h3>Animation</h3>`
    + (c.lt ? `<label>Second line (lower third)</label><input type="text" data-f="sub" value="${attr(c.sub)}">`
      + `<label>Style</label><select data-f="lt">${Object.entries(LT_STYLES).map(([k, v]) => `<option value="${k}" ${c.lt === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`
      + `<label>Accent colour</label><input type="color" data-f="accent" value="${c.accent || '#4da3ff'}">` : '')
    + (c.ts ? `<label>Second line (name / author)</label><input type="text" data-f="sub" value="${attr(c.sub)}">`
      + `<label>Title style</label><select data-f="ts">${Object.entries(TS_STYLES).map(([k, v]) => `<option value="${k}" ${c.ts === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`
      + `<label>Frame / bar colour</label><input type="color" data-f="accent" value="${c.accent || '#ffffff'}">`
      + (c.ts === 'stack' ? `<p class="muted">Put each line of a stacked title on its own line in the Text box.</p>` : c.ts === 'highlight' ? `<p class="muted">Put *stars* around the words to highlight, e.g. it's *essential*.</p>` : '') : '')
    + `<label>Animation in</label>${sel('animIn', ANIM_IN, c.animIn)}<label>Animation out</label>${sel('animOut', ANIM_OUT, c.animOut)}`
    + `<label>Animation length (s)</label><input type="range" min="0.1" max="3" step="0.1" data-f="animDur" value="${c.animDur ?? 0.6}">`
    + `<div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="tx-preview">▶ Preview from the start</button><button type="button" id="tx-font">Add font file…</button></div>`
    + `<p class="muted">Fonts you add (.ttf .otf .woff .woff2) stay in this browser and appear in the Font list.</p>`;
};
document.body.append(Object.assign(document.createElement('input'), { type: 'file', id: 'tx-font-file', accept: '.ttf,.otf,.woff,.woff2', hidden: true, multiple: true }));
$('#inspector').addEventListener('click', e => {
  const b = e.target.closest('button'), c = selClip();
  if (!b || !c) return;
  if (b.id === 'tx-preview') { if (state.playing) play(); seek(Math.max(0, c.start - 0.2)); play(); }
  if (b.id === 'tx-font') $('#tx-font-file').click();
});
// animation fields that change how the clip looks need a redraw only; the generic handler does that. A change of style re-lays the inspector.
$('#inspector').addEventListener('change', e => { if (e.target.dataset && (e.target.dataset.f === 'lt' || e.target.dataset.f === 'ts')) renderInspector(); });

// ---------- custom fonts (kept in IndexedDB key 'fonts') ----------
const fontData = new Map();   // family -> ArrayBuffer
async function registerFont(name, buf) {
  const ff = new FontFace(name, buf.slice(0));
  await ff.load();
  document.fonts.add(ff);
  const v = `"${name}", sans-serif`;
  if (!FONTS.some(f => f[1] === v)) FONTS.push([name, v]);
  fontData.set(name, buf);
}
const saveFonts = () => idb('kv', 'readwrite', st => st.put(Object.fromEntries(fontData), 'fonts')).catch(() => {});
$('#tx-font-file').onchange = async e => {
  const files = [...e.target.files]; e.target.value = '';
  const c = selClip(), bad = [];
  let last = null;
  for (const f of files) {
    const name = f.name.replace(/\.[^.]+$/, '').replace(/[^\w \-]/g, '').trim() || 'Custom font';
    try { await registerFont(name, await f.arrayBuffer()); last = name; } catch { bad.push(f.name); }
  }
  await saveFonts();
  if (last && c && c.text != null) { pushHistory(); c.font = `"${last}", sans-serif`; afterEdit(); }
  else if (selClip()) renderInspector();
  toast(bad.length ? `Could not read: ${bad.join(', ')}` : last ? `Font added: ${last}` : 'No font added');
};
idb('kv', 'readonly', st => st.get('fonts')).then(async o => {
  for (const [n, b] of Object.entries(o || {})) await registerFont(n, b).catch(() => {});
  if (selClip()) renderInspector();
  draw();
}).catch(() => {});

// ---------- title and lower-third presets ----------
const TITLES = [
  { k: 'Big title (pop)', g: 'Titles', p: { text: 'Your Title', size: 120, y: 50, bold: true, animIn: 'pop', animOut: 'fade', animDur: 0.7, dur: 4 } },
  { k: 'Cinematic (blur in)', g: 'Titles', p: { text: 'Your Title', size: 96, y: 50, font: 'Georgia, serif', animIn: 'blur', animOut: 'fade', animDur: 1.4, dur: 5 } },
  { k: 'Typewriter', g: 'Titles', p: { text: 'Your Title', size: 72, y: 50, font: 'Menlo, monospace', animIn: 'type', animOut: 'fade', animDur: 1.5, dur: 4 } },
  { k: 'Slide in', g: 'Titles', p: { text: 'Your Title', size: 100, y: 50, animIn: 'left', animOut: 'right', animDur: 0.7, dur: 4 } },
  { k: 'Wipe reveal', g: 'Titles', p: { text: 'Your Title', size: 100, y: 50, bg: true, animIn: 'wipe', animOut: 'wipe', animDur: 0.8, dur: 4 } },
  { k: 'Word by word', g: 'Titles', p: { text: 'Your Title goes here', size: 84, y: 50, animIn: 'words', animOut: 'fade', animDur: 1.5, dur: 5 } },
  { k: 'Lower third: colour bar', g: 'Lower thirds', p: { text: 'Name Surname', sub: 'Job title or place', size: 44, y: 82, lt: 'bar', accent: '#4da3ff', animIn: 'left', animOut: 'left', animDur: 0.6, dur: 5 } },
  { k: 'Lower third: solid box', g: 'Lower thirds', p: { text: 'Name Surname', sub: 'Job title or place', size: 44, y: 82, lt: 'box', accent: '#e63946', animIn: 'wipe', animOut: 'wipe', animDur: 0.6, dur: 5 } },
  { k: 'Lower third: line', g: 'Lower thirds', p: { text: 'Name Surname', sub: 'Job title or place', size: 44, y: 82, lt: 'line', accent: '#ffd166', animIn: 'up', animOut: 'fade', animDur: 0.6, dur: 5 } },
  // Professional: the common broadcast, corporate and interview looks found in stock template packs, built from the styles above.
  { k: 'News lower third', g: 'Professional', p: { text: 'Name Surname', sub: 'Job title · Company', size: 46, y: 82, lt: 'news', accent: '#c8102e', animIn: 'wipe', animOut: 'wipe', animDur: 0.5, dur: 6 } },
  { k: 'Minimal corporate', g: 'Professional', p: { text: 'Name Surname', sub: 'Chief Executive Officer', size: 46, y: 82, lt: 'minimal', accent: '#4da3ff', animIn: 'left', animOut: 'fade', animDur: 0.7, dur: 6 } },
  { k: 'Interview name', g: 'Professional', p: { text: 'Name Surname', sub: 'Role or expertise', size: 42, y: 84, lt: 'bar', accent: '#2ec4b6', font: 'Georgia, serif', animIn: 'left', animOut: 'left', animDur: 0.6, dur: 6 } },
  { k: 'Chapter title', g: 'Professional', p: { text: 'The Beginning', sub: 'Chapter 01', size: 92, x: 8, y: 50, lt: 'kicker', accent: '#ffd166', animIn: 'up', animOut: 'fade', animDur: 0.9, dur: 5 } },
  { k: 'Location & date', g: 'Professional', p: { text: 'Colombo, Sri Lanka', sub: 'November 2026', size: 40, y: 86, lt: 'minimal', accent: '#ffffff', animIn: 'type', animOut: 'fade', animDur: 1.2, dur: 5 } },
  { k: 'Breaking news', g: 'Professional', p: { text: 'BREAKING NEWS', sub: 'Your headline goes here', size: 48, y: 80, lt: 'news', accent: '#e10600', animIn: 'left', animOut: 'left', animDur: 0.5, dur: 6 } },
  { k: 'Social handle tag', g: 'Professional', p: { text: '@yourhandle', sub: '', size: 40, y: 88, lt: 'pill', accent: '#ff3d71', animIn: 'pop', animOut: 'shrink', animDur: 0.6, dur: 4 } },
  { k: 'Corporate glass title', g: 'Professional', p: { text: 'Your Company', size: 88, y: 50, glass: true, animIn: 'up', animOut: 'fade', animDur: 0.9, dur: 5 } },
  { k: 'Elegant serif title', g: 'Professional', p: { text: 'Your Title', size: 96, y: 50, bold: false, font: 'Georgia, serif', animIn: 'blur', animOut: 'blur', animDur: 1.2, dur: 5 } },
  { k: 'Quote', g: 'Professional', p: { text: '“Your quote goes here.”', size: 64, y: 48, bold: false, font: 'Georgia, serif', animIn: 'words', animOut: 'fade', animDur: 2, dur: 7 } },
  { k: 'Call to action', g: 'Professional', p: { text: 'Subscribe for more', size: 72, y: 50, bg: true, animIn: 'pop', animOut: 'shrink', animDur: 0.6, dur: 4 } },
  // Minimal kinetic: clean black-and-white title looks (frame draws on, cut-out bar, quote tag, stacked lines).
  { k: 'Framed title', g: 'Minimal kinetic', p: { text: 'YOUR TITLE', size: 84, y: 50, ts: 'frame', accent: '#ffffff', animIn: 'up', animOut: 'fade', animDur: 0.8, dur: 5 } },
  { k: 'Open bracket title', g: 'Minimal kinetic', p: { text: 'TRENDY TITLES', size: 84, y: 50, ts: 'bracket', accent: '#ffffff', animIn: 'wipe', animOut: 'wipe', animDur: 0.8, dur: 5 } },
  { k: 'Cut-out bar title', g: 'Minimal kinetic', p: { text: 'MINIMALISM', size: 72, y: 50, ts: 'inverse', accent: '#ffffff', animIn: 'zoom', animOut: 'shrink', animDur: 0.8, dur: 5 } },
  { k: 'Quote with author', g: 'Minimal kinetic', p: { text: '"Your quote goes here, short and memorable."', sub: 'Author Name', size: 46, y: 50, ts: 'quote', accent: '#ffffff', animIn: 'words', animOut: 'fade', animDur: 1.6, dur: 7 } },
  { k: 'Stacked statement', g: 'Minimal kinetic', p: { text: 'Not just what it looks\nSimplicity is\nBut how it works', size: 60, y: 50, ts: 'stack', accent: '#ffffff', animIn: 'left', animOut: 'fade', animDur: 0.8, dur: 6 } },
  // Bold & trendy: neon, highlighted keywords, big serif, boxed line, tilted kinetic, sale ribbon, sport, slanted broadcast name bar.
  { k: 'Neon glow (pink)', g: 'Bold & trendy', p: { text: 'DYNAMIC', sub: '', size: 110, y: 50, ts: 'neon', accent: '#ff2bd6', animIn: 'zoom', animOut: 'fade', animDur: 0.9, dur: 5 } },
  { k: 'Neon glow (blue)', g: 'Bold & trendy', p: { text: 'NEON LINE', sub: 'YOUR SUBTITLE', size: 100, y: 50, ts: 'neon', accent: '#27e1ff', animIn: 'fade', animOut: 'fade', animDur: 0.9, dur: 5 } },
  { k: 'Highlighted words', g: 'Bold & trendy', p: { text: "Marketing isn't a *luxury*,\nit's *essential*.", size: 64, y: 50, ts: 'highlight', accent: '#7b61ff', animIn: 'up', animOut: 'fade', animDur: 0.8, dur: 5 } },
  { k: 'Elegance title', g: 'Bold & trendy', p: { text: 'ELEGANCE', sub: 'IS ELIMINATION', size: 130, y: 50, ts: 'elegance', animIn: 'blur', animOut: 'fade', animDur: 1.1, dur: 5 } },
  { k: 'Boxed second line', g: 'Bold & trendy', p: { text: 'EVERY MOMENT IS', sub: 'A FRESH BEGINNING', size: 60, y: 50, ts: 'boxline', accent: '#ffffff', animIn: 'up', animOut: 'fade', animDur: 0.8, dur: 5 } },
  { k: 'Tilted kinetic', g: 'Bold & trendy', p: { text: 'REMEMBER', sub: 'THIS', size: 100, y: 50, ts: 'tilt', accent: '#2ee6a6', animIn: 'pop', animOut: 'shrink', animDur: 0.7, dur: 4 } },
  { k: 'Sale ribbon', g: 'Bold & trendy', p: { text: 'BLACK FRIDAY', sub: 'UP TO 70% OFF', size: 90, y: 50, ts: 'sale', accent: '#ffd400', animIn: 'left', animOut: 'right', animDur: 0.6, dur: 4 } },
  { k: 'Sport title', g: 'Bold & trendy', p: { text: 'GAME DAY', sub: "Let's go", size: 130, y: 50, ts: 'sport', accent: '#e10600', animIn: 'zoom', animOut: 'fade', animDur: 0.7, dur: 4 } },
  { k: 'Slanted name bar', g: 'Bold & trendy', p: { text: 'NAME SURNAME', sub: 'YOUR SHOW', size: 40, x: 6, y: 80, ts: 'slant', accent: '#2f7bff', animIn: 'left', animOut: 'left', animDur: 0.6, dur: 6 } },
];
function titlesTrack() {
  let i = TRACKS.findIndex(t => t.kind === 'text' && t.name === 'Titles');
  if (i < 0) { addLayer('text'); i = TRACKS.length - 1; TRACKS[i].name = 'Titles'; buildLabels(); }
  activeTrack.text = i;
  return i;
}
function addTitle(preset, text, sub, at, noHistory) {   // at: start time (default the playhead); noHistory: the caller already saved an undo step
  if (!noHistory) pushHistory();
  const track = titlesTrack(), p = preset.p;
  let start = typeof at === 'number' ? at : state.t;
  if (!fits({ id: -1 }, start, p.dur, track)) start = laneEnd(track);
  const c = { ...newTextClip(text || p.text, start, p.dur), track, ...p, text: text || p.text };
  if (c.lt) { c.sub = sub ?? p.sub; c.x = p.x ?? 5; c.color = '#ffffff'; }
  if (c.ts) { c.sub = sub || p.sub || ''; c.x = p.x ?? 50; c.color = '#ffffff'; }
  delete c.k;
  state.clips.push(c);
  state.sel = c.id;
  afterEdit();
  return c;
}
Object.assign(window.TITLE_API, { TITLES, addTitle, TS_STYLES, LT_STYLES });
const dlg = document.createElement('dialog');
dlg.id = 'tt-dialog';
dlg.innerHTML = `<form method="dialog"><h3>Titles &amp; lower thirds</h3>
  <label>Title / name</label><input type="text" id="tt-text" placeholder="Your Title">
  <label>Second line (lower thirds only)</label><input type="text" id="tt-sub" placeholder="Job title or place">
  <div id="tt-list"></div>
  <p class="muted">The title is added at the playhead on a "Titles" layer. Change the look and animation in the Inspector afterwards.</p>
  <div class="row"><button type="button" id="tt-close">Close</button></div></form>`;
document.body.append(dlg);
const st = document.createElement('style');
st.textContent = `#tt-dialog,#ex-dialog{background:#1d1f25;color:#e6e6e6;border:1px solid #3a3d46;border-radius:8px;width:460px;max-width:94vw}
#tt-dialog::backdrop,#ex-dialog::backdrop{background:rgba(0,0,0,.6)}
#tt-dialog h3,#ex-dialog h3{margin:0 0 8px}
#tt-dialog label,#ex-dialog label{display:block;margin:8px 0 2px;color:#999;font-size:11px}
#tt-dialog input[type=text]{width:100%;box-sizing:border-box;background:#141518;color:inherit;border:1px solid #3a3d46;border-radius:4px;padding:6px;font:inherit}
#tt-list h4{margin:10px 0 4px;color:#9aa}
#tt-list button,#ex-dialog .ex-row button{margin:2px 4px 2px 0}
#tt-dialog .row,#ex-dialog .row{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
#ex-dialog .ex-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #2a2d35}#ex-dialog .ex-row b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;
document.head.append(st);
function fillTitles() {
  let h = '', g = '';
  TITLES.forEach((t, i) => { if (t.g !== g) { g = t.g; h += `<h4>${g}</h4>`; } h += `<button type="button" data-ti="${i}">${t.k.replace(/^Lower third: /, '')}</button>`; });
  $('#tt-list').innerHTML = h;
}
$('#btn-titles').onclick = () => { fillTitles(); dlg.showModal(); };
if ($('#btn-titles-2')) $('#btn-titles-2').onclick = () => $('#btn-titles').click();   // same dialog, also reachable from the Text menu
$('#tt-close').onclick = () => dlg.close();
$('#tt-list').addEventListener('click', e => {
  const b = e.target.closest('button[data-ti]');
  if (!b) return;
  const t = TITLES[+b.dataset.ti], text = $('#tt-text').value.trim(), sub = $('#tt-sub').value.trim();
  addTitle(t, text, t.p.lt || t.p.ts ? (sub || t.p.sub) : undefined);
  dlg.close();
  toast('Added. Press play to see the animation, or use "Preview" in the Inspector.');
});

// ---------- SRT / VTT export of text layers ----------
const vttTime = s => srtTime(s).replace(',', '.');
function layerCaptions(i) {
  return state.clips.filter(c => c.track === i && c.text != null && !c.lt && String(c.text).trim()).sort((a, b) => a.start - b.start);
}
function exportCaptions(i, fmt) {
  const cs = layerCaptions(i);
  if (!cs.length) return toast('That layer has no captions');
  const name = TRACKS[i].name.replace(/[^\w\-]+/g, '_');
  if (fmt === 'srt') download(`${name}.srt`, cs.map((c, k) => `${k + 1}\n${srtTime(c.start)} --> ${srtTime(c.start + c.dur)}\n${c.text}\n`).join('\n'));
  else download(`${name}.vtt`, 'WEBVTT\n\n' + cs.map(c => `${vttTime(c.start)} --> ${vttTime(c.start + c.dur)}\n${c.text}\n`).join('\n'));
}
const ex = document.createElement('dialog');
ex.id = 'ex-dialog';
ex.innerHTML = `<form method="dialog"><h3>Export captions</h3><div id="ex-rows"></div><p class="muted">Translated captions are on their own "Translation" layer, so you can export each language separately. Speaker names are never included.</p><div class="row"><button type="button" id="ex-close">Close</button></div></form>`;
document.body.append(ex);
$('#btn-srt-out').onclick = () => {
  const rows = TRACKS.map((t, i) => ({ t, i, n: layerCaptions(i).length })).filter(r => r.t.kind === 'text' && r.n);
  $('#ex-rows').innerHTML = rows.map(r => `<div class="ex-row" data-i="${r.i}"><b title="${attr(r.t.name)}">${attr(r.t.name)}</b><span class="muted">${r.n} lines</span><button type="button" data-fmt="srt">SRT</button><button type="button" data-fmt="vtt">VTT</button></div>`).join('') || '<p class="muted">There are no captions on the timeline yet.</p>';
  ex.showModal();
};
$('#ex-rows').addEventListener('click', e => { const b = e.target.closest('button[data-fmt]'), r = e.target.closest('.ex-row'); if (b && r) exportCaptions(+r.dataset.i, b.dataset.fmt); });
$('#ex-close').onclick = () => ex.close();
})();
