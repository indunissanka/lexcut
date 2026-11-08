'use strict';
// Effects library: picture in picture, masks, 3D flip, motion tracking, animation presets (2D/3D, logo), particles, lens flare,
// cinematic effects, shapes/counters (motion graphics) and custom effect presets.
// Effect/graphic clips are text-layer clips with c.fxType (text = ''), drawn procedurally from the clock only, so preview and export match.
(() => {
const attr = t => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rnd = (i, k, seed) => { let a = (i * 97 + k * 57 + (seed || 1) * 1013) | 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const tmpCv = [];
function tmp(i, w, h) {
  const cv = tmpCv[i] || (tmpCv[i] = document.createElement('canvas'));
  w = Math.max(2, Math.min(8192, Math.ceil(w))); h = Math.max(2, Math.min(8192, Math.ceil(h)));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d', { willReadFrequently: false });
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowBlur = 0; g.clearRect(0, 0, w, h);
  return [cv, g];
}
function shapePath(g, s, x, y, w, h, rad) {   // centred at x,y
  g.beginPath();
  const l = x - w / 2, t = y - h / 2, r = x + w / 2, b = y + h / 2;
  switch (s) {
    case 'ellipse': g.ellipse(x, y, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); break;
    case 'rrect': g.roundRect(l, t, w, h, Math.min(Math.abs(w), Math.abs(h)) * (rad ?? 0.2)); break;
    case 'diamond': g.moveTo(x, t); g.lineTo(r, y); g.lineTo(x, b); g.lineTo(l, y); g.closePath(); break;
    case 'triangle': g.moveTo(x, t); g.lineTo(r, b); g.lineTo(l, b); g.closePath(); break;
    case 'star': for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.45 : 1, px = x + Math.cos(a) * w / 2 * q, py = y + Math.sin(a) * h / 2 * q; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); break;
    case 'heart': g.moveTo(x, b); g.bezierCurveTo(l - w * 0.1, y + h * 0.1, l + w * 0.05, t - h * 0.05, x, t + h * 0.28); g.bezierCurveTo(r - w * 0.05, t - h * 0.05, r + w * 0.1, y + h * 0.1, x, b); g.closePath(); break;
    default: g.rect(l, t, w, h);
  }
}
const MASKS = { none: 'No mask', rect: 'Rectangle', rrect: 'Rounded rectangle', ellipse: 'Circle / ellipse', diamond: 'Diamond', triangle: 'Triangle', star: 'Star', heart: 'Heart' };

// ---------- 3D flip: perspective by vertical (or horizontal) strips ----------
function persp(src, sx, sy, sw, sh, dw, dh, ang, vertical, slot) {
  const OW = Math.min(8192, dw * 1.5), OH = Math.min(8192, dh * 1.5), [cv, g] = tmp(slot, OW, OH);
  const th = ang * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th), N = 72, span = vertical ? dh : dw, D = span * 2.2;
  for (let i = 0; i < N; i++) {
    const u0 = i / N - 0.5, u1 = (i + 1) / N - 0.5, um = (u0 + u1) / 2;
    const P = u => { const z = u * span * sn, s = D / (D + z); return [u * span * cs * s, s]; };
    const [a0] = P(u0), [a1] = P(u1), [, sm] = P(um), lo = Math.min(a0, a1), len = Math.abs(a1 - a0) + 0.7;
    if (vertical) g.drawImage(src, sx, sy + (i / N) * sh, sw, sh / N, OW / 2 - dw * sm / 2, OH / 2 + lo, dw * sm, len);
    else g.drawImage(src, sx + (i / N) * sw, sy, sw / N, sh, OW / 2 + lo, OH / 2 - dh * sm / 2, len, dh * sm);
  }
  return [cv, OW, OH];
}
window.drawMediaFx = function (c, src, sx, sy, sw, sh, rw, rh, tRotY) {
  const RW = Math.max(2, Math.min(4096, Math.ceil(rw))), RH = Math.max(2, Math.min(4096, Math.ceil(rh))), fk = rw / RW;
  let img = src, ix = sx, iy = sy, iw = sw, ih = sh;
  const hasMask = c.mask && c.mask !== 'none';
  if (hasMask || c.round > 0) {
    const [cv, g] = tmp(0, RW, RH);
    g.drawImage(src, sx, sy, sw, sh, 0, 0, RW, RH);
    g.fillStyle = '#000';
    if (c.round > 0) { g.globalCompositeOperation = 'destination-in'; shapePath(g, 'rrect', RW / 2, RH / 2, RW, RH, c.round / 100); g.fill(); }
    if (hasMask) {
      g.globalCompositeOperation = c.maskInv ? 'destination-out' : 'destination-in';
      if (c.feather > 0) g.filter = `blur(${(c.feather / fk).toFixed(1)}px)`;
      shapePath(g, c.mask, RW / 2 + (c.mx || 0) / 100 * RW, RH / 2 + (c.my || 0) / 100 * RH, (c.mw ?? 60) / 100 * RW, (c.mh ?? 60) / 100 * RH);
      g.fill();
    }
    img = tmpCv[0]; ix = 0; iy = 0; iw = RW; ih = RH;
  }
  const ry = (c.rotY || 0) + (tRotY || 0), rx = c.rotX || 0;
  if (c.shadow > 0) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = c.shadow; ctx.shadowOffsetY = c.shadow / 3; }
  if (ry || rx) {
    let cur = img, a = ix, b = iy, w = iw, h = ih, dw = RW, dh = RH, slot = 1;
    if (ry) { [cur, dw, dh] = persp(cur, a, b, w, h, dw, dh, ry, false, slot); a = 0; b = 0; w = dw; h = dh; slot = 2; }
    if (rx) { const [o, ow, oh] = persp(cur, a, b, w, h, dw, dh, rx, true, slot); cur = o; dw = ow; dh = oh; }
    ctx.drawImage(cur, -dw * fk / 2, -dh * fk / 2, dw * fk, dh * fk);
  } else ctx.drawImage(img, ix, iy, iw, ih, -rw / 2, -rh / 2, rw, rh);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if (c.border > 0 && !(ry || rx)) {
    ctx.save(); ctx.lineWidth = c.border; ctx.strokeStyle = c.borderColor || '#ffffff';
    shapePath(ctx, c.round > 0 ? 'rrect' : 'rect', 0, 0, rw, rh, (c.round || 0) / 100); ctx.stroke(); ctx.restore();
  }
  if (hasMask && c.id === state.sel && !exporting) {   // mask outline while the clip is selected
    ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = '#4da3ff'; ctx.setLineDash([8, 6]);
    shapePath(ctx, c.mask, (c.mx || 0) / 100 * rw, (c.my || 0) / 100 * rh, (c.mw ?? 60) / 100 * rw, (c.mh ?? 60) / 100 * rh); ctx.stroke(); ctx.restore();
  }
};

// ---------- effect and graphic clips ----------
const PALETTE = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ffffff'];
function wrap(v, m) { return ((v % m) + m) % m; }
function particles(c, t, a, S) {
  const n = Math.round(clamp(c.amount ?? 50, 1, 100) * (c.fxType === 'rain' ? 5 : c.fxType === 'confetti' ? 2 : 2.5)), sp = c.fxSpeed ?? 1, seed = c.seed || 1, col = c.color || '#ffffff';
  ctx.save();
  for (let i = 0; i < n; i++) {
    const r1 = rnd(i, 1, seed), r2 = rnd(i, 2, seed), r3 = rnd(i, 3, seed), r4 = rnd(i, 4, seed), r5 = rnd(i, 5, seed);
    if (c.fxType === 'snow') {
      const x = wrap(r1 * W + Math.sin(t * 0.8 * sp + r2 * 6.28) * 30 * S * (0.5 + r3), W), y = wrap(r4 * H + t * sp * (30 + r3 * 70) * S, H + 20) - 10;
      ctx.globalAlpha = a * (0.4 + 0.6 * r3); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, (1 + r5 * 3.2) * S, 0, 7); ctx.fill();
    } else if (c.fxType === 'rain') {
      const len = (14 + r3 * 22) * S, vy = (700 + r3 * 400) * S * sp, y = wrap(r4 * (H + 60) + t * vy, H + 60) - 30, x = wrap(r1 * (W + 200) - 100 + (y / H) * 60 * S, W + 200) - 100;
      ctx.globalAlpha = a * (0.25 + 0.35 * r5); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, S); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * 0.18, y + len); ctx.stroke();
    } else if (c.fxType === 'confetti') {
      const x = wrap(r1 * W + Math.sin(t * 1.6 * sp + r2 * 6.28) * 40 * S, W), y = wrap(r4 * (H + 80) + t * sp * (110 + r3 * 150) * S, H + 80) - 40, w = (6 + r5 * 8) * S;
      ctx.globalAlpha = a; ctx.save(); ctx.translate(x, y); ctx.rotate(t * (2 + r3 * 5) * sp + r2 * 6.28); ctx.scale(1, Math.cos(t * 4 * sp + r1 * 9)); ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fillRect(-w / 2, -w / 4, w, w / 2); ctx.restore();
    } else if (c.fxType === 'bubbles') {
      const rad = (5 + r3 * 22) * S, x = wrap(r1 * W + Math.sin(t * 0.9 * sp + r2 * 6.28) * 25 * S, W), y = H + rad - wrap(r4 * (H + rad * 2) + t * sp * (40 + r5 * 80) * S, H + rad * 2);
      ctx.globalAlpha = a * 0.55; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, 1.5 * S); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.stroke();
      ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.18, 0, 7); ctx.fill();
    } else if (c.fxType === 'fireflies') {
      const bx = r1 * W, by = r4 * H, x = bx + Math.sin(t * 0.5 * sp + r2 * 6.28) * 80 * S + Math.sin(t * 1.3 * sp + r3 * 9) * 20 * S, y = by + Math.cos(t * 0.4 * sp + r3 * 6.28) * 60 * S, tw = 0.5 + 0.5 * Math.sin(t * 2.2 * sp + r5 * 9), rad = (6 + r2 * 10) * S;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.2); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * tw * 0.9; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rad * 2.2, 0, 7); ctx.fill();
    } else if (c.fxType === 'sparks') {
      const L = 0.7 + r1 * 0.9, u = wrap(t * sp + r2 * L, L) / L, ang = -Math.PI / 2 + (r3 - 0.5) * 2.2, v = (180 + r4 * 340) * S, ex = W * (c.x ?? 50) / 100, ey = H * (c.y ?? 80) / 100;
      const x = ex + Math.cos(ang) * v * u * L, y = ey + Math.sin(ang) * v * u * L + 380 * S * u * u * L * L;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (1 - u); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, (0.6 + 2.6 * (1 - u)) * S, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
  if (c.fxType === 'sparks') boxes.set(c.id, { cx: W * (c.x ?? 50) / 100, cy: H * (c.y ?? 80) / 100, w: 60 * S, h: 60 * S, rot: 0 });
}
function flare(c, t, a, S) {
  const amt = clamp((c.amount ?? 70) / 100, 0.05, 1.5), col = c.color || '#ffd9a0', prog = clamp(t / Math.max(0.1, c.dur), 0, 1);
  const X = c.sweep ? W * (0.1 + 0.8 * prog) : W * (c.x ?? 70) / 100, Y = c.sweep ? H * ((c.y ?? 30) / 100 + 0.08 * Math.sin(prog * 3.14)) : H * (c.y ?? 30) / 100, cx = W / 2, cy = H / 2;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, al, color) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = a * al; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  glow(X, Y, H * 0.42 * amt, 0.55, col); glow(X, Y, H * 0.1 * amt, 1, '#ffffff');
  ctx.save(); ctx.translate(X, Y); ctx.scale(1, 0.035); glow(0, 0, W * 0.55 * amt, 0.9, col); ctx.restore();   // anamorphic streak
  ctx.globalAlpha = a * 0.22 * amt; ctx.strokeStyle = col; ctx.lineWidth = 3 * S; ctx.beginPath(); ctx.arc(X, Y, H * 0.16 * amt, 0, 7); ctx.stroke();
  [[0.45, 0.05, '#ff9a6b'], [0.8, 0.08, '#7bd6ff'], [1.25, 0.04, '#b69bff'], [1.7, 0.1, '#ffe27a'], [-0.35, 0.06, '#8bff9a']].forEach(([k, r, cl]) => glow(X + (cx - X) * k, Y + (cy - Y) * k, H * r * (0.6 + amt * 0.6), 0.35 * amt, cl));
  ctx.restore();
  boxes.set(c.id, { cx: X, cy: Y, w: 70 * S, h: 70 * S, rot: 0 });
}
function lightleak(c, t, a) {
  const amt = clamp((c.amount ?? 60) / 100, 0.05, 1), col = c.color || '#ff9a4d';
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  [[0.15, 0.3, 0.55, 0.3, 0], [0.8, 0.7, 0.5, 0.22, 2], [0.5, 0.1, 0.4, 0.4, 4]].forEach(([bx, by, r, sp, ph], i) => {
    const x = W * (bx + 0.18 * Math.sin(t * sp + ph)), y = H * (by + 0.2 * Math.cos(t * sp * 0.8 + ph)), R = Math.max(W, H) * r;
    const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, i === 1 ? '#ff4d6d' : col); g.addColorStop(0.5, 'rgba(255,120,60,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a * amt * (0.55 + 0.25 * Math.sin(t * 1.3 + ph)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  ctx.restore();
}
function copyCanvas(slot) { const [cv, g] = tmp(slot, W, H); g.drawImage(canvas, 0, 0, W, H); return [cv, g]; }
function adjust(c, t, a, S) {
  const amt = clamp((c.amount ?? 50) / 100, 0, 1.5);
  if (c.fxType === 'letterbox') { const hb = Math.min(H * 0.4, H * 0.127 * amt * 2); ctx.globalAlpha = a; ctx.fillStyle = c.color || '#000'; ctx.fillRect(0, 0, W, hb); ctx.fillRect(0, H - hb, W, hb); }
  else if (c.fxType === 'bloom') { const [cv] = copyCanvas(3); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a * Math.min(1, amt * 0.9); ctx.filter = `blur(${(6 + amt * 26) * S}px) brightness(1.25)`; ctx.drawImage(cv, 0, 0); ctx.restore(); }
  else if (c.fxType === 'chroma') {
    const d = amt * 9 * S * a, [A] = copyCanvas(3), [B, gb] = tmp(4, W, H);
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    [[-d, '#ff0000'], [0, '#00ff00'], [d, '#0000ff']].forEach(([o, col]) => { gb.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, W, H); gb.drawImage(A, 0, 0); gb.globalCompositeOperation = 'multiply'; gb.fillStyle = col; gb.fillRect(0, 0, W, H); ctx.drawImage(B, o, 0); });
    ctx.restore();
  } else if (c.fxType === 'glitch') {
    const frame = Math.floor(t * 12);
    if (rnd(frame, 9, c.seed) < 0.22 + amt * 0.35) {
      const [A] = copyCanvas(3), n = 4 + Math.round(amt * 8);
      ctx.save(); ctx.globalAlpha = 1;
      for (let i = 0; i < n; i++) { const y = rnd(frame, i * 3 + 1, c.seed) * H, h = (0.01 + rnd(frame, i * 3 + 2, c.seed) * 0.08) * H, dx = (rnd(frame, i * 3 + 3, c.seed) - 0.5) * 0.12 * W * amt * 2; ctx.drawImage(A, 0, y, W, h, dx, y, W, h); }
      ctx.restore();
    }
  } else if (c.fxType === 'shake') {
    const [A] = copyCanvas(3), k = amt * 14 * S * a, dx = (Math.sin(t * 47) + Math.sin(t * 23.7)) * 0.5 * k, dy = (Math.cos(t * 41) + Math.sin(t * 29.3)) * 0.5 * k;
    ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.translate(W / 2 + dx, H / 2 + dy); ctx.scale(1.04, 1.04); ctx.drawImage(A, -W / 2, -H / 2); ctx.restore();
  } else if (c.fxType === 'grain') {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a * amt * 0.6; ctx.translate(Math.random() * 256, Math.random() * 256); ctx.fillStyle = getGrain(); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore();
  } else if (c.fxType === 'vignette') {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) / 2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${Math.min(1, amt * 0.9)})`);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  } else if (c.fxType === 'oldfilm') {
    const frame = Math.floor(t * 14);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a * amt * 0.5; ctx.fillStyle = '#d9b98a'; ctx.fillRect(0, 0, W, H);   // warm tint
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a * amt * 0.5; ctx.translate(Math.random() * 256, Math.random() * 256); ctx.fillStyle = getGrain(); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore();
    ctx.save(); ctx.globalAlpha = a * amt * 0.5; ctx.fillStyle = '#fff';
    for (let i = 0; i < 14; i++) if (rnd(frame, i, c.seed) < 0.5) ctx.fillRect(rnd(frame, i + 40, c.seed) * W, rnd(frame, i + 80, c.seed) * H, (1 + rnd(frame, i + 120, c.seed) * 2) * S, (1 + rnd(frame, i + 160, c.seed) * 3) * S);   // dust
    if (rnd(frame, 300, c.seed) < 0.35) ctx.fillRect(rnd(frame, 301, c.seed) * W, 0, Math.max(1, S), H);   // scratch
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * amt * 0.12 * rnd(frame, 400, c.seed); ctx.fillRect(0, 0, W, H);   // flicker
    ctx.restore();
    adjust({ ...c, fxType: 'vignette', amount: (c.amount ?? 60) * 0.9 }, t, a, S);
  }
}
function graphic(c, t, a, S, fx) {
  const sc = (c.size || 56) / 56, w = W * (c.fw ?? 30) / 100 * sc, h = H * (c.fh ?? 20) / 100 * sc, X = W * (c.x ?? 50) / 100, Y = H * (c.y ?? 50) / 100, col = c.color || '#ffffff', acc = c.accent || '#4da3ff', lw = (c.lw ?? 6) * S;
  boxes.set(c.id, { cx: X, cy: Y, w: Math.max(30, w), h: Math.max(30, h), rot: 0 });
  ctx.save(); ctx.globalAlpha = a * (fx ? fx.a : 1);
  if (fx) textFxApply(fx, X, Y, { x: X - w / 2, y: Y - h / 2, w, h });
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = lw;
  const ease = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3), cd = Math.max(0.2, c.cDur ?? 2.5);
  switch (c.fxType) {
    case 'rect': ctx.fillRect(X - w / 2, Y - h / 2, w, h); break;
    case 'rrect': shapePath(ctx, 'rrect', X, Y, w, h, 0.25); ctx.fill(); break;
    case 'circle': shapePath(ctx, 'ellipse', X, Y, w, h); ctx.fill(); break;
    case 'ring': shapePath(ctx, 'ellipse', X, Y, w, h); ctx.stroke(); break;
    case 'line': ctx.fillRect(X - w / 2, Y - Math.max(lw, h * 0.1) / 2, w, Math.max(lw, h * 0.1)); break;
    case 'arrow': { const hd = h * 0.5; ctx.beginPath(); ctx.moveTo(X - w / 2, Y - hd * 0.3); ctx.lineTo(X + w / 2 - hd, Y - hd * 0.3); ctx.lineTo(X + w / 2 - hd, Y - hd); ctx.lineTo(X + w / 2, Y); ctx.lineTo(X + w / 2 - hd, Y + hd); ctx.lineTo(X + w / 2 - hd, Y + hd * 0.3); ctx.lineTo(X - w / 2, Y + hd * 0.3); ctx.closePath(); ctx.fill(); break; }
    case 'progress': {
      const bh = Math.max(6 * S, h * 0.35), v = clamp((c.amount ?? 100) / 100, 0, 1) * ease(t / cd);
      ctx.globalAlpha *= 0.35; ctx.fillStyle = '#000'; shapePath(ctx, 'rrect', X, Y, w, bh, 0.5); ctx.fill(); ctx.globalAlpha /= 0.35;
      ctx.save(); shapePath(ctx, 'rrect', X, Y, w, bh, 0.5); ctx.clip(); ctx.fillStyle = acc; ctx.fillRect(X - w / 2, Y - bh / 2, w * v, bh); ctx.restore();
      break;
    }
    case 'counter': {
      const v = (c.cFrom ?? 0) + ((c.cTo ?? 1000) - (c.cFrom ?? 0)) * ease(t / cd), dec = c.cDec ?? 0;
      const txt = (c.prefix || '') + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + (c.suffix || '');
      ctx.font = `${c.bold === false ? '' : 'bold '}${c.size}px ${c.font || TEXT_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(2, c.size / 14); ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(txt, X, Y); ctx.fillText(txt, X, Y);
      boxes.set(c.id, { cx: X, cy: Y, w: ctx.measureText(txt).width + c.size * 0.6, h: c.size * 1.3, rot: 0 });
      break;
    }
  }
  ctx.restore();
}
const PARTICLE = new Set(['snow', 'rain', 'confetti', 'sparks', 'fireflies', 'bubbles']);
window.drawFxClip = function (c) {
  c = withKf(c, state.t);
  const t = state.t - c.start, S = H / 720, a = (c.opacity ?? 1) * fadeFactor(c, state.t), fx = window.textFx ? textFx(c, state.t) : null;
  ctx.save();
  if (PARTICLE.has(c.fxType)) particles(c, t, a * (fx ? fx.a : 1), S);
  else if (c.fxType === 'flare') flare(c, t, a * (fx ? fx.a : 1), S);
  else if (c.fxType === 'lightleak') lightleak(c, t, a);
  else if (['letterbox', 'bloom', 'chroma', 'glitch', 'shake', 'grain', 'vignette', 'oldfilm'].includes(c.fxType)) adjust(c, t, a, S);
  else graphic(c, t, a, S, fx);
  ctx.restore();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
};

// ---------- library of effects ----------
const LIB = [
  ['Particles', 'Snow', { fxType: 'snow', label: '❄ Snow', amount: 50, color: '#ffffff', dur: 8 }],
  ['Particles', 'Rain', { fxType: 'rain', label: '🌧 Rain', amount: 50, color: '#bcd4ff', dur: 8 }],
  ['Particles', 'Confetti', { fxType: 'confetti', label: '🎉 Confetti', amount: 60, dur: 6 }],
  ['Particles', 'Sparks', { fxType: 'sparks', label: '✨ Sparks', amount: 40, color: '#ffb347', x: 50, y: 80, dur: 5 }],
  ['Particles', 'Fireflies', { fxType: 'fireflies', label: '✦ Fireflies', amount: 25, color: '#ffe97a', dur: 8 }],
  ['Particles', 'Bubbles', { fxType: 'bubbles', label: '○ Bubbles', amount: 30, color: '#cfeaff', dur: 8 }],
  ['Lens flare', 'Sun flare', { fxType: 'flare', label: '☀ Lens flare', amount: 70, color: '#ffd9a0', x: 75, y: 25, dur: 4 }],
  ['Lens flare', 'Sweeping flare', { fxType: 'flare', label: '☀ Sweeping flare', amount: 75, color: '#ffe3b0', y: 35, sweep: true, dur: 3 }],
  ['Lens flare', 'Blue anamorphic', { fxType: 'flare', label: '☀ Blue flare', amount: 80, color: '#7ab8ff', x: 30, y: 45, dur: 4 }],
  ['Lens flare', 'Light leak', { fxType: 'lightleak', label: '◐ Light leak', amount: 60, color: '#ff9a4d', dur: 5 }],
  ['Cinematic', 'Letterbox bars', { fxType: 'letterbox', label: '▬ Letterbox', amount: 50, color: '#000000', dur: 6 }],
  ['Cinematic', 'Glow / bloom', { fxType: 'bloom', label: '◌ Bloom', amount: 55, dur: 6 }],
  ['Cinematic', 'RGB split', { fxType: 'chroma', label: '◧ RGB split', amount: 40, dur: 3 }],
  ['Cinematic', 'Glitch', { fxType: 'glitch', label: '▒ Glitch', amount: 50, dur: 2 }],
  ['Cinematic', 'Camera shake', { fxType: 'shake', label: '≋ Shake', amount: 40, dur: 2 }],
  ['Cinematic', 'Film grain', { fxType: 'grain', label: '∷ Film grain', amount: 50, dur: 8 }],
  ['Cinematic', 'Old film', { fxType: 'oldfilm', label: '🎞 Old film', amount: 60, dur: 8 }],
  ['Cinematic', 'Vignette', { fxType: 'vignette', label: '◍ Vignette', amount: 60, color: '#000000', dur: 8 }],
  ['Graphics', 'Rectangle', { fxType: 'rect', label: '▭ Rectangle', fw: 30, fh: 20, color: '#4da3ff', animIn: 'pop', animOut: 'fade', animDur: 0.5, dur: 4 }],
  ['Graphics', 'Rounded box', { fxType: 'rrect', label: '▢ Rounded box', fw: 30, fh: 20, color: '#ffca3a', animIn: 'pop', animOut: 'fade', animDur: 0.5, dur: 4 }],
  ['Graphics', 'Circle', { fxType: 'circle', label: '● Circle', fw: 14, fh: 25, color: '#ff595e', animIn: 'zoom', animOut: 'fade', animDur: 0.5, dur: 4 }],
  ['Graphics', 'Ring', { fxType: 'ring', label: '◯ Ring', fw: 16, fh: 28, color: '#ffffff', lw: 8, animIn: 'zoom', animOut: 'fade', animDur: 0.5, dur: 4 }],
  ['Graphics', 'Underline', { fxType: 'line', label: '▁ Underline', fw: 30, fh: 4, color: '#ffd166', animIn: 'wipe', animOut: 'wipe', animDur: 0.6, dur: 4 }],
  ['Graphics', 'Arrow', { fxType: 'arrow', label: '➜ Arrow', fw: 18, fh: 12, color: '#ff595e', animIn: 'left', animOut: 'fade', animDur: 0.5, dur: 4 }],
  ['Graphics', 'Progress bar', { fxType: 'progress', label: '▰ Progress bar', fw: 50, fh: 4, y: 90, color: '#ffffff', accent: '#4da3ff', amount: 100, cDur: 3, animIn: 'fade', animOut: 'fade', animDur: 0.4, dur: 4 }],
  ['Graphics', 'Counter', { fxType: 'counter', label: '123 Counter', size: 120, cFrom: 0, cTo: 1000, cDur: 2.5, prefix: '', suffix: '', animIn: 'pop', animOut: 'fade', animDur: 0.5, dur: 5 }],
];
function effectsTrack() {
  let i = TRACKS.findIndex((t, k) => t.kind === 'text' && t.name === 'Effects' && LANE_ORDER.includes(k));
  if (i < 0) { addLayer('text'); i = TRACKS.length - 1; TRACKS[i].name = 'Effects'; buildLabels(); }
  activeTrack.text = i;
  return i;
}
function addFx(p) {
  pushHistory();
  const track = effectsTrack(), dur = p.dur || 5;
  let start = state.t;
  if (!fits({ id: -1 }, start, dur, track)) start = laneEnd(track);
  const c = { ...newTextClip('', start, dur), track, x: 50, y: 50, seed: Math.floor(Math.random() * 1000) + 1, ...p, text: '' };
  state.clips.push(c); state.sel = c.id; afterEdit();
}
const dlg = document.createElement('dialog');
dlg.id = 'fx-dialog';
dlg.innerHTML = `<form method="dialog"><h3>Effects &amp; graphics</h3><p class="muted">Added at the playhead on an "Effects" layer. Effects like bloom, RGB split, glitch, shake and letterbox change everything on the layers below the Effects layer. Change the settings in the Inspector.</p><div id="fx-list"></div><div class="row"><button type="button" id="fx-close">Close</button></div></form>`;
document.body.append(dlg);
const css = document.createElement('style');
css.textContent = `#fx-dialog{background:#1d1f25;color:#e6e6e6;border:1px solid #3a3d46;border-radius:8px;width:520px;max-width:94vw;max-height:88vh;overflow:auto}#fx-dialog::backdrop{background:rgba(0,0,0,.6)}#fx-dialog h3{margin:0 0 6px}#fx-list h4{margin:12px 0 4px;color:#9aa}#fx-list button{margin:2px 4px 2px 0}#fx-dialog .row{display:flex;justify-content:flex-end;margin-top:10px}
#inspector .fxrow{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}#inspector .fxrow button{flex:0 0 auto}#inspector h3.fxh{margin-top:16px}`;
document.head.append(css);
$('#btn-fxlib').onclick = () => {
  let g = '', h = '';
  LIB.forEach(([grp, name], i) => { if (grp !== g) { g = grp; h += `<h4>${grp}</h4>`; } h += `<button type="button" data-fx="${i}">${name}</button>`; });
  $('#fx-list').innerHTML = h; dlg.showModal();
};
$('#fx-close').onclick = () => dlg.close();
$('#fx-list').addEventListener('click', e => { const b = e.target.closest('button[data-fx]'); if (b) { addFx({ ...LIB[+b.dataset.fx][2] }); dlg.close(); toast('Added. Select it to change the settings.'); } });

// ---------- inspector for effect clips ----------
const R = (c, f, label, min, max, step, d) => `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" data-f="${f}" value="${c[f] ?? d}">`;
const N = (c, f, label, step, d) => `<label>${label}</label><input type="number" step="${step}" data-f="${f}" value="${(+(c[f] ?? d)).toFixed(2)}">`;
const T = (c, f, label) => `<label>${label}</label><input type="text" data-f="${f}" value="${attr(c[f])}">`;
const C = (c, f, label, d) => `<label>${label}</label><input type="color" data-f="${f}" value="${c[f] || d}">`;
window.fxInspector = function (c) {
  const ty = c.fxType, graphics = ['rect', 'rrect', 'circle', 'ring', 'line', 'arrow', 'progress', 'counter'].includes(ty);
  let h = `<h3>${attr(c.label || ty)}</h3>` + N(c, 'start', 'Start (s)', 0.01, 0) + N(c, 'dur', 'Duration (s)', 0.01, 5) + R(c, 'fadeIn', 'Fade in (s)', 0, 5, 0.1, 0) + R(c, 'fadeOut', 'Fade out (s)', 0, 5, 0.1, 0) + R(c, 'opacity', 'Opacity', 0, 1, 0.01, 1);
  if (PARTICLE.has(ty)) h += R(c, 'amount', 'Amount', 1, 100, 1, 50) + R(c, 'fxSpeed', 'Speed', 0.2, 3, 0.1, 1) + C(c, 'color', 'Colour', '#ffffff') + (ty === 'sparks' ? R(c, 'x', 'Source X (%)', 0, 100, 1, 50) + R(c, 'y', 'Source Y (%)', 0, 100, 1, 80) : '');
  else if (ty === 'flare') h += R(c, 'amount', 'Intensity', 5, 150, 1, 70) + C(c, 'color', 'Colour', '#ffd9a0') + `<label><input type="checkbox" data-f="sweep" ${c.sweep ? 'checked' : ''}> Sweep across the picture</label>` + R(c, 'x', 'Position X (%)', 0, 100, 1, 70) + R(c, 'y', 'Position Y (%)', 0, 100, 1, 30);
  else if (ty === 'lightleak') h += R(c, 'amount', 'Strength', 5, 100, 1, 60) + C(c, 'color', 'Colour', '#ff9a4d');
  else if (ty === 'letterbox') h += R(c, 'amount', 'Bar size', 5, 100, 1, 50) + C(c, 'color', 'Colour', '#000000');
  else if (!graphics) h += R(c, 'amount', 'Amount', 1, 100, 1, 50);
  if (graphics) {
    h += R(c, 'x', 'Position X (%)', 0, 100, 1, 50) + R(c, 'y', 'Position Y (%)', 0, 100, 1, 50) + R(c, 'size', 'Size (scale)', 8, 300, 1, 56)
      + (ty === 'counter' ? '' : R(c, 'fw', 'Width (%)', 1, 100, 1, 30) + R(c, 'fh', ty === 'line' || ty === 'progress' ? 'Thickness (%)' : 'Height (%)', 1, 100, 1, 20))
      + C(c, 'color', 'Colour', '#ffffff') + (ty === 'progress' ? C(c, 'accent', 'Fill colour', '#4da3ff') : '') + (ty === 'ring' || ty === 'arrow' ? R(c, 'lw', 'Line width', 1, 30, 1, 6) : '');
    if (ty === 'progress') h += R(c, 'amount', 'Fill (%)', 0, 100, 1, 100) + R(c, 'cDur', 'Fill time (s)', 0.2, 10, 0.1, 3);
    if (ty === 'counter') h += N(c, 'cFrom', 'From', 1, 0) + N(c, 'cTo', 'To', 1, 1000) + R(c, 'cDur', 'Count time (s)', 0.2, 10, 0.1, 2.5) + R(c, 'cDec', 'Decimals', 0, 3, 1, 0) + T(c, 'prefix', 'Before the number (e.g. $)') + T(c, 'suffix', 'After the number (e.g. %)');
    const A = window.TEXT_ANIM, sel = (f, m) => `<select data-f="${f}">${Object.entries(m).map(([k, v]) => `<option value="${k}" ${(c[f] || 'none') === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
    if (A) h += `<label>Animation in</label>${sel('animIn', A.ANIM_IN)}<label>Animation out</label>${sel('animOut', A.ANIM_OUT)}` + R(c, 'animDur', 'Animation length (s)', 0.1, 3, 0.1, 0.6);
  }
  h += `<p class="muted">${PARTICLE.has(ty) || ty === 'flare' || ty === 'lightleak' ? 'Particles and flares are drawn above everything on the layers below.' : ['letterbox', 'bloom', 'chroma', 'glitch', 'shake', 'grain', 'vignette', 'oldfilm'].includes(ty) ? 'This changes the picture of all layers below the Effects layer.' : 'Drag it on the picture, or use the keyframes below to move it.'}</p>`;
  return h + presetSection(c, 'text') + kfSection(c, 'text');
};

// ---------- picture in picture, mask, animation presets, tracking, presets (inspector section for picture clips) ----------
function dims(c) { const a = assetOf(c); if (!a) return [1280, 720]; return a.kind === 'video' ? [a.el.videoWidth || 1280, a.el.videoHeight || 720] : [a.el.naturalWidth || 1280, a.el.naturalHeight || 720]; }
function pipSet(c, pos, size) {
  const [sw, sh] = dims(c), k = Math.min(W / sw, H / sh) * size, hw = sw * k / 2, hh = sh * k / 2, m = 0.025 * W;
  const px = pos[0] * ((W / 2 - hw - m) / W * 100), py = pos[1] * ((H / 2 - hh - m) / H * 100);
  Object.assign(c, { scale: size, px: +px.toFixed(2), py: +py.toFixed(2), round: 8, border: 3, borderColor: '#ffffff', shadow: 18 });
}
const IN_ANIMS = { pop: 'Pop in', zoom: 'Zoom in', spin: 'Spin in', flip: '3D flip in', flipx: '3D flip up', left: 'Slide from left', right: 'Slide from right', up: 'Slide from bottom', down: 'Slide from top', drop: 'Drop and bounce', fade: 'Fade in' };
const OUT_ANIMS = { fade: 'Fade out', pop: 'Shrink out', spin: 'Spin out', flip: '3D flip out', left: 'Slide to left', right: 'Slide to right', up: 'Slide up', down: 'Slide down' };
const LOOPS = { pulse: 'Pulse', float: 'Float up and down', swing: 'Swing', bounce: 'Bounce', spin: 'Slow spin', flipx: '3D turn (continuous)' };
const LOGOS = { logoPop: 'Logo: pop and settle', logoSpin: 'Logo: spin reveal', logoSlide: 'Logo: slide and bounce', logoFlip: 'Logo: 3D flip and float' };
function putKeys(c, prop, keys, from, to) {   // replace the keys of prop inside [from,to] (to = Infinity for all)
  c.kf = c.kf || {};
  const old = (c.kf[prop] || []).filter(k => k.t < from - 1e-3 || k.t > to + 1e-3);
  c.kf[prop] = [...old, ...keys.map(([t, v]) => ({ t: +t.toFixed(3), v: +v.toFixed(4) }))].sort((a, b) => a.t - b.t);
}
const base = (c, p) => c[p] ?? KF_DEFAULT[p];
function animIn(c, type, d) {
  const sc = base(c, 'scale'), px = base(c, 'px'), py = base(c, 'py'), op = base(c, 'opacity'), z = [0, d];
  const K = (p, k) => putKeys(c, p, k, 0, d);
  switch (type) {
    case 'pop': K('scale', [[0, 0], [d * 0.6, sc * 1.12], [d, sc]]); K('opacity', [[0, 0], [d * 0.3, op]]); break;
    case 'zoom': K('scale', [[0, sc * 1.8], [d, sc]]); K('opacity', [[0, 0], [d, op]]); break;
    case 'spin': K('rot', [[0, -360], [d, base(c, 'rot')]]); K('scale', [[0, 0], [d, sc]]); break;
    case 'flip': K('rotY', [[0, -90], [d, 0]]); K('opacity', [[0, 0], [d * 0.2, op]]); break;
    case 'flipx': K('rotX', [[0, 90], [d, 0]]); K('opacity', [[0, 0], [d * 0.2, op]]); break;
    case 'left': K('px', [[0, px - 130], [d, px]]); break;
    case 'right': K('px', [[0, px + 130], [d, px]]); break;
    case 'up': K('py', [[0, py + 130], [d, py]]); break;
    case 'down': K('py', [[0, py - 130], [d, py]]); break;
    case 'drop': K('py', [[0, py - 120], [d * 0.55, py + 4], [d * 0.78, py - 2], [d, py]]); K('opacity', [[0, 0], [d * 0.2, op]]); break;
    case 'fade': K('opacity', [[0, 0], [d, op]]); break;
  }
}
function animOut(c, type, d) {
  const T = c.dur, f = T - d, sc = base(c, 'scale'), px = base(c, 'px'), py = base(c, 'py'), op = base(c, 'opacity');
  const K = (p, k) => putKeys(c, p, k, f, T);
  switch (type) {
    case 'fade': K('opacity', [[f, op], [T, 0]]); break;
    case 'pop': K('scale', [[f, sc], [T, 0]]); K('opacity', [[f, op], [T, 0]]); break;
    case 'spin': K('rot', [[f, base(c, 'rot')], [T, 360]]); K('scale', [[f, sc], [T, 0]]); break;
    case 'flip': K('rotY', [[f, 0], [T, 90]]); break;
    case 'left': K('px', [[f, px], [T, px - 130]]); break;
    case 'right': K('px', [[f, px], [T, px + 130]]); break;
    case 'up': K('py', [[f, py], [T, py - 130]]); break;
    case 'down': K('py', [[f, py], [T, py + 130]]); break;
  }
}
function loopAnim(c, type) {
  const T = c.dur, per = type === 'spin' ? T : 1.6, n = Math.max(1, Math.round(T / per)), P = T / n, keys = (f) => { const k = []; for (let i = 0; i <= n; i++) k.push(...f(i * P, P)); return k; };
  const sc = base(c, 'scale'), py = base(c, 'py'), rot = base(c, 'rot');
  const dedupe = a => a.filter((x, i) => !i || x[0] - a[i - 1][0] > 1e-3);
  if (type === 'pulse') putKeys(c, 'scale', dedupe(keys((t, p) => [[t, sc], [t + p / 2, sc * 1.07]])).filter(k => k[0] <= T), 0, Infinity);
  if (type === 'float') putKeys(c, 'py', dedupe(keys((t, p) => [[t, py], [t + p / 2, py - 2.2]])).filter(k => k[0] <= T), 0, Infinity);
  if (type === 'swing') putKeys(c, 'rot', dedupe(keys((t, p) => [[t, rot - 4], [t + p / 2, rot + 4]])).filter(k => k[0] <= T), 0, Infinity);
  if (type === 'bounce') putKeys(c, 'py', dedupe(keys((t, p) => [[t, py], [t + p * 0.4, py - 4], [t + p * 0.8, py]])).filter(k => k[0] <= T), 0, Infinity);
  if (type === 'spin') putKeys(c, 'rot', [[0, rot], [T, rot + 360]], 0, Infinity);
  if (type === 'flipx') putKeys(c, 'rotY', [[0, 0], [T, 360 * Math.max(1, Math.round(T / 3))]], 0, Infinity);
  c.kfSmooth = type === 'spin' || type === 'flipx' ? false : c.kfSmooth;
}
function logo(c, type) {
  const d = Math.min(0.9, c.dur / 3);
  const clear = ['scale', 'rot', 'opacity', 'px', 'py', 'rotY', 'rotX'];
  if (c.kf) for (const p of clear) delete c.kf[p];
  if (type === 'logoPop') { animIn(c, 'pop', d); animOut(c, 'fade', Math.min(0.6, c.dur / 4)); loopAnim(c, 'pulse'); }
  if (type === 'logoSpin') { animIn(c, 'spin', d); animOut(c, 'pop', Math.min(0.6, c.dur / 4)); }
  if (type === 'logoSlide') { animIn(c, 'drop', d); animOut(c, 'up', Math.min(0.6, c.dur / 4)); }
  if (type === 'logoFlip') { animIn(c, 'flip', d); animOut(c, 'flip', Math.min(0.6, c.dur / 4)); loopAnim(c, 'float'); }
  c.kfSmooth = true;
}

// ----- tracking -----
const TRK = { pick: null, pts: null };
function trackPoint(c, u, v) {   // clip-frame coordinates (0..1) to canvas pixels, using the clip's own transform
  const [sw, sh] = dims(c), cl = (c.cropL || 0) / 100, cr = (c.cropR || 0) / 100, ct = (c.cropT || 0) / 100, cb = (c.cropB || 0) / 100, cw = sw * (1 - cl - cr), ch = sh * (1 - ct - cb), k = Math.min(W / cw, H / ch) * (c.scale ?? 1);
  return [W / 2 + (c.px || 0) * W / 100 + ((u - cl) / (1 - cl - cr) - 0.5) * cw * k, H / 2 + (c.py || 0) * H / 100 + ((v - ct) / (1 - ct - cb) - 0.5) * ch * k];
}
async function trackRun(c, u0, v0, half, onProgress) {
  const a = assetOf(c);
  if (!a || a.kind !== 'video') throw new Error('Tracking works on video clips.');
  const vid = document.createElement('video'); vid.muted = true; vid.preload = 'auto'; vid.src = a.url;
  await new Promise((res, rej) => { vid.onloadeddata = res; vid.onerror = () => rej(new Error('Could not open the video.')); });
  const TW = 320, TH = Math.round(TW * (vid.videoHeight || 180) / (vid.videoWidth || 320)), g = Object.assign(document.createElement('canvas'), { width: TW, height: TH }).getContext('2d', { willReadFrequently: true });
  const gray = () => { g.drawImage(vid, 0, 0, TW, TH); const d = g.getImageData(0, 0, TW, TH).data, o = new Float32Array(TW * TH); for (let i = 0; i < o.length; i++) o[i] = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11; return o; };
  const P = half, SR = 24, step = 0.1, t0 = clamp(state.t - c.start, 0, c.dur), pts = [];
  let cx = u0 * TW, cy = v0 * TH, tpl = null, lost = 0, vx = 0, vy = 0;
  const grab = (img, x, y) => { const o = new Float32Array((2 * P + 1) ** 2); let k = 0; for (let j = -P; j <= P; j++) for (let i = -P; i <= P; i++) o[k++] = img[clamp(Math.round(y + j), 0, TH - 1) * TW + clamp(Math.round(x + i), 0, TW - 1)]; return o; };
  for (let tl = t0, n = 0; tl <= c.dur + 1e-6; tl += step, n++) {
    await seekTo(vid, clamp(srcTime(c, c.start + tl), 0, (vid.duration || 1e9) - 0.05));
    const img = gray();
    if (!tpl) tpl = grab(img, cx, cy);
    else {
      const px0 = cx + vx, py0 = cy + vy;   // where the object should be if it keeps moving the same way
      let best = Infinity, bx = px0, by = py0, bs = Infinity;
      for (let dy = -SR; dy <= SR; dy++) for (let dx = -SR; dx <= SR; dx++) {
        const x = Math.round(px0 + dx), y = Math.round(py0 + dy); if (x < P || y < P || x >= TW - P || y >= TH - P) continue;
        const pen = 10 * (dx * dx + dy * dy);   // on a tie (flat areas) prefer the predicted position
        let sum = 0, k = 0;
        for (let j = -P; j <= P && sum + pen < best; j++) { const row = (y + j) * TW + x; for (let i = -P; i <= P; i++) sum += Math.abs(img[row + i] - tpl[k++]); }
        if (sum + pen < best) { best = sum + pen; bs = sum; bx = x; by = y; }
      }
      const per = bs / ((2 * P + 1) ** 2);
      if (per < 22) { vx = 0.6 * vx + 0.4 * (bx - cx); vy = 0.6 * vy + 0.4 * (by - cy); cx = bx; cy = by; lost = 0; const np = grab(img, cx, cy); for (let i = 0; i < tpl.length; i++) tpl[i] = tpl[i] * 0.7 + np[i] * 0.3; } else { lost++; cx += vx; cy += vy; }
    }
    pts.push([+tl.toFixed(3), +(cx / TW).toFixed(5), +(cy / TH).toFixed(5)]);
    if (n % 3 === 0) { onProgress && onProgress((tl - t0) / Math.max(0.1, c.dur - t0), lost); await new Promise(r => setTimeout(r, 0)); }
  }
  vid.removeAttribute('src'); vid.load();
  return { pts, lost };
}
// pick a point by clicking on the picture
canvas.addEventListener('pointerdown', e => {
  if (!TRK.pick) return;
  const c = state.clips.find(o => o.id === TRK.pick); TRK.pick = null;
  if (!c) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const p = canvasPoint(e), b = boxes.get(c.id);
  if (!b) { const m = $('#trk-msg'); if (m) m.textContent = 'The clip is not visible at the playhead. Move the playhead onto it and try again.'; return; }
  const l = toLocal(p, b);
  c.trkPick = [clamp(0.5 + l.x / b.w, 0, 1), clamp(0.5 + l.y / b.h, 0, 1), +state.t.toFixed(3)];
  renderInspector(); const m = $('#trk-msg'); if (m) m.textContent = 'Point set. Now press "Track from the playhead".';
}, true);

function maskSection(c) {
  const R2 = (f, l, a, b, s, d) => R(c, f, l, a, b, s, d);
  return `<h3 class="fxh">Mask</h3><label>Shape</label><select data-f="mask">${Object.entries(MASKS).map(([k, v]) => `<option value="${k}" ${(c.mask || 'none') === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`
    + (c.mask && c.mask !== 'none' ? R2('mx', 'Position X (%)', -100, 100, 1, 0) + R2('my', 'Position Y (%)', -100, 100, 1, 0) + R2('mw', 'Width (%)', 5, 200, 1, 60) + R2('mh', 'Height (%)', 5, 200, 1, 60) + R2('feather', 'Soft edge (px)', 0, 80, 1, 0) + `<label><input type="checkbox" data-f="maskInv" ${c.maskInv ? 'checked' : ''}> Invert (hide inside instead)</label>` : '');
}
const sel2 = (f, m, cur) => `<select data-s="${f}">${Object.entries(m).map(([k, v]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
window.effectsSection = function (c, kind) {
  if (kind === 'text') return presetSection(c, 'text');
  const isVideo = kind === 'video', others = state.clips.filter(o => o.id !== c.id && !o.audioOnly && (o.text != null ? true : clipKind(o) !== 'audio'));
  let h = `<h3 class="fxh">Picture in picture</h3><p class="muted">Put this clip on a layer above the main video, then choose a corner.</p>`
    + `<div class="fxrow"><button type="button" data-pip="-1,-1">Top left</button><button type="button" data-pip="1,-1">Top right</button><button type="button" data-pip="-1,1">Bottom left</button><button type="button" data-pip="1,1">Bottom right</button><button type="button" data-pip="side-l">Left half</button><button type="button" data-pip="side-r">Right half</button><button type="button" data-pip="off">Remove style</button></div>`
    + R(c, 'scale', 'Size', 0.1, 1, 0.01, 1) + R(c, 'round', 'Rounded corners (%)', 0, 50, 1, 0) + R(c, 'border', 'Border (px)', 0, 30, 1, 0) + C(c, 'borderColor', 'Border colour', '#ffffff') + R(c, 'shadow', 'Shadow', 0, 60, 1, 0)
    + maskSection(c)
    + `<h3 class="fxh">3D flip</h3>` + R(c, 'rotY', 'Turn left-right (deg)', -180, 180, 1, 0) + R(c, 'rotX', 'Turn up-down (deg)', -180, 180, 1, 0)
    + `<h3 class="fxh">Animation presets (2D and 3D, logo)</h3><label>Length of in/out (s)</label><input type="range" min="0.2" max="2" step="0.1" id="an-d" value="0.8">`
    + `<div class="fxrow">${sel2('anIn', IN_ANIMS, 'pop')}<button type="button" data-an="in">Apply in</button></div><div class="fxrow">${sel2('anOut', OUT_ANIMS, 'fade')}<button type="button" data-an="out">Apply out</button></div><div class="fxrow">${sel2('anLoop', LOOPS, 'pulse')}<button type="button" data-an="loop">Apply loop</button></div>`
    + `<label>Logo animation</label><div class="fxrow">${sel2('anLogo', LOGOS, 'logoPop')}<button type="button" data-an="logo">Apply</button></div><div class="fxrow"><button type="button" data-an="clear">Clear animation</button></div>`;
  if (isVideo) {
    const has = c.trk && c.trk.length;
    h += `<h3 class="fxh">Motion tracking</h3><p class="muted">Follow a moving object. 1) Move the playhead to where the object is clearly visible, press "Pick object" and click it on the picture. 2) Track. 3) Make a clip or the mask follow it.</p>`
      + `<div class="fxrow"><button type="button" id="trk-pick">Pick object</button><span class="muted">${c.trkPick ? 'point set' : 'no point yet'}</span></div>`
      + `<label>Tracking box size: make it about as big as the object (a bit smaller is safer; much bigger drifts)</label><input type="range" id="trk-size" min="6" max="30" step="1" value="${c.trkSize ?? 12}">`
      + `<div class="fxrow"><button type="button" id="trk-go" ${c.trkPick ? '' : 'disabled'}>Track from the playhead</button></div>`
      + (has ? `<p class="muted">Tracked ${c.trk.length} positions (${c.trk[0][0].toFixed(1)}s to ${c.trk[c.trk.length - 1][0].toFixed(1)}s).</p><label>Make this clip follow the object</label><select id="trk-target">${others.map(o => `<option value="${o.id}">${attr(o.text != null ? (o.fxType ? o.label : o.text.slice(0, 30) || 'text') : assetOf(o).name)} (at ${o.start.toFixed(1)} s)</option>`).join('')}</select>`
        + `<div class="fxrow"><button type="button" id="trk-apply">Make it follow</button><button type="button" id="trk-mask">Make the mask follow</button><button type="button" id="trk-clear">Remove tracking</button></div>` : '')
      + `<p class="muted" id="trk-msg"></p>`;
  }
  return h + presetSection(c, kind);
};

// ----- custom effect presets -----
const PK = ['scale', 'px', 'py', 'rot', 'opacity', 'fadeIn', 'fadeOut', 'bright', 'contrast', 'sat', 'hue', 'gray', 'sepia', 'blur', 'invert', 'vignette', 'grain', 'sharpen', 'look', 'lut', 'keyOn', 'keyColor', 'keySim', 'keySmooth', 'keySpill', 'mask', 'mx', 'my', 'mw', 'mh', 'feather', 'maskInv', 'round', 'border', 'borderColor', 'shadow', 'rotY', 'rotX', 'tr'];
const PT = ['font', 'size', 'color', 'bg', 'bold', 'x', 'y', 'rot', 'opacity', 'fadeIn', 'fadeOut', 'animIn', 'animOut', 'animDur', 'lt', 'accent', 'sub', 'fxType', 'label', 'amount', 'fxSpeed', 'fw', 'fh', 'lw', 'sweep', 'cFrom', 'cTo', 'cDur', 'cDec', 'prefix', 'suffix', 'seed'];
const presets = () => { try { return JSON.parse(localStorage.getItem('oc-fxpresets') || '[]'); } catch { return []; } };
const savePresets = a => localStorage.setItem('oc-fxpresets', JSON.stringify(a));
function presetSection(c, kind) {
  const k = kind === 'text' ? 'text' : 'media', list = presets().map((p, i) => ({ p, i })).filter(({ p }) => p.kind === k);
  return `<h3 class="fxh">My effect presets</h3><div class="fxrow"><input type="text" id="pr-name" placeholder="Name this look" style="flex:1"><button type="button" id="pr-save">Save</button></div>`
    + `<label><input type="checkbox" id="pr-kf"> Include the animation (keyframes)</label>`
    + (list.length ? `<div>${list.map(({ p, i }) => `<div class="fxrow"><b style="flex:1;overflow:hidden;text-overflow:ellipsis">${attr(p.name)}</b><button type="button" data-pr="apply" data-i="${i}">Apply</button><button type="button" data-pr="del" data-i="${i}">Delete</button></div>`).join('')}</div>` : '<p class="muted">No saved presets yet.</p>')
    + `<div class="fxrow"><button type="button" id="pr-export">Export all…</button><button type="button" id="pr-import">Import…</button></div><input type="file" id="pr-file" accept=".json" hidden>`;
}
const stash = (c, keys) => { const o = {}; for (const k of [...keys, ...Object.keys(COLOR_DEFAULTS)]) if (c[k] !== undefined) o[k] = c[k]; return o; };

// ----- clicks in the inspector -----
$('#inspector').addEventListener('click', async e => {
  const b = e.target.closest('button'), c = selClip();
  if (!b || !c) return;
  const ids = () => (multiClips().length ? multiClips() : [c]);
  if (b.dataset.pip) {
    pushHistory();
    const v = b.dataset.pip;
    if (v === 'off') Object.assign(c, { round: 0, border: 0, shadow: 0 });
    else if (v === 'side-l' || v === 'side-r') { const [sw, sh] = dims(c), k = Math.min(W / sw, H / sh); Object.assign(c, { scale: 0.5, px: v === 'side-l' ? -25 : 25, py: 0, round: 0, border: 0, shadow: 0 }); }
    else { const [x, y] = v.split(',').map(Number); pipSet(c, [x, y], c.scale && c.scale < 0.6 ? c.scale : 0.3); }
    afterEdit();
  } else if (b.dataset.an) {
    const d = +($('#an-d').value || 0.8), dd = Math.min(d, c.dur / 2 - 0.01);
    pushHistory();
    for (const o of ids().filter(x => x.text == null && clipKind(x) !== 'audio')) {
      const t = b.dataset.an;
      if (t === 'in') animIn(o, $('[data-s=anIn]').value, Math.min(dd, o.dur / 2));
      if (t === 'out') animOut(o, $('[data-s=anOut]').value, Math.min(dd, o.dur / 2));
      if (t === 'loop') loopAnim(o, $('[data-s=anLoop]').value);
      if (t === 'logo') logo(o, $('[data-s=anLogo]').value);
      if (t === 'clear' && o.kf) { for (const p of ['scale', 'rot', 'opacity', 'px', 'py', 'rotY', 'rotX']) delete o.kf[p]; if (!Object.keys(o.kf).length) delete o.kf; }
    }
    afterEdit(); toast('Animation applied. Press play to see it; edit the keys in "Keyframes" below.');
  } else if (b.id === 'trk-pick') { TRK.pick = c.id; const m = $('#trk-msg'); if (m) m.textContent = 'Click the object on the picture now.'; }
  else if (b.id === 'trk-go') {
    const m = $('#trk-msg'); b.disabled = true; m.textContent = 'Tracking…';
    try {
      const size = +$('#trk-size').value, [u, v] = c.trkPick, id = c.id;
      const r = await trackRun(c, u, v, size, (p, lost) => { m.textContent = `Tracking… ${Math.round(p * 100)}%${lost ? ' (object not found in some frames)' : ''}`; });
      const cc = state.clips.find(o => o.id === id); pushHistory(); cc.trk = r.pts; cc.trkSize = size; renderInspector();
      const m2 = $('#trk-msg'); if (m2) m2.textContent = r.lost > 3 ? 'Tracking finished, but the object was lost near the end. Use a larger box or a clearer object.' : 'Tracking finished. Choose what should follow it.';
    } catch (err) { m.textContent = 'Could not track: ' + err.message; b.disabled = false; }
  } else if (b.id === 'trk-apply' || b.id === 'trk-mask') {
    const pts = c.trk, m = $('#trk-msg');
    pushHistory();
    if (b.id === 'trk-mask') {
      const cl = (c.cropL || 0) / 100, cr = (c.cropR || 0) / 100, ct = (c.cropT || 0) / 100, cb = (c.cropB || 0) / 100;
      if (!c.mask || c.mask === 'none') Object.assign(c, { mask: 'ellipse', mw: 22, mh: 22, feather: 6 });
      c.kf = c.kf || {}; c.kf.mx = pts.map(([t, u]) => ({ t, v: +(((u - cl) / (1 - cl - cr) - 0.5) * 100).toFixed(2) })); c.kf.my = pts.map(([t, , v]) => ({ t, v: +(((v - ct) / (1 - ct - cb) - 0.5) * 100).toFixed(2) })); c.kfSmooth = false;
      afterEdit(); toast('The mask now follows the object. Use "Invert" to blur or hide it with a filter, or change its size.');
    } else {
      const t = state.clips.find(o => o.id === +$('#trk-target').value);
      if (!t) return;
      const isT = t.text != null, at = tt => { const i = pts.findIndex(p => p[0] + c.start >= tt); const q = i < 0 ? pts[pts.length - 1] : pts[i]; return trackPoint(c, q[1], q[2]); };
      const [x0, y0] = at(Math.max(t.start, c.start + pts[0][0])), cx0 = isT ? W * (t.x ?? 50) / 100 : W / 2 + (t.px || 0) * W / 100, cy0 = isT ? H * (t.y ?? 50) / 100 : H / 2 + (t.py || 0) * H / 100, ox = cx0 - x0, oy = cy0 - y0;
      const kx = [], ky = [];
      for (const [tl, u, v] of pts) { const abs = c.start + tl; if (abs < t.start - 1e-6 || abs > t.start + t.dur + 1e-6) continue; const [X, Y] = trackPoint(c, u, v); kx.push({ t: +(abs - t.start).toFixed(3), v: +(isT ? (X + ox) / W * 100 : (X + ox - W / 2) / W * 100).toFixed(2) }); ky.push({ t: +(abs - t.start).toFixed(3), v: +(isT ? (Y + oy) / H * 100 : (Y + oy - H / 2) / H * 100).toFixed(2) }); }
      if (kx.length < 2) { state.history.pop(); m.textContent = 'The chosen clip is not on the timeline during the tracked time. Move it over the tracked part.'; return; }
      t.kf = t.kf || {}; t.kf[isT ? 'x' : 'px'] = kx; t.kf[isT ? 'y' : 'py'] = ky; t.kfSmooth = false;
      afterEdit(); toast('The clip now follows the object.');
    }
  } else if (b.id === 'trk-clear') { pushHistory(); delete c.trk; delete c.trkPick; if (c.kf) { delete c.kf.mx; delete c.kf.my; } afterEdit(); }
  else if (b.id === 'pr-save') {
    const name = ($('#pr-name').value || '').trim() || 'My preset', kind = c.text != null ? 'text' : 'media', p = { name, kind, props: stash(c, kind === 'text' ? PT : PK) };
    if ($('#pr-kf').checked && c.kf) p.kf = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(c.kf).filter(([f]) => !f.startsWith('stab') && f !== 'speed'))));
    const all = presets().filter(x => !(x.name === name && x.kind === kind)); all.push(p); savePresets(all); renderInspector(); toast(`Saved "${name}".`);
  } else if (b.dataset.pr === 'apply') {
    const p = presets()[+b.dataset.i]; if (!p) return;
    pushHistory();
    for (const o of ids().filter(x => (x.text != null) === (p.kind === 'text'))) { Object.assign(o, JSON.parse(JSON.stringify(p.props))); if (p.kf) { o.kf = { ...(o.kf || {}), ...JSON.parse(JSON.stringify(p.kf)) }; } }
    afterEdit();
  } else if (b.dataset.pr === 'del') { const a = presets(); a.splice(+b.dataset.i, 1); savePresets(a); renderInspector(); }
  else if (b.id === 'pr-export') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(presets(), null, 1)], { type: 'application/json' })); a.download = 'opencut-effect-presets.json'; a.click(); }
  else if (b.id === 'pr-import') $('#pr-file').click();
});
$('#inspector').addEventListener('change', async e => {
  if (e.target.id !== 'pr-file' || !e.target.files[0]) return;
  try {
    const arr = JSON.parse(await e.target.files[0].text());
    if (!Array.isArray(arr) || !arr.every(p => p && typeof p.name === 'string' && (p.kind === 'text' || p.kind === 'media') && p.props && typeof p.props === 'object')) throw new Error('not a preset file');
    const have = presets(); for (const p of arr) { const i = have.findIndex(x => x.name === p.name && x.kind === p.kind); if (i >= 0) have[i] = p; else have.push(p); }
    savePresets(have); renderInspector(); toast(`Imported ${arr.length} presets.`);
  } catch (err) { toast('Could not import: ' + err.message); }
  e.target.value = '';
});
// changing the mask shape or an animation select re-lays the section; presets/masks need a redraw
$('#inspector').addEventListener('change', e => { const f = e.target.dataset && e.target.dataset.f; if (f === 'mask') renderInspector(); });
window.FX_TRACK = { trackRun, trackPoint };   // used by edit-api.js (track_label)
})();
