{
  // ================================================================ content (change this block for a new story)
  // "A Stag at the Wedding", told as a pop-up book on a desk. One spread per idea. Pieces stand on the same fold
  // mechanisms as the reference (v, box, float, slide). `pop` pieces are V-fold sliders that come up through a slit in
  // the page on the word they illustrate (a hidden pull strip), and every ribbon of words is a slider too, so it rises
  // as its word is spoken. A float can also rock on its tab (`wob`), which is how Andare tilts his head and charges.
  // All times come from BEATS.
  const C = { card: '#f5ecd9', cream: '#fbf3df', navy: '#22364e', coral: '#e2604a', pink: '#f3ab99', yellow: '#f5bd35', honey: '#eba020', amber: '#cf7d22', leaf: '#74a25e', sage: '#a6c787', deep: '#2f6753', sky: '#cfe5df',
    skin: '#b0703f', skinD: '#8c522c', wood: '#8a5a32', clay: '#b4532f', brass: '#d39a2e', brassL: '#f0c45a', white: '#fffaf0', stone: '#8f8b80', grey: '#d8d2c6', dust: '#eadcc0', ox: '#c98b52', oxD: '#a46a39', plum: '#7a3f6b' };

  // ---------------------------------------------------------------- BEATS: one entry per voiceover line
  // t = [start, end] in seconds, say = the words spoken, show = what happens on screen. `words` holds the real word
  // times ([[word, time], ...], from the voiceover with Whisper); without them W() estimates a word's time from its
  // position in the line, so a new take only means replacing this table.
  const BEATS = /*BEATS*/;
  // time a word is spoken in line n (1-based). nth picks a later occurrence.
  const W = (n, word, nth = 0) => {
    const b = BEATS[n - 1];
    if (b.words) { const key = word.toLowerCase().replace(/[^a-z0-9']/g, ''), hit = b.words.filter(([w]) => w.startsWith(key))[nth]; if (hit) return hit[1]; }
    const s = b.say.toLowerCase(); let i = -1; for (let k = 0; k <= nth; k++) i = s.indexOf(word.toLowerCase(), i + 1);
    if (i < 0) throw new Error(`word "${word}" not in line ${n}`);
    return b.t[0] + (i / s.length) * (b.t[1] - b.t[0]);
  };
  const DUR = BEATS[BEATS.length - 1].t[1] + 1.0;

  const PAGE_W = 5.6, PAGE_D = 6.4;
  const TURN = 1.25;
  // pop-up reveals. Each records itself so the score can play its sound on the same frame.
  const REVEALS = [];
  const up = (at, h, kind, sinkAt) => { REVEALS.push({ at, kind }); if (sinkAt) REVEALS.push({ at: sinkAt + 0.3, kind: 'sink' }); return (t) => -(h + 0.25) * (1 - K.seg(t, at - 0.32, at + 0.18, K.ease.out)) - (sinkAt ? (h + 0.25) * K.seg(t, sinkAt, sinkAt + 0.4, K.ease.inOut) : 0); };
  const pop = (z, at, size, art, kind = 'pop', sinkAt) => ({ fold: 'v', z, alpha: 58, size, slide: up(at, size[1], kind, sinkAt), art });

  // ---------------------------------------------------------------- printed motifs
  const leaf = (a, x, y, len, q, col = C.leaf) => a.path(col, (c) => { const ex = x + Math.cos(q) * len, ey = y + Math.sin(q) * len; c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(q + 0.6) * len * 0.6, y + Math.sin(q + 0.6) * len * 0.6, ex, ey); c.quadraticCurveTo(x + Math.cos(q - 0.6) * len * 0.6, y + Math.sin(q - 0.6) * len * 0.6, x, y); });
  const grass = (a, x0, x1, h, col, seed) => a.path(col, (c) => { const r = K.rng(seed); c.moveTo(x0, -0.1); for (let x = x0; x < x1 - 0.05;) { const w = r.range(0.13, 0.24); c.lineTo(x + w * r.range(0.2, 0.8), h * r.range(0.75, 1.5)); x += w; c.lineTo(Math.min(x, x1), h * 0.5); } c.lineTo(x1, -0.1); });
  const ground = (a, x0, x1, col = C.wood) => a.box(col, x0, -0.12, x1 - x0, 0.14, 0.04);           // the strip a slider stands on (below the page when up)
  const arm = (a, pts) => { const p = (c) => { c.moveTo(pts[0], pts[1]); c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); }; a.line(C.cream, 0.13, p); a.line(C.navy, 0.045, p, [0.1, 0.12]); };
  const flame = (a, x, y, s) => { a.path(C.coral, (c) => { c.moveTo(x - 0.22 * s, y); c.quadraticCurveTo(x - 0.25 * s, y + 0.35 * s, x, y + 0.7 * s); c.quadraticCurveTo(x + 0.25 * s, y + 0.35 * s, x + 0.22 * s, y); }); a.path(C.yellow, (c) => { c.moveTo(x - 0.11 * s, y); c.quadraticCurveTo(x - 0.12 * s, y + 0.2 * s, x, y + 0.42 * s); c.quadraticCurveTo(x + 0.12 * s, y + 0.2 * s, x + 0.11 * s, y); }); };
  const palm = (a, x, y0, h, lean = 0.3, s = 1) => {
    const tx = x + lean, ty = y0 + h;
    a.line(C.wood, 0.15 * s, (c) => { c.moveTo(x, y0); c.quadraticCurveTo(x - lean * 0.4, y0 + h * 0.55, tx, ty); });
    for (let k = 0; k < 4; k++) a.line('#6e4526', 0.04 * s, (c) => { const u = 0.2 + k * 0.18, px = K.lerp(x, tx, u) - lean * 0.2 * Math.sin(u * 3), py = y0 + h * u; c.moveTo(px - 0.07 * s, py); c.lineTo(px + 0.07 * s, py + 0.04); });
    [-0.35, 0.25, 0.85, 1.6, 2.3, 2.9, 3.5].forEach((q, k) => leaf(a, tx, ty, (0.85 + 0.1 * (k % 2)) * s, q, k % 2 ? C.leaf : C.deep));
    [[-0.09, -0.1], [0.08, -0.12], [0, -0.2]].forEach(([dx, dy]) => a.disc('#6e4526', tx + dx * s, ty + dy * s, 0.09 * s));
  };
  const house = (a, x, w, h, o = {}) => {
    a.box(o.wall || C.cream, x - w / 2, -0.1, w, h + 0.1, 0.03);
    a.path(o.roof || C.coral, (c) => { c.moveTo(x - w / 2 - 0.22, h - 0.05); c.lineTo(x - w / 2 + 0.25, h + w * 0.32); c.lineTo(x + w / 2 - 0.25, h + w * 0.32); c.lineTo(x + w / 2 + 0.22, h - 0.05); });
    for (let k = 1; k < 4; k++) a.line(C.amber, 0.035, (c) => { const yy = h - 0.05 + k * w * 0.08; c.moveTo(x - w / 2 - 0.2 + k * 0.12, yy); c.lineTo(x + w / 2 + 0.2 - k * 0.12, yy); });
    a.box(C.navy, x - 0.17 * w, -0.1, 0.24 * w, h * 0.62, [0.08, 0.08, 0, 0]);
    if (o.glow) a.box(C.yellow, x - 0.13 * w, -0.06, 0.16 * w, h * 0.56, [0.06, 0.06, 0, 0]);
    a.box(C.navy, x + 0.14 * w, h * 0.35, 0.22 * w, h * 0.3, 0.03); a.box(o.glow ? C.yellow : C.sky, x + 0.16 * w, h * 0.37, 0.18 * w, h * 0.26, 0.02);
  };
  const cloud = (a, x, y, w, col = C.white) => { const P = [[-0.32, 0, 0.3], [0, 0.1, 0.36], [0.32, 0, 0.3], [0.12, -0.12, 0.28], [-0.16, -0.12, 0.26]]; P.forEach(([dx, dy, r]) => a.disc(C.sky, x + dx * w, y + dy * w, r * w + 0.05)); P.forEach(([dx, dy, r]) => a.disc(col, x + dx * w, y + dy * w, r * w)); };
  const sunDisc = (a, x, y, r) => { for (let k = 0; k < 12; k++) a.line(C.yellow, 0.06, (c) => { c.moveTo(x + Math.cos(k * 0.5236) * r * 1.2, y + Math.sin(k * 0.5236) * r * 1.2); c.lineTo(x + Math.cos(k * 0.5236) * r * 1.45, y + Math.sin(k * 0.5236) * r * 1.45); }); a.disc(C.yellow, x, y, r); a.disc('#f9d46c', x, y, r * 0.72); };
  const burst = (a, x, y, r, col = C.coral) => a.path(col, (c) => { for (let k = 0; k < 18; k++) { const q = k * Math.PI / 9, rr = k % 2 ? r * 0.55 : r; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } c.closePath(); });
  const bubble = (a, x, y, w, h, tailX, tailY, str, col = C.coral) => { a.path(C.navy, (c) => { c.moveTo(x - 0.15, y - h / 2 + 0.05); c.lineTo(tailX, tailY); c.lineTo(x + 0.15, y - h / 2 + 0.05); }); a.box(C.navy, x - w / 2 - 0.05, y - h / 2 - 0.05, w + 0.1, h + 0.1, h / 2); a.box(C.white, x - w / 2, y - h / 2, w, h, h / 2); if (str) a.text(str, x, y - h * 0.3, h * 0.8, col); };
  const tick = (a, x, y, s, col = C.leaf) => a.line(col, 0.13 * s, (c) => { c.moveTo(x - 0.3 * s, y); c.lineTo(x - 0.08 * s, y - 0.22 * s); c.lineTo(x + 0.32 * s, y + 0.28 * s); });
  const cross = (a, x, y, s, col = C.coral) => { a.line(col, 0.16 * s, (c) => { c.moveTo(x - 0.4 * s, y - 0.4 * s); c.lineTo(x + 0.4 * s, y + 0.4 * s); }); a.line(col, 0.16 * s, (c) => { c.moveTo(x - 0.4 * s, y + 0.4 * s); c.lineTo(x + 0.4 * s, y - 0.4 * s); }); };
  const pageNo = (a, n) => { a.disc(C.coral, -4.6, -2.55, 0.34); a.disc(C.cream, -4.6, -2.55, 0.27); a.text(String(n), -4.6, -2.72, 0.46, C.navy); };
  const floorBase = (a, col) => a.box(col, -5.42, -3.02, 10.84, 6.04, 0.45);
  const scatter = (a, seed, n, fn) => { const r = K.rng(seed); for (let i = 0; i < n; i++) { const x = r.range(-5, 5), y = r.range(-2.7, 2.7); if (Math.abs(x) < 2.6 && y > -1.6 && y < 1.4) continue; fn(x, y, r); } };
  const jasmine = (a, x, y, r) => { for (let k = 0; k < 5; k++) a.disc(C.white, x + Math.cos(k * 1.257) * r * 0.55, y + Math.sin(k * 1.257) * r * 0.55, r * 0.45, r * 0.3, k * 1.257); a.disc(C.yellow, x, y, r * 0.22); };
  // the wedding: a string of paper flags, an arch of young coconut leaves (gokkola), the poruwa, a brass oil lamp
  const bunting = (a, x0, x1, y, sag = 0.25, n = 9) => {
    a.line(C.navy, 0.03, (c) => { c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y - sag * 2, x1, y); });
    const cols = [C.coral, C.yellow, C.leaf, C.pink, C.sky];
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, px = K.lerp(x0, x1, u), py = y - sag * 4 * u * (1 - u), w = (x1 - x0) / n * 0.38; a.path(cols[i % cols.length], (c) => { c.moveTo(px - w, py + 0.01); c.lineTo(px + w, py + 0.01); c.lineTo(px, py - w * 1.6); }); }
  };
  const gate = (a, x0, x1, h) => {
    const cx = (x0 + x1) / 2, arc = (u) => [K.lerp(x0 + 0.09, x1 - 0.09, u), h + 0.55 * Math.sin(u * Math.PI)];
    a.box(C.leaf, x0, -0.1, 0.18, h + 0.15, 0.05); a.box(C.leaf, x1 - 0.18, -0.1, 0.18, h + 0.15, 0.05);                 // banana-trunk posts
    for (const x of [x0 + 0.09, x1 - 0.09]) for (let k = 0; k < 4; k++) leaf(a, x, 0.3 + k * 0.32, 0.36, k % 2 ? 0.5 : 2.6, C.deep);
    for (let i = 0; i <= 14; i++) { const [px, py] = arc(i / 14); a.path(C.yellow, (c) => { c.moveTo(px - 0.1, py); c.lineTo(px + 0.1, py); c.lineTo(px + 0.02, py - 0.34); }); }   // the leaf fringe
    a.line(C.honey, 0.2, (c) => { const [sx, sy] = arc(0); c.moveTo(sx, sy); for (let i = 1; i <= 20; i++) { const [px, py] = arc(i / 20); c.lineTo(px, py); } });
    for (let i = 1; i < 6; i++) { const [px, py] = arc(i / 6); a.disc(i % 2 ? C.coral : C.pink, px, py + 0.02, 0.1); }
    a.disc(C.coral, cx, h + 0.75, 0.16); a.disc(C.yellow, cx, h + 0.75, 0.08);
  };
  const poruwa = (a, x, w) => {
    a.box(C.white, x - w / 2, -0.1, w, 0.5, 0.04); a.box(C.brass, x - w / 2, 0.28, w, 0.08); for (let k = 0; k < 6; k++) a.disc(C.coral, x - w / 2 + 0.2 + k * (w - 0.4) / 5, 0.16, 0.06);
    for (const px of [x - w / 2 + 0.08, x + w / 2 - 0.2]) a.box(C.brass, px, 0.38, 0.12, 1.85, 0.03);
    a.path(C.white, (c) => { c.moveTo(x - w / 2 - 0.15, 2.2); c.lineTo(x, 2.75); c.lineTo(x + w / 2 + 0.15, 2.2); });
    a.box(C.brass, x - w / 2 - 0.15, 2.14, w + 0.3, 0.1, 0.04);
    a.line(C.pink, 0.08, (c) => { c.moveTo(x - w / 2 + 0.1, 2.05); c.quadraticCurveTo(x, 1.65, x + w / 2 - 0.1, 2.05); });
    for (let k = 0; k < 7; k++) { const u = k / 6; jasmine(a, x - w / 2 + 0.1 + u * (w - 0.2), 2.05 - 0.8 * u * (1 - u) * 1.0, 0.08); }
  };
  const oilLamp = (a, x, y0, s) => {
    a.disc(C.brass, x, y0 + 0.06 * s, 0.4 * s, 0.1 * s); a.box(C.brass, x - 0.06 * s, y0, 0.12 * s, 1.5 * s);
    [0.45, 0.85].forEach((h) => a.disc(C.brassL, x, y0 + h * s, 0.13 * s, 0.08 * s));
    a.path(C.brass, (c) => { c.moveTo(x - 0.42 * s, y0 + 1.48 * s); c.quadraticCurveTo(x, y0 + 1.2 * s, x + 0.42 * s, y0 + 1.48 * s); c.closePath(); });
    a.path(C.brass, (c) => { c.moveTo(x - 0.12 * s, y0 + 1.48 * s); c.lineTo(x, y0 + 1.95 * s); c.lineTo(x + 0.12 * s, y0 + 1.48 * s); });
    [-0.32, -0.16, 0, 0.16, 0.32].forEach((d, i) => flame(a, x + d * s, y0 + 1.5 * s, (i === 2 ? 0.32 : 0.26) * s));
    a.disc(C.brassL, x, y0 + 1.98 * s, 0.06 * s);
  };
  const invite = (a, x, y, w) => {
    const h = w * 0.68; a.box(C.coral, x - w / 2, y - h / 2, w, h, 0.06); a.box(C.cream, x - w / 2 + 0.07, y - h / 2 + 0.07, w - 0.14, h - 0.14, 0.04);
    a.line(C.brass, 0.05, (c) => c.arc(x - 0.13 * w, y + 0.12 * h, 0.13 * w, 0, 7)); a.line(C.brass, 0.05, (c) => c.arc(x + 0.13 * w, y + 0.12 * h, 0.13 * w, 0, 7));
    a.disc(C.coral, x - 0.13 * w, y + 0.12 * h + 0.14 * w, 0.03 * w + 0.02);
    a.text('Wedding', x, y - 0.36 * h, 0.17 * w, C.navy);
    jasmine(a, x - w / 2 + 0.12, y + h / 2 - 0.12, 0.09); jasmine(a, x + w / 2 - 0.12, y + h / 2 - 0.12, 0.09);
  };
  const dustCloud = (a, x, y, w, swirl) => {
    [[-0.38, -0.05, 0.3], [-0.12, 0.12, 0.36], [0.2, 0.08, 0.34], [0.42, -0.08, 0.26], [0.05, -0.18, 0.32], [-0.3, -0.25, 0.22], [0.3, -0.26, 0.22]].forEach(([dx, dy, r]) => a.disc('#d9c7a2', x + dx * w, y + dy * w, r * w + 0.05));
    [[-0.38, -0.05, 0.3], [-0.12, 0.12, 0.36], [0.2, 0.08, 0.34], [0.42, -0.08, 0.26], [0.05, -0.18, 0.32], [-0.3, -0.25, 0.22], [0.3, -0.26, 0.22]].forEach(([dx, dy, r]) => a.disc(C.dust, x + dx * w, y + dy * w, r * w));
    if (swirl) [[-0.2, 0.05, 0.16], [0.18, -0.04, 0.13], [0.0, -0.2, 0.1], [0.32, 0.14, 0.09]].forEach(([dx, dy, r]) => a.line('#b89a68', 0.045, (c) => c.arc(x + dx * w, y + dy * w, r * w, 0.3, 5.2)));
  };
  // motion lines and little stars, for anything moving fast or hit
  const speed = (a, x, y, len, n = 3, k = -1) => { for (let i = 0; i < n; i++) a.line(C.navy, 0.04, (c) => { c.moveTo(x, y + i * 0.16); c.lineTo(x + k * len * (1 - 0.2 * i), y + i * 0.16); }); };
  const star = (a, x, y, r, col = C.yellow) => a.path(col, (c) => { for (let k = 0; k < 10; k++) { const q = Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } c.closePath(); });

  // ---------------------------------------------------------------- the people (drawn in their own units, standing on y0)
  // mood: happy, laugh, shock, angry, grumpy, look, ask, sly, quiet, sheep (sheepish)
  const face = (a, hx, hy, r, mood, k) => {
    const ex = 0.33 * r * k, ey = hy + 0.05 * r;
    const brow = (w, y0, y1) => { a.line(C.navy, w, (c) => { c.moveTo(hx + ex - 0.5 * r, ey + y0 * r); c.lineTo(hx + ex - 0.12 * r, ey + y1 * r); }); a.line(C.navy, w, (c) => { c.moveTo(hx + ex + 0.5 * r, ey + y0 * r); c.lineTo(hx + ex + 0.12 * r, ey + y1 * r); }); };
    if (mood === 'angry') brow(0.06, 0.38, 0.22);
    if (mood === 'grumpy') brow(0.05, 0.32, 0.24);
    if (mood === 'shock' || mood === 'sheep') brow(0.045, 0.3, 0.42);
    if (mood === 'sly') a.line(C.navy, 0.045, (c) => { c.moveTo(hx + ex + 0.12 * r, ey + 0.3 * r); c.quadraticCurveTo(hx + ex + 0.3 * r, ey + 0.42 * r, hx + ex + 0.48 * r, ey + 0.32 * r); });
    if (mood === 'laugh' || mood === 'quiet') [-0.28, 0.28].forEach((d) => a.line(C.navy, 0.05, (c) => c.arc(hx + ex + d * r, ey - 0.06 * r, 0.13 * r, mood === 'laugh' ? Math.PI + 0.3 : 0.3, mood === 'laugh' ? -0.3 : Math.PI - 0.3)));
    else {
      const dy = mood === 'look' || mood === 'sheep' ? -0.12 * r : 0, big = mood === 'shock' ? 1.35 : 1;
      if (mood === 'shock') [-0.28, 0.28].forEach((d) => a.disc(C.white, hx + ex + d * r, ey, 0.19 * r));
      a.disc(C.navy, hx + ex - 0.28 * r, ey + dy, 0.12 * r * (mood === 'shock' ? 0.8 : 1), (mood === 'sly' ? 0.06 : 0.14) * r * big); a.disc(C.navy, hx + ex + 0.28 * r, ey + dy, 0.12 * r * (mood === 'shock' ? 0.8 : 1), 0.14 * r * big);
    }
    a.disc(C.pink, hx + ex - 0.5 * r, hy - 0.3 * r, 0.12 * r, 0.08 * r); a.disc(C.pink, hx + ex + 0.52 * r, hy - 0.3 * r, 0.12 * r, 0.08 * r);
    const mx = hx + ex, my = hy - 0.42 * r;
    if (mood === 'happy' || mood === 'sly' || mood === 'quiet') a.line(C.navy, 0.05, (c) => c.arc(mx, my + 0.22 * r, 0.3 * r, Math.PI + 0.55, 2 * Math.PI - 0.55));
    else if (mood === 'laugh') { a.path(C.navy, (c) => { c.moveTo(mx - 0.32 * r, my + 0.08 * r); c.quadraticCurveTo(mx, my - 0.5 * r, mx + 0.32 * r, my + 0.08 * r); c.closePath(); }); a.disc(C.coral, mx, my - 0.14 * r, 0.12 * r, 0.06 * r); }
    else if (mood === 'grumpy' || mood === 'look' || mood === 'sheep') a.line(C.navy, 0.05, (c) => c.arc(mx, my - 0.22 * r, 0.24 * r, 0.6, Math.PI - 0.6));
    else if (mood === 'angry' || mood === 'ask' || mood === 'shock') a.disc(C.navy, mx, my, 0.17 * r, mood === 'shock' ? 0.24 * r : 0.21 * r);
    else a.line(C.navy, 0.05, (c) => { c.moveTo(mx - 0.15 * r, my); c.lineTo(mx + 0.15 * r, my); });
  };
  const limbs = (a) => (pts, w = 0.15, col = C.skin) => a.line(col, w, (p) => { p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); });
  // everyone can lean (tilt, radians, about the feet), which is how people tumble
  const body = (a, x, y0, s, o, draw) => { const c = a.ctx; c.save(); c.translate(x, y0); c.rotate(-(o.tilt || 0) * (o.face || 1)); c.scale(s * (o.face || 1), s); draw(limbs(a)); c.restore(); };
  // Andare: a small boy in a yellow shirt and navy shorts. pose: stand, jump, reach, wave, run, beg
  const kid = (a, x, y0, s, o = {}) => body(a, x, y0, s, o, (skin) => {
    const pose = o.pose || 'stand';
    if (pose === 'run') { skin([-0.1, 0.72, -0.32, 0.38, -0.55, 0.12], 0.17); skin([0.1, 0.72, 0.3, 0.38, 0.52, 0.3], 0.17); a.disc(C.navy, -0.6, 0.08, 0.12, 0.07); a.disc(C.navy, 0.6, 0.28, 0.12, 0.07, 0.6); }
    else if (pose === 'jump') { skin([-0.12, 0.72, -0.22, 0.4, -0.12, 0.12], 0.16); skin([0.12, 0.72, 0.3, 0.42, 0.2, 0.14], 0.16); a.disc(C.navy, -0.1, 0.1, 0.13, 0.07); a.disc(C.navy, 0.24, 0.12, 0.13, 0.07); }
    else { a.box(C.skin, -0.2, 0.04, 0.15, 0.72); a.box(C.skin, 0.05, 0.04, 0.15, 0.72); a.disc(C.navy, -0.14, 0.04, 0.14, 0.07); a.disc(C.navy, 0.16, 0.04, 0.14, 0.07); }
    a.box(o.shorts || C.navy, -0.32, 0.6, 0.64, 0.38, 0.07);
    const back = { stand: [-0.3, 1.42, -0.45, 0.95], jump: [-0.3, 1.42, -0.62, 1.8, -0.7, 2.2], reach: [-0.3, 1.42, -0.45, 0.95], wave: [-0.3, 1.42, -0.45, 0.95], run: [-0.3, 1.42, -0.6, 1.12, -0.72, 1.3], beg: [-0.3, 1.4, 0.1, 1.2, 0.4, 1.35], fall: [-0.3, 1.42, -0.7, 1.75, -0.85, 2.05] }[pose];
    const front = { stand: [0.3, 1.42, 0.45, 0.95], jump: [0.3, 1.42, 0.62, 1.8, 0.7, 2.2], reach: [0.3, 1.42, 0.62, 1.3, 0.92, 1.4], wave: [0.3, 1.45, 0.58, 1.75, 0.66, 2.1], run: [0.3, 1.42, 0.6, 1.2, 0.82, 1.42], beg: [0.3, 1.4, 0.45, 1.2, 0.4, 1.35], fall: [0.3, 1.42, 0.72, 1.7, 0.95, 1.9] }[pose];
    skin(back);
    a.box(o.shirt || C.yellow, -0.36, 0.88, 0.72, 0.68, 0.14); a.box(C.cream, -0.06, 1.25, 0.12, 0.28, 0.04);
    skin(front);
    a.box(C.skin, -0.09, 1.5, 0.18, 0.2);
    const hy = 1.98, r = 0.42;
    a.disc(C.skin, -0.4, hy - 0.02, 0.09); a.disc(C.skin, 0.4, hy - 0.02, 0.09);
    a.disc(C.skin, 0, hy, r);
    a.clip((p) => p.ellipse(0, hy + 0.02, r + 0.03, r + 0.03, 0, 0, 7), () => { a.path(o.hair || C.navy, (p) => { p.moveTo(-0.6, hy + 0.1); p.lineTo(-0.3, hy + 0.2); p.lineTo(-0.1, hy + 0.13); p.lineTo(0.15, hy + 0.22); p.lineTo(0.38, hy + 0.12); p.lineTo(0.6, hy + 0.15); p.lineTo(0.6, hy + 0.6); p.lineTo(-0.6, hy + 0.6); }); });
    a.disc(o.hair || C.navy, -0.18, hy + 0.42, 0.13, 0.08, -0.4);
    face(a, 0, hy - 0.05, r * 0.82, o.mood || 'happy', 1);
  });
  // Andare on his hands and knees, head down like a bull. o.head = head tilt (radians), o.puff = snorts from the nose
  const bullKid = (a, x, y0, s, o = {}) => body(a, x, y0, s, o, (skin) => {
    skin([-0.5, 0.5, -0.4, 0.07, -0.98, 0.07], 0.16, C.skinD);          // far leg: thigh down to the knee, shin along the ground
    skin([0.24, 0.84, 0.36, 0.06], 0.14, C.skinD);                       // far arm
    a.box(C.navy, -0.8, 0.36, 0.52, 0.44, 0.13);                          // shorts
    skin([-0.62, 0.48, -0.55, 0.06, -1.08, 0.06], 0.17);                 // near leg
    a.box(C.yellow, -0.46, 0.5, 0.98, 0.46, 0.17);                         // shirt, level like a back
    skin([0.36, 0.8, 0.5, 0.06], 0.15); a.disc(C.skin, 0.56, 0.06, 0.09, 0.06);
    const c = a.ctx; c.save(); c.translate(0.78, 0.8); c.rotate(o.head == null ? -0.35 : o.head);
    const r = 0.38; a.disc(C.skin, -0.36, 0.0, 0.09);
    a.disc(C.skin, 0, 0, r);
    a.clip((p) => p.ellipse(0, 0.02, r + 0.03, r + 0.03, 0, 0, 7), () => a.path(C.navy, (p) => { p.moveTo(-0.6, 0.1); p.lineTo(-0.3, 0.2); p.lineTo(-0.1, 0.13); p.lineTo(0.15, 0.22); p.lineTo(0.38, 0.12); p.lineTo(0.6, 0.15); p.lineTo(0.6, 0.6); p.lineTo(-0.6, 0.6); }));
    face(a, 0.02, -0.05, r * 0.82, o.mood || 'angry', 1);
    if (o.puff) { a.disc(C.white, 0.55, -0.32, 0.1); a.disc(C.white, 0.72, -0.38, 0.13); a.disc(C.white, 0.9, -0.33, 0.09); }
    c.restore();
  });
  // a grown woman in a jacket and wrap-around cloth. pose: stand, explain (finger up), hold, look, run, grab, laugh, angry, mirror
  const lady = (a, x, y0, s, o = {}) => body(a, x, y0, s, o, (skin) => {
    const pose = o.pose || 'stand';
    if (pose === 'run') { skin([-0.1, 0.6, -0.4, 0.3, -0.55, 0.06], 0.16); skin([0.1, 0.6, 0.38, 0.32, 0.62, 0.3], 0.16); a.disc(C.navy, -0.6, 0.06, 0.14, 0.07); a.disc(C.navy, 0.68, 0.3, 0.14, 0.07, 0.5); }
    else { a.disc(C.navy, -0.16, 0.04, 0.15, 0.07); a.disc(C.navy, 0.18, 0.04, 0.15, 0.07); }
    const hem = pose === 'run' ? 0.42 : 0.04;
    a.path(o.cloth || C.deep, (p) => { p.moveTo(-0.46, hem); p.lineTo(-0.38, 1.15); p.lineTo(0.38, 1.15); p.lineTo(0.46, hem); });
    a.clip((p) => { p.moveTo(-0.46, hem); p.lineTo(-0.38, 1.15); p.lineTo(0.38, 1.15); p.lineTo(0.46, hem); }, () => { for (let yy = hem + 0.14; yy < 1.1; yy += 0.24) a.box(o.trim || C.yellow, -0.6, yy, 1.2, 0.05); a.line(o.trim || C.yellow, 0.04, (p) => { p.moveTo(0.18, hem); p.lineTo(0.24, 1.15); }); });
    const back = { stand: [-0.38, 1.7, -0.5, 1.15], explain: [-0.38, 1.7, -0.52, 1.25, -0.25, 1.15], hold: [-0.38, 1.7, -0.5, 1.15], look: [-0.38, 1.7, -0.2, 1.42, 0.35, 1.55], run: [-0.38, 1.7, -0.72, 1.4, -0.85, 1.6], grab: [-0.38, 1.7, -0.58, 1.95, -0.42, 2.25], laugh: [-0.38, 1.7, -0.35, 1.3, 0.05, 1.25], angry: [-0.38, 1.7, -0.72, 1.95, -0.72, 2.35], mirror: [-0.38, 1.7, -0.45, 2.15, -0.25, 2.45] }[pose];
    const front = { stand: [0.38, 1.7, 0.5, 1.15], explain: [0.38, 1.7, 0.7, 1.55, 0.78, 1.98], hold: [0.38, 1.7, 0.7, 1.4, 0.95, 1.5], look: [0.38, 1.7, 0.6, 1.42, 0.9, 1.55], run: [0.38, 1.7, 0.72, 1.95, 0.9, 2.2], grab: [0.38, 1.7, 0.75, 1.3, 1.1, 1.05], laugh: [0.38, 1.7, 0.35, 1.3, -0.05, 1.22], angry: [0.38, 1.7, 0.72, 1.95, 0.72, 2.35], mirror: [0.38, 1.7, 0.62, 1.55, 0.85, 1.7] }[pose];
    skin(back);
    a.box(o.top || C.white, -0.44, 1.08, 0.88, 0.75, 0.16); a.line(o.bride ? C.brass : C.coral, 0.04, (p) => { p.moveTo(-0.42, 1.14); p.lineTo(0.42, 1.14); }, [0.06, 0.05]);
    if (o.bride) { a.path(o.top || C.white, (p) => { p.moveTo(0.44, 1.8); p.quadraticCurveTo(0.8, 1.2, 0.5, 0.2); p.lineTo(0.38, 1.1); }); a.line(C.brass, 0.05, (p) => p.arc(0, 1.72, 0.22, Math.PI + 0.4, -0.4)); }
    skin(front);
    if (pose === 'angry') { a.disc(C.skin, -0.72, 2.38, 0.11); a.disc(C.skin, 0.72, 2.38, 0.11); }
    if (pose === 'explain') a.box(C.skin, 0.74, 1.95, 0.08, 0.26, 0.04);
    if (pose === 'grab') a.disc(C.skin, 1.12, 1.03, 0.11);
    a.box(C.skin, -0.09, 1.78, 0.18, 0.18);
    const hy = 2.22, r = 0.38;
    a.disc(o.grey ? C.grey : C.navy, -0.32, hy + 0.2, 0.2);                                  // the bun
    if (o.flowers) for (let k = 0; k < 4; k++) jasmine(a, -0.48 + k * 0.1, hy + 0.36 - Math.abs(k - 1.5) * 0.05, 0.07);
    a.disc(C.skin, 0, hy, r);
    a.clip((p) => p.ellipse(0, hy, r + 0.02, r + 0.02, 0, 0, 7), () => a.path(o.grey ? C.grey : C.navy, (p) => { p.moveTo(-0.5, hy + 0.05); p.quadraticCurveTo(-0.1, hy + 0.32, 0.05, hy + 0.24); p.quadraticCurveTo(0.3, hy + 0.32, 0.5, hy + 0.08); p.lineTo(0.5, hy + 0.6); p.lineTo(-0.5, hy + 0.6); }));
    if (o.bride) { a.line(C.brass, 0.05, (p) => { p.moveTo(-0.3, hy + 0.3); p.quadraticCurveTo(0, hy + 0.42, 0.3, hy + 0.3); }); a.disc(C.brassL, 0, hy + 0.33, 0.06); }
    a.disc(C.yellow, 0.06, hy - 0.2, 0.04);
    face(a, 0, hy - 0.04, r * 0.85, o.mood || 'happy', 1);
  });
  // a grown man in a shirt and sarong. pose: stand, fall, laugh, cross, point. o.grey + o.stick = an old man
  const man = (a, x, y0, s, o = {}) => body(a, x, y0, s, o, (skin) => {
    const pose = o.pose || 'stand';
    a.box(C.skin, -0.22, 0.04, 0.16, 0.5); a.box(C.skin, 0.06, 0.04, 0.16, 0.5); a.disc(C.navy, -0.15, 0.04, 0.15, 0.07); a.disc(C.navy, 0.16, 0.04, 0.15, 0.07);
    a.box(o.sarong || C.white, -0.42, 0.42, 0.84, 0.82, 0.04); a.box(o.belt || C.wood, -0.42, 1.16, 0.84, 0.08);
    if (o.sarong && o.sarong !== C.white) for (let yy = 0.55; yy < 1.1; yy += 0.18) a.box('rgba(255,255,255,0.35)', -0.42, yy, 0.84, 0.04);
    const back = { stand: [-0.42, 1.95, -0.55, 1.3], fall: [-0.42, 1.95, -0.82, 2.25, -0.9, 2.6], laugh: [-0.42, 1.95, -0.4, 1.45, 0.05, 1.4], cross: [-0.42, 1.95, 0.05, 1.7, 0.4, 1.85], point: [-0.42, 1.95, -0.55, 1.3] }[pose];
    const front = { stand: [0.42, 1.95, 0.55, 1.3], fall: [0.42, 1.95, 0.85, 2.2, 1.0, 2.5], laugh: [0.42, 1.95, 0.4, 1.45, -0.05, 1.38], cross: [0.42, 1.95, -0.05, 1.78, -0.4, 1.86], point: [0.42, 1.95, 0.8, 2.05, 1.1, 2.15] }[pose];
    skin(back);
    a.box(o.shirt || C.sky, -0.46, 1.2, 0.92, 0.88, 0.14); a.box(C.navy, -0.03, 1.3, 0.06, 0.7); [1.45, 1.7, 1.95].forEach((yy) => a.disc(C.white, 0.08, yy, 0.03));
    if (o.sash) a.line(o.sash, 0.12, (p) => { p.moveTo(-0.4, 2.0); p.lineTo(0.38, 1.28); });
    skin(front);
    if (o.stick) a.line(C.wood, 0.07, (p) => { p.moveTo(0.58, 1.38); p.lineTo(0.72, 0.0); });
    a.box(C.skin, -0.1, 2.02, 0.2, 0.16);
    const hy = 2.45, r = 0.38;
    a.disc(C.skin, -0.37, hy - 0.02, 0.08); a.disc(C.skin, 0.37, hy - 0.02, 0.08);
    a.disc(C.skin, 0, hy, r);
    a.clip((p) => p.ellipse(0, hy, r + 0.02, r + 0.02, 0, 0, 7), () => a.path(o.grey ? C.grey : C.navy, (p) => { p.moveTo(-0.5, hy + 0.12); p.quadraticCurveTo(0, hy + 0.3, 0.5, hy + 0.12); p.lineTo(0.5, hy + 0.6); p.lineTo(-0.5, hy + 0.6); }));
    if (o.mo) a.path(o.grey ? C.grey : C.navy, (p) => { p.moveTo(0.02, hy - 0.22); p.quadraticCurveTo(0.2, hy - 0.16, 0.36, hy - 0.3); p.quadraticCurveTo(0.2, hy - 0.26, 0.02, hy - 0.28); });
    if (o.turban) { a.box(o.turban, -0.4, hy + 0.18, 0.8, 0.26, 0.12); a.disc(C.brassL, 0.12, hy + 0.32, 0.06); }
    face(a, 0, hy - 0.04, r * 0.85, o.mood || 'happy', 1);
  });
  // a bull of the kind that pulls carts in the village: humped, curved horns, standing calm and quiet
  const bull = (a, x, y0, s, k = 1) => {
    const c = a.ctx; c.save(); c.translate(x, y0); c.scale(s * k, s);
    a.line(C.oxD, 0.06, (p) => { p.moveTo(-0.82, 1.05); p.quadraticCurveTo(-1.02, 0.8, -0.95, 0.42); }); a.disc(C.navy, -0.95, 0.38, 0.07, 0.11);
    [-0.62, 0.32].forEach((lx) => { a.box(C.oxD, lx, 0.06, 0.16, 0.66, 0.05); a.box(C.navy, lx, 0.0, 0.16, 0.09, 0.03); });
    a.disc(C.ox, 0, 0.9, 0.86, 0.42); a.disc(C.ox, 0.42, 1.22, 0.26, 0.22);
    [-0.48, 0.48].forEach((lx) => { a.box(C.ox, lx, 0.06, 0.17, 0.66, 0.05); a.box(C.navy, lx, 0.0, 0.17, 0.09, 0.03); });
    a.path(C.ox, (p) => { p.moveTo(0.55, 1.1); p.quadraticCurveTo(0.8, 0.6, 0.95, 0.62); p.lineTo(1.12, 0.95); p.lineTo(0.8, 1.25); });   // neck and dewlap
    a.disc(C.ox, 1.0, 1.0, 0.24, 0.3, -0.5); a.disc('#e0aa77', 1.17, 0.8, 0.16, 0.13);
    a.line(C.cream, 0.09, (p) => { p.moveTo(0.92, 1.24); p.quadraticCurveTo(0.8, 1.45, 0.88, 1.62); }); a.line(C.cream, 0.09, (p) => { p.moveTo(1.06, 1.26); p.quadraticCurveTo(1.12, 1.48, 1.04, 1.64); });
    a.disc(C.oxD, 0.78, 1.14, 0.15, 0.07, 0.5); a.disc(C.navy, 1.06, 1.05, 0.045); a.disc(C.navy, 1.24, 0.8, 0.025);
    a.line(C.navy, 0.03, (p) => { p.moveTo(1.12, 0.71); p.lineTo(1.26, 0.72); });                      // a closed mouth: not a word
    c.restore();
  };
  // the mother's lesson in a thought cloud: a bull standing quietly with its mouth shut
  const bullCloud = (a, x, y, w) => { cloud(a, x, y, w); bull(a, x - 0.22 * w, y - 0.28 * w, 0.42 * w); };

  // ---------------------------------------------------------------- shared sets
  const villageBack = (a, o = {}) => {
    const far = (x) => 1.25 + 0.35 * Math.cos((x + 1.4) * 0.6), near = (x) => 0.6 + 0.2 * Math.cos((x - 2.2) * 0.7);
    if (o.sun !== false) sunDisc(a, o.sunX == null ? 1.4 : o.sunX, o.sunY || 2.15, 0.62);
    a.ridge(C.sage, -4.75, 4.75, far);
    (o.palms || [[-4.0, 1.1, 0.25], [-3.1, 1.3, -0.2], [3.3, 1.2, 0.2], [4.2, 1.0, -0.15]]).forEach(([x, h, l]) => palm(a, x, far(x) - 0.3, h, l, 0.62));
    (o.houses || []).forEach(([x, w, h, glow]) => house(a, x, w, h, { glow }));
    a.ridge(C.leaf, -4.75, 4.75, near);
    const r = K.rng(o.seed || 9); for (let i = 0; i < 22; i++) { const x = r.range(-4.5, 4.5); a.disc(r.pick([C.cream, C.yellow, C.pink]), x, r.range(0.1, near(x) - 0.12), 0.055); }
  };
  // the wedding house seen from the yard, flags strung across: the backdrop for the second half
  const weddingBack = (a, seed) => {
    villageBack(a, { sunX: -3.0, sunY: 2.45, palms: [[-4.2, 1.1, 0.2], [4.2, 1.05, -0.2]], seed });
    house(a, 0, 3.4, 1.75, { wall: '#fdf0d8', roof: C.clay });
    bunting(a, -4.6, -1.75, 2.75, 0.2, 7); bunting(a, 1.75, 4.6, 2.75, 0.2, 7); bunting(a, -1.6, 1.6, 1.62, 0.15, 9);
  };
  const homeWall = (a, door) => {
    a.box(C.sky, -4.7, -0.1, 9.4, 3.05, 0.08); a.box('#b9d6cf', -4.7, -0.1, 9.4, 0.7, 0.04);
    a.box(C.wood, -1.6, 1.0, 3.2, 1.8, 0.08); a.box('#fbe7b3', -1.42, 1.15, 2.84, 1.5, 0.04);
    a.clip((c) => c.rect(-1.42, 1.15, 2.84, 1.5), () => { sunDisc(a, 0.75, 2.25, 0.32); palm(a, -0.8, 1.0, 1.1, 0.2, 0.55); a.ridge(C.sage, -1.6, 1.6, (x) => 1.4 + 0.12 * Math.cos(x * 2.1)); });
    a.box(C.wood, -0.05, 1.12, 0.1, 1.55); a.box(C.wood, -1.6, 1.86, 3.2, 0.08);
    a.box(C.wood, 2.4, 1.9, 1.6, 0.85, 0.05); a.box(C.cream, 2.5, 2.0, 1.4, 0.65, 0.03); a.disc(C.coral, 3.2, 2.3, 0.22); a.disc(C.leaf, 3.0, 2.22, 0.14);
    a.box(C.navy, -4.3, -0.1, 1.1, 2.4, [0.5, 0.5, 0, 0]);
    if (door) { a.box('#fbe7b3', -4.18, -0.1, 0.86, 2.25, [0.42, 0.42, 0, 0]); a.ridge(C.leaf, -4.18, -3.32, (x) => 0.55 + 0.1 * Math.cos(x * 4)); palm(a, -3.75, 0.3, 1.2, 0.15, 0.45); }
    else a.box('#2c4a66', -4.18, -0.1, 0.86, 2.25, [0.42, 0.42, 0, 0]);
  };
  const pots = (a) => { a.box(C.wood, -4.5, -0.1, 2.0, 1.0, 0.05); a.box('#6e4526', -4.4, 0.6, 1.8, 0.07); [-4.15, -3.5, -2.85].forEach((x) => { a.disc(C.clay, x, 1.25, 0.3, 0.28); a.box(C.clay, x - 0.15, 1.45, 0.3, 0.14, 0.04); a.box('#93401f', x - 0.3, 1.18, 0.6, 0.05); }); a.disc(C.clay, -3.5, 0.32, 0.36, 0.32); };
  const plant = (a) => { a.path(C.clay, (c) => { c.moveTo(3.1, -0.1); c.lineTo(2.95, 0.6); c.lineTo(4.05, 0.6); c.lineTo(3.9, -0.1); }); [2.3, 0.8, 1.6].forEach((q) => leaf(a, 3.5, 0.6, 0.9, q, C.leaf)); a.disc(C.coral, 3.2, 1.35, 0.16); a.disc(C.yellow, 3.85, 1.25, 0.14); a.disc(C.pink, 3.5, 1.6, 0.15); };
  const homeFloor = (a, n, col = '#e9c47a') => { floorBase(a, col); a.clip((c) => c.roundRect(-5.42, -3.02, 10.84, 6.04, 0.45), () => { for (let i = -24; i <= 24; i++) a.box(i % 2 ? 'rgba(176,100,27,0.12)' : 'rgba(255,240,200,0.25)', i * 0.24, -3.1, 0.2, 6.2); for (let j = -14; j <= 14; j += 2) a.box('rgba(176,100,27,0.25)', -5.5, j * 0.22, 11, 0.06); }); pageNo(a, n); };
  const yardFloor = (a, n, seed, col = '#ecd8a6') => { floorBase(a, col); scatter(a, seed, 26, (x, y, r) => (r.chance(0.5) ? jasmine(a, x, y, r.range(0.1, 0.16)) : a.disc(r.pick([C.coral, C.pink, C.yellow]), x, y, 0.06, 0.1, r.range(0, 3)))); pageNo(a, n); };

  // ---------------------------------------------------------------- the spreads
  // turn = when the page that opens this spread starts to turn; words/at = the ribbon and the moment it rises.
  const PULL = [W(24, 'burst') - 0.15, W(24, 'laughing') + 0.2];   // the pull tab: shocked faces become laughing ones
  const pulled = (t) => K.seg(t, PULL[0], PULL[1], K.ease.inOut);
  // Andare charging on the yard: his head tilts side to side through line 16 and he lunges on "headbutting" / "ramming"
  const LUNGES = [W(15, 'charging'), W(15, 'headbutting'), W(15, 'everyone'), W(16, 'ramming')];
  const wobble = (t) => {
    let q = 0.16 * Math.sin((t - W(16, 'tilting')) * 7.5) * K.seg(t, W(16, 'tilting') - 0.2, W(16, 'tilting') + 0.3) * (1 - K.seg(t, W(16, 'people'), W(16, 'people') + 0.6));
    LUNGES.forEach((l) => { const d = t - l + 0.1; if (d > 0 && d < 0.7) q -= 0.2 * Math.sin(d / 0.7 * Math.PI) * Math.exp(-d * 2); });
    return q;
  };
  const SPREADS = [
    { // ------------------------------------------------------------ 0. cover: the invitation comes to Andare's house
      turn: -1.03, words: ['A Stag at', 'the Wedding'], at: null,
      floor(a) { floorBase(a, '#f4dfa6'); scatter(a, 4, 34, (x, y, r) => (r.chance(0.55) ? jasmine(a, x, y, r.range(0.14, 0.22)) : leaf(a, x, y, 0.5, r.range(0, 6.3), r.pick([C.leaf, C.sage])))); },
      parts: [
        { id: 'back', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { villageBack(a, { sunX: -0.9, houses: [[-2.2, 1.1, 0.75], [2.4, 1.0, 0.7]] }); } },
        { fold: 'box', on: 'back', span: [-4.6, -2.4], depth: 1.35, strap: 0.75, height: 2.2, art(a) { grass(a, -4.55, -2.45, 0.3, C.deep, 3); palm(a, -3.6, 0.1, 1.45, 0.35, 0.95); } },
        { fold: 'box', on: 'back', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 5); gate(a, 2.75, 4.35, 1.2); } },
        { id: 'home', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.25, 2.25); house(a, -1.25, 1.9, 1.35);
          man(a, -0.05, -0.02, 0.86, { face: 1, shirt: C.sky, sarong: C.white, mo: true, mood: 'happy' });
          lady(a, 0.95, -0.02, 0.88, { face: -1, pose: 'stand', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'happy' });
        } },
        pop(0.82, W(1, 'invited'), [4.6, 2.95], (a) => { ground(a, 1.5, 2.25); arm(a, [1.95, -0.05, 2.2, 1.0, 1.85, 1.75]); invite(a, 1.8, 2.2, 1.0); }, 'invite'),
        pop(0.9, W(2, 'Andare'), [4.6, 2.3], (a) => { ground(a, -2.25, -0.95); arm(a, [-1.55, -0.05, -1.75, 0.2, -1.55, 0.6]); kid(a, -1.6, 0.18, 0.78, { face: 1, pose: 'jump', mood: 'happy' }); [-2.12, -1.05].forEach((x) => star(a, x, 0.12, 0.13)); }, 'jump'),
      ],
    },
    { // ------------------------------------------------------------ 1. mother gets ready; she knows him too well; "I want to go too!"
      turn: W(3, 'Knowing') - 0.85, words: ['I want', 'to go!'], at: W(5, 'I'),
      floor(a) { homeFloor(a, 1); },
      parts: [
        { id: 'wall', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { homeWall(a, false); } },
        { fold: 'box', on: 'wall', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.9, art(a) { pots(a); } },
        { fold: 'box', on: 'wall', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.8, art(a) { plant(a); } },
        { id: 'room', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.25, 2.25);
          a.box(C.wood, -2.15, -0.1, 0.1, 1.2); a.box(C.wood, -1.25, -0.1, 0.1, 1.2); a.box(C.wood, -2.25, 1.0, 1.2, 0.12, 0.04);   // the dressing table
          a.disc(C.wood, -1.7, 1.75, 0.45, 0.62); a.disc(C.sky, -1.7, 1.75, 0.36, 0.52); a.line(C.white, 0.06, (c) => { c.moveTo(-1.85, 1.45); c.lineTo(-1.6, 2.05); });
          lady(a, -0.5, -0.02, 0.98, { face: -1, pose: 'mirror', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'happy', flowers: true });
          kid(a, 1.7, -0.02, 0.8, { face: -1, pose: 'beg', mood: 'ask' });
        } },
        pop(0.82, W(3, 'mischievous'), [4.6, 2.95], (a) => { ground(a, -0.6, 0.6); arm(a, [0.2, -0.05, 0.6, 1.2, 0.3, 1.9]); a.disc(C.white, 0.05, 1.95, 0.08); a.disc(C.white, 0.18, 2.08, 0.1); cloud(a, 0.55, 2.4, 1.5); kid(a, 0.3, 2.0, 0.36, { face: 1, pose: 'wave', mood: 'sly' }); a.path(C.clay, (c) => { c.moveTo(0.7, 2.06); c.lineTo(0.8, 2.48); c.lineTo(0.96, 2.34); c.lineTo(1.06, 2.52); c.lineTo(1.16, 2.06); }); a.line(C.navy, 0.035, (c) => { c.moveTo(0.9, 2.08); c.lineTo(0.98, 2.3); c.lineTo(0.92, 2.42); }); }, 'thought'),
        pop(0.9, W(3, 'no'), [3.0, 2.95], (a) => { ground(a, 0.6, 1.4); arm(a, [1.1, -0.05, 1.4, 1.3, 1.25, 2.55]); cross(a, 1.25, 2.6, 0.32); }, 'no'),
        pop(0.98, W(4, 'ready'), [4.6, 1.7], (a) => { ground(a, -2.25, -1.2); a.box(C.coral, -2.15, -0.02, 0.7, 0.5, 0.1); a.line(C.coral, 0.06, (c) => c.arc(-1.8, 0.48, 0.2, Math.PI, 0)); a.box(C.brass, -1.85, 0.25, 0.1, 0.07); a.line(C.navy, 0.08, (c) => { c.moveTo(-1.35, 0.05); c.lineTo(-1.25, 1.35); }); a.path(C.navy, (c) => { c.moveTo(-1.36, 0.45); c.lineTo(-1.2, 1.25); c.lineTo(-1.12, 0.45); }); }, 'bag'),
      ],
    },
    { // ------------------------------------------------------------ 2. the condition: stay outside, quiet as a bull, not a word
      turn: W(6, 'Mother') - 0.85, words: ['Like a', 'bull'], at: W(7, 'like'),
      floor(a) { homeFloor(a, 2, '#e8cf96'); },
      parts: [
        { id: 'wall', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { homeWall(a, true); } },
        { fold: 'box', on: 'wall', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.9, art(a) { pots(a); } },
        { fold: 'box', on: 'wall', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.8, art(a) { plant(a); } },
        { id: 'talk', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.25, 2.25);
          lady(a, -0.75, -0.02, 1.02, { face: 1, pose: 'explain', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'happy', flowers: true });
          kid(a, 1.45, -0.02, 0.74, { face: -1, pose: 'stand', mood: 'look' });
        } },
        pop(0.82, W(6, 'one'), [4.6, 2.95], (a) => { ground(a, -2.25, -1.5); arm(a, [-1.85, -0.05, -2.2, 1.2, -1.85, 1.85]); a.box(C.navy, -2.25, 1.8, 0.8, 0.85, 0.12); a.box(C.cream, -2.19, 1.86, 0.68, 0.73, 0.09); a.text('1', -1.85, 1.98, 0.62, C.coral); }, 'card'),
        pop(0.9, W(7, 'bull'), [4.6, 2.95], (a) => { ground(a, 0.1, 0.7); arm(a, [0.4, -0.05, 0.75, 1.1, 0.45, 1.95]); bullCloud(a, 0.65, 2.4, 1.4); }, 'bull'),
      ],
    },
    { // ------------------------------------------------------------ 3. off to the wedding; she goes in, he stays outside
      turn: W(8, 'Andare') - 1.05, words: ['Wait', 'outside'], at: W(9, 'outside'),
      floor(a) { floorBase(a, '#ecd8a6'); a.line('#d9bf83', 0.9, (c) => { c.moveTo(-5.4, -1.8); c.bezierCurveTo(-3, -0.6, -2.5, 0.6, 0, 0.5); c.bezierCurveTo(2.5, 0.4, 3.4, -1.6, 5.4, -1.2); }); scatter(a, 13, 18, (x, y, r) => grass(a, x, x + 0.4, 0.15, C.sage, r.int(1, 99))); pageNo(a, 3); },
      parts: [
        { id: 'road', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { villageBack(a, { sunX: 2.2, sunY: 2.35, houses: [[-2.6, 1.0, 0.7]], palms: [[-4.2, 1.1, 0.2], [-0.9, 1.25, -0.2], [3.6, 1.15, -0.2]], seed: 21 }); } },
        { fold: 'box', on: 'road', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { grass(a, -4.55, -2.45, 0.25, C.deep, 33); palm(a, -3.5, 0.1, 1.5, 0.3, 0.9); } },
        { fold: 'box', on: 'road', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.0, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 35); man(a, 3.55, 0.1, 0.62, { face: -1, shirt: C.white, sarong: C.plum, mo: true }); } },
        { id: 'house', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) { grass(a, -2.25, 2.25, 0.25, C.deep, 37); house(a, -0.55, 2.7, 1.6, { wall: '#fdf0d8', roof: C.clay }); bunting(a, -1.9, 0.8, 1.55, 0.15, 7); } },
        pop(0.82, W(8, 'agreed'), [4.6, 2.3], (a) => { ground(a, 1.0, 2.25); kid(a, 1.62, -0.02, 0.8, { face: -1, pose: 'stand', mood: 'quiet' }); }, 'person'),
        pop(0.88, W(8, 'set'), [4.6, 2.95], (a) => { ground(a, 0.1, 1.2); lady(a, 0.65, -0.02, 0.92, { face: -1, pose: 'stand', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'happy', flowers: true }); }, 'person', W(9, 'stepped')),
        pop(0.94, W(8, 'wedding'), [4.6, 2.95], (a) => { ground(a, -2.2, -0.6); gate(a, -2.15, -0.65, 1.7); }, 'gate'),
      ],
    },
    { // ------------------------------------------------------------ 4. inside: the couple on the poruwa; "he's being good today"
      turn: W(10, 'Mother') - 1.0, words: ['Being', 'good'], at: W(10, 'good'),
      floor(a) { yardFloor(a, 4, 41, '#f6dcc0'); },
      parts: [
        { id: 'hall', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) {
          a.box('#fdf0d8', -4.7, -0.1, 9.4, 3.05, 0.08);
          for (let x = -4.4; x < 4.6; x += 1.15) { a.path(C.coral, (c) => { c.moveTo(x - 0.05, 3.0); c.quadraticCurveTo(x + 0.55, 2.2, x + 1.15, 3.0); }); a.path('#fdf0d8', (c) => { c.moveTo(x + 0.1, 3.0); c.quadraticCurveTo(x + 0.55, 2.45, x + 1.0, 3.0); }); }
          for (let k = 0; k < 9; k++) { const x = -4.0 + k * 1.0; a.line(C.leaf, 0.04, (c) => { c.moveTo(x, 2.6); c.lineTo(x, 2.0); }); jasmine(a, x, 1.95, 0.12); }
          bunting(a, -4.6, 4.6, 2.95, 0.35, 15);
          a.box(C.amber, -4.7, -0.1, 9.4, 0.5, 0.04);
        } },
        { fold: 'box', on: 'hall', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { oilLamp(a, -3.5, -0.08, 0.95); } },
        { fold: 'box', on: 'hall', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.05, art(a) { man(a, 3.05, -0.02, 0.62, { face: -1, shirt: C.white, sarong: C.plum, mo: true }); lady(a, 3.95, -0.02, 0.66, { face: -1, cloth: C.leaf, top: C.yellow, trim: C.coral }); } },
        { id: 'poruwa', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          poruwa(a, 0.75, 2.6);
          man(a, 0.25, 0.38, 0.72, { face: 1, shirt: C.white, sarong: C.white, sash: C.coral, turban: C.white, mood: 'happy' });
          lady(a, 1.25, 0.38, 0.72, { face: -1, cloth: C.white, top: C.white, trim: C.brass, bride: true, mood: 'happy', flowers: true });
          a.box(C.wood, -2.25, -0.12, 1.35, 0.14, 0.04);
          lady(a, -1.85, -0.02, 0.8, { face: 1, pose: 'hold', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'happy', flowers: true });
        } },
        pop(0.86, W(10, 'son'), [4.6, 2.95], (a) => { ground(a, -1.4, -0.8); arm(a, [-1.1, -0.05, -1.4, 1.3, -1.05, 2.0]); cloud(a, -0.95, 2.45, 1.15); kid(a, -1.15, 2.08, 0.3, { face: 1, pose: 'stand', mood: 'quiet' }); a.ridge(C.leaf, -1.45, -0.5, () => 2.12, 2.04); tick(a, -0.72, 2.5, 0.4); }, 'thought'),
      ],
    },
    { // ------------------------------------------------------------ 5. a huge commotion outside; mother runs out
      turn: W(12, 'Not') - 1.15, words: ['A huge', 'commotion!'], at: W(12, 'commotion'),
      floor(a) { yardFloor(a, 5, 51); },
      parts: [
        { id: 'yard', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { weddingBack(a, 52); } },
        { fold: 'box', on: 'yard', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { grass(a, -4.55, -2.45, 0.28, C.deep, 53); gate(a, -4.4, -2.65, 1.3); } },
        { fold: 'box', on: 'yard', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 55); palm(a, 3.6, 0.1, 1.5, -0.3, 0.9); } },
        { id: 'front', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) { grass(a, -2.25, 2.25, 0.25, C.deep, 57); a.box(C.wood, -2.1, -0.1, 0.12, 0.7); a.box(C.wood, 1.98, -0.1, 0.12, 0.7); bunting(a, -2.05, 2.05, 0.62, 0.05, 11); } },
        pop(0.82, W(12, 'huge'), [4.6, 2.95], (a) => {
          ground(a, -1.6, 1.0); dustCloud(a, -0.3, 1.3, 2.6, true);
          man(a, -1.35, 1.0, 0.42, { face: -1, tilt: 0.9, pose: 'fall', shirt: C.sky, mood: 'shock' }); lady(a, 0.95, 0.95, 0.4, { face: 1, tilt: 0.8, pose: 'run', cloth: C.leaf, top: C.yellow, mood: 'shock' });
          a.box(C.skin, -0.45, 0.25, 0.14, 0.5, 0.05); a.box(C.skin, 0.25, 0.2, 0.14, 0.55, 0.05); a.disc(C.navy, -0.38, 0.22, 0.12, 0.07); a.disc(C.navy, 0.32, 0.18, 0.12, 0.07);   // feet out of the dust
          a.line(C.skin, 0.1, (c) => { c.moveTo(-0.6, 1.9); c.lineTo(-0.85, 2.35); }); a.disc(C.skin, -0.87, 2.4, 0.08); a.line(C.skin, 0.1, (c) => { c.moveTo(0.3, 1.95); c.lineTo(0.5, 2.4); }); a.disc(C.skin, 0.52, 2.45, 0.08); a.box(C.sky, -0.05, 2.3, 0.3, 0.22, 0.05);   // an arm, a fist, a flying shirt
          burst(a, -1.05, 2.25, 0.26); burst(a, 0.75, 2.3, 0.22, C.yellow); star(a, -0.25, 2.5, 0.16); star(a, 0.95, 1.85, 0.12, C.coral);
        }, 'dust'),
        pop(0.9, W(13, 'running'), [4.6, 2.95], (a) => { ground(a, 1.15, 2.25); lady(a, 1.7, 0.0, 0.82, { face: 1, pose: 'run', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'shock', flowers: true }); speed(a, 1.42, 0.85, 0.5, 3, -1); }, 'run'),
      ],
    },
    { // ------------------------------------------------------------ 6. there was Andare, charging like a bull
      turn: W(14, 'Andare') - 1.25, words: ['Head', 'butting!'], at: W(15, 'headbutting'),
      floor(a) { yardFloor(a, 6, 61, '#ead3a0'); for (let k = 0; k < 10; k++) a.disc('#d7bd86', -3.6 + k * 0.8, -1.2 + Math.sin(k) * 0.4, 0.12, 0.07); },
      parts: [
        { id: 'yard', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { weddingBack(a, 62); } },
        { fold: 'box', on: 'yard', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { lady(a, -4.0, -0.02, 0.66, { face: 1, cloth: C.leaf, top: C.yellow, trim: C.coral, mood: 'shock' }); lady(a, -3.0, -0.02, 0.7, { face: 1, cloth: C.plum, top: C.sky, trim: C.yellow, mood: 'shock' }); } },
        { fold: 'box', on: 'yard', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { man(a, 3.05, -0.02, 0.62, { face: -1, shirt: C.white, sarong: C.plum, mo: true, mood: 'shock' }); man(a, 4.0, -0.02, 0.6, { face: -1, shirt: C.yellow, sarong: C.white, mood: 'shock' }); } },
        { id: 'ring', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) { grass(a, -2.25, 2.25, 0.25, C.deep, 67); dustCloud(a, -0.2, 0.25, 1.4); [[-1.9, 0.35], [1.8, 0.4]].forEach(([x, y]) => a.disc(C.dust, x, y, 0.25, 0.18)); } },
        { fold: 'float', on: 'ring', side: 1, at: [0.15, 0.55], gap: 0.34, sway: 0, wob: wobble, area: [-1.5, 0.2, 1.95, 2.3], art(a) { a.box(C.cream, -0.1, 0.3, 0.5, 0.35, 0.06); bullKid(a, -0.15, 0.42, 1.18, { face: 1, mood: 'angry', puff: true }); } },
        pop(0.86, W(15, 'men'), [4.6, 2.95], (a) => { ground(a, -2.25, -1.0); man(a, -2.0, 0.0, 0.56, { face: -1, tilt: 0.75, pose: 'fall', shirt: C.sky, sarong: C.white, mo: true, mood: 'shock' }); lady(a, -1.35, 0.0, 0.54, { face: -1, tilt: 0.6, pose: 'run', cloth: C.leaf, top: C.yellow, trim: C.coral, mood: 'shock' }); star(a, -1.75, 2.05, 0.15); star(a, -1.05, 1.85, 0.12, C.coral); }, 'tumble'),
        pop(0.94, W(15, 'young'), [4.6, 2.95], (a) => { ground(a, 1.2, 2.25); kid(a, 1.45, 0.0, 0.56, { face: 1, tilt: 0.7, pose: 'fall', shirt: C.sky, mood: 'shock' }); man(a, 2.0, 0.0, 0.54, { face: 1, tilt: 0.55, pose: 'fall', shirt: C.white, sarong: C.white, grey: true, mo: true, stick: true, mood: 'shock' }); star(a, 1.75, 2.1, 0.15); }, 'tumble'),
      ],
    },
    { // ------------------------------------------------------------ 7. she grabs him: "What on earth are you doing?"
      turn: W(17, 'She') - 1.1, words: ['What are', 'you doing?'], at: W(18, 'doing'),
      floor(a) { yardFloor(a, 7, 71); },
      parts: [
        { id: 'yard', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { weddingBack(a, 72); } },
        { fold: 'box', on: 'yard', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { man(a, -4.0, -0.02, 0.64, { face: 1, pose: 'cross', shirt: C.sky, mo: true, mood: 'grumpy' }); lady(a, -3.0, -0.02, 0.66, { face: 1, pose: 'look', cloth: C.leaf, top: C.yellow, trim: C.coral, mood: 'grumpy' }); } },
        { fold: 'box', on: 'yard', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { man(a, 3.1, -0.02, 0.6, { face: -1, pose: 'cross', shirt: C.white, sarong: C.white, grey: true, mo: true, stick: false, mood: 'grumpy' }); kid(a, 4.0, -0.02, 0.6, { face: -1, shirt: C.sky, mood: 'grumpy' }); } },
        { id: 'grab', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.25, 2.25);
          lady(a, 1.05, -0.02, 0.96, { face: -1, pose: 'grab', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'angry', flowers: true });
          bullKid(a, -1.0, 0.3, 0.92, { face: 1, mood: 'sheep', head: 0.1 }); a.disc(C.dust, -1.0, 0.12, 1.25, 0.28);
        } },
        pop(0.82, W(18, 'earth'), [4.6, 2.95], (a) => { ground(a, 1.6, 2.25); arm(a, [2.1, -0.05, 2.3, 1.3, 1.95, 2.15]); bubble(a, 1.85, 2.5, 0.85, 0.6, 1.45, 2.15, '?!'); }, 'speech'),
        pop(0.9, W(19, 'forgotten'), [4.6, 2.95], (a) => { ground(a, -2.25, -1.6); arm(a, [-2.0, -0.05, -2.3, 1.2, -1.75, 1.95]); cloud(a, -1.3, 2.42, 1.2); a.box(C.navy, -1.88, 2.15, 0.5, 0.56, 0.08); a.box(C.cream, -1.84, 2.19, 0.42, 0.48, 0.06); a.text('1', -1.63, 2.27, 0.4, C.coral); bull(a, -1.12, 2.1, 0.32); }, 'thought'),
        pop(0.98, W(20, 'remember'), [4.6, 2.6], (a) => { ground(a, -0.2, 0.35); arm(a, [0.1, -0.05, 0.4, 0.9, 0.05, 1.45]); bubble(a, -0.2, 1.75, 0.75, 0.58, -0.45, 1.3, null); tick(a, -0.19, 1.74, 0.55); }, 'speech'),
      ],
    },
    { // ------------------------------------------------------------ 8. "You told me to behave like a bull!"
      turn: W(22, 'Andare') - 1.0, words: ['Like a', 'bull!'], at: W(22, 'like'),
      floor(a) { yardFloor(a, 8, 81, '#ead3a0'); },
      parts: [
        { id: 'yard', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { weddingBack(a, 82); } },
        { fold: 'box', on: 'yard', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { man(a, -4.0, -0.02, 0.64, { face: 1, pose: 'stand', shirt: C.sky, mo: true, mood: 'look' }); lady(a, -3.0, -0.02, 0.66, { face: 1, cloth: C.plum, top: C.sky, trim: C.yellow, mood: 'look' }); } },
        { fold: 'box', on: 'yard', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 85); palm(a, 3.6, 0.1, 1.5, -0.3, 0.9); } },
        { id: 'talk', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.25, 2.25);
          lady(a, -0.95, -0.02, 1.0, { face: 1, pose: 'look', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'look', flowers: true });
        } },
        { fold: 'v', z: 0.8, alpha: 58, size: [4.6, 2.6], slide: (t) => -2.85 * K.seg(t, W(23, 'headbutting') - 0.3, W(23, 'headbutting') + 0.1, K.ease.inOut), art(a) { ground(a, 0.3, 1.3); kid(a, 0.85, -0.02, 0.86, { face: -1, pose: 'wave', mood: 'happy' }); } },
        pop(0.86, W(22, 'bull'), [4.6, 2.95], (a) => { ground(a, -0.4, 0.4); arm(a, [0.0, -0.05, 0.45, 1.3, 0.1, 1.9]); a.disc(C.white, 0.2, 1.95, 0.08); bullCloud(a, 0.55, 2.35, 1.45); }, 'bull'),
        pop(0.94, W(23, 'headbutting'), [4.6, 2.6], (a) => { ground(a, 0.2, 2.25); a.disc(C.dust, 0.9, 0.12, 0.9, 0.3); bullKid(a, 0.75, 0.3, 0.82, { face: 1, mood: 'angry', puff: true }); man(a, 2.05, 0.0, 0.5, { face: 1, tilt: 0.7, pose: 'fall', shirt: C.yellow, sarong: C.white, mood: 'shock' }); star(a, 2.0, 1.6, 0.14); burst(a, 1.75, 1.0, 0.16, C.yellow); }, 'charge'),
      ],
    },
    { // ------------------------------------------------------------ 9. everyone burst out laughing (pull tab)
      turn: W(24, 'At') - 1.2, words: ['Everyone', 'laughed'], at: W(24, 'everyone'),
      floor(a) { yardFloor(a, 9, 91, '#f6dcc0'); a.box(C.navy, 0.9, -2.66, 3.1, 0.075, 0.035); },
      parts: [
        { id: 'yard', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { weddingBack(a, 92); } },
        { fold: 'box', on: 'yard', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { man(a, -4.0, -0.02, 0.62, { face: 1, shirt: C.white, sarong: C.white, sash: C.coral, turban: C.white, mood: 'happy' }); lady(a, -3.05, -0.02, 0.62, { face: 1, cloth: C.white, top: C.white, trim: C.brass, bride: true, mood: 'happy', flowers: true }); } },
        { fold: 'box', on: 'yard', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { man(a, 3.1, -0.02, 0.62, { face: -1, shirt: C.yellow, sarong: C.white, mood: 'happy' }); lady(a, 4.0, -0.02, 0.64, { face: -1, cloth: C.plum, top: C.sky, trim: C.yellow, mood: 'happy' }); } },
        { id: 'end', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) { grass(a, -2.25, 2.25, 0.25, C.deep, 97); oilLamp(a, -1.95, -0.05, 0.6); oilLamp(a, 1.95, -0.05, 0.6); } },
        { fold: 'v', z: 0.86, alpha: 58, size: [4.6, 2.6], slide: (t) => -2.85 * pulled(t), art(a) { ground(a, -2.0, 2.0); lady(a, -1.25, -0.02, 0.9, { face: 1, pose: 'stand', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'shock', flowers: true }); a.disc(C.dust, 0.3, 0.12, 0.9, 0.3); bullKid(a, 0.35, 0.3, 0.74, { face: -1, mood: 'sheep', head: 0.05 }); man(a, 1.45, -0.02, 0.72, { face: -1, shirt: C.sky, mo: true, mood: 'shock' }); } },
        { fold: 'v', z: 0.94, alpha: 58, size: [4.6, 2.6], slide: (t) => -2.85 * (1 - pulled(t)), art(a) { ground(a, -2.0, 2.0); lady(a, -1.25, -0.02, 0.9, { face: 1, pose: 'laugh', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'laugh', flowers: true }); a.disc(C.dust, 0.3, 0.12, 0.9, 0.3); bullKid(a, 0.35, 0.3, 0.74, { face: -1, mood: 'laugh', head: 0.15 }); man(a, 1.45, -0.02, 0.72, { face: -1, pose: 'laugh', shirt: C.sky, mo: true, mood: 'laugh' }); burst(a, -0.6, 2.25, 0.22, C.yellow); burst(a, 0.9, 2.35, 0.2, C.yellow); star(a, 2.0, 2.1, 0.14); } },
      ],
    },
  ];
  const TURNS = SPREADS.map((s) => s.turn);
  // the storyboard: which frame stands for each beat
  const BOARD = /*BOARD*/;
  const ASSUMPTIONS = /*ASSUMPTIONS*/;

