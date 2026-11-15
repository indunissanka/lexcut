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
  const BEATS = [
    {"t": [0.08, 3.84], "say": "One day, Andare's family was invited to a nearby village wedding.", "show": "Cover: the family at home; an invitation card pops up on \"invited\"", "words": [["one", 0.08], ["day", 0.56], ["andare's", 1.24], ["family", 1.58], ["was", 1.82], ["invited", 2.08], ["to", 2.44], ["a", 2.68], ["nearby", 2.86], ["village", 3.06], ["wedding", 3.54]]},
    {"t": [4.48, 6.5], "say": "Little Andare wanted to go too, of course.", "show": "Andare jumps up on \"Andare\"", "words": [["little", 4.48], ["andare", 4.84], ["wanted", 5.26], ["to", 5.56], ["go", 5.74], ["too", 5.82], ["of", 6.22], ["course", 6.32]]},
    {"t": [7.18, 11.14], "say": "Knowing how mischievous he could be, his mother had no intention of taking him.", "show": "Page turns: mother at the mirror; a memory of his mischief on \"mischievous\", stamped with an X on \"no\"", "words": [["knowing", 7.18], ["how", 7.5], ["mischievous", 7.76], ["he", 8.3], ["could", 8.56], ["be", 8.72], ["his", 9.4], ["mother", 9.54], ["had", 9.74], ["no", 9.96], ["intention", 10.14], ["of", 10.46], ["taking", 10.66], ["him", 10.86]]},
    {"t": [11.8, 14.22], "say": "As she was getting ready to leave, Andare spoke up.", "show": "Her bag and umbrella come up on \"ready\"", "words": [["as", 11.8], ["she", 11.98], ["was", 12.12], ["getting", 12.24], ["ready", 12.4], ["to", 12.64], ["leave", 12.82], ["andare", 13.46], ["spoke", 13.62], ["up", 13.88]]},
    {"t": [14.92, 17.76], "say": "Andare: \"I want to go to the wedding too!\"", "show": "Ribbon \"I want to go!\" rises on \"I want\"", "words": [["andare", 14.92], ["i", 16.0], ["want", 16.42], ["to", 16.58], ["go", 16.76], ["to", 16.88], ["the", 17.0], ["wedding", 17.1], ["too", 17.3]]},
    {"t": [18.44, 22.76], "say": "Mother: \"Fine, I'll take you, but on one condition.", "show": "Page turns: mother, finger up; a card \"1\" on \"one\"", "words": [["mother", 18.44], ["fine", 19.72], ["i'll", 20.54], ["take", 20.74], ["you", 20.94], ["but", 21.3], ["on", 21.46], ["one", 21.98], ["condition", 22.3]]},
    {"t": [23.42, 27.58], "say": "When we get there, you must stay outside and behave like a bull, without a word.\"", "show": "Ribbon \"Like a bull\" on \"like\"; a quiet bull in a thought cloud on \"bull\"", "words": [["when", 23.42], ["we", 23.6], ["get", 23.74], ["there", 23.88], ["you", 24.48], ["must", 24.6], ["stay", 24.72], ["outside", 25.0], ["and", 25.38], ["behave", 25.68], ["like", 25.98], ["a", 26.24], ["bull", 26.4], ["without", 26.64], ["a", 27.24], ["word", 27.38]]},
    {"t": [28.58, 30.8], "say": "Andare agreed, and they set off for the wedding.", "show": "Page turns to the road: Andare nods on \"agreed\", mother on \"set off\", the leaf arch on \"wedding\"", "words": [["andare", 28.58], ["agreed", 29.06], ["and", 29.7], ["they", 29.86], ["set", 30.08], ["off", 30.26], ["for", 30.4], ["the", 30.56], ["wedding", 30.64]]},
    {"t": [31.58, 34.64], "say": "Upon arriving, his mother left him outside and stepped into the house.", "show": "Ribbon \"Wait outside\" on \"outside\"; mother sinks away on \"stepped\"", "words": [["upon", 31.58], ["arriving", 31.84], ["his", 32.6], ["mother", 32.7], ["left", 32.9], ["him", 33.16], ["outside", 33.3], ["and", 33.64], ["stepped", 33.88], ["into", 34.1], ["the", 34.32], ["house", 34.46]]},
    {"t": [35.34, 39.46], "say": "Mother: \"Thank goodness. My son is actually being good today,", "show": "Page turns inside: the couple on the poruwa; a cloud of good Andare on \"son\"; ribbon \"Being good\" on \"good\"", "words": [["mother", 35.34], ["thank", 36.64], ["goodness", 36.8], ["my", 37.62], ["son", 37.74], ["is", 37.98], ["actually", 38.14], ["being", 38.66], ["good", 38.92], ["today", 39.16]]},
    {"t": [39.98, 41.44], "say": "he's doing just what I told him.\"", "show": "Hold", "words": [["he's", 39.98], ["doing", 40.2], ["just", 40.36], ["what", 40.76], ["i", 40.96], ["told", 41.06], ["him", 41.22]]},
    {"t": [42.48, 47.18], "say": "Not long after, a huge commotion broke out in front of the wedding house!", "show": "Page turns to the yard: a dust cloud of tumbling guests on \"huge\"; ribbon on \"commotion\"", "words": [["not", 42.48], ["long", 42.96], ["after", 43.12], ["a", 44.06], ["huge", 44.24], ["commotion", 44.96], ["broke", 45.66], ["out", 45.94], ["in", 46.16], ["front", 46.32], ["of", 46.46], ["the", 46.56], ["wedding", 46.68], ["house", 46.84]]},
    {"t": [47.82, 51.02], "say": "Alarmed, Andare's mother came running out to see what was going on.", "show": "Mother runs out on \"running\"", "words": [["alarmed", 47.82], ["andare's", 48.5], ["mother", 48.96], ["came", 49.12], ["running", 49.38], ["out", 49.66], ["to", 49.96], ["see", 50.1], ["what", 50.24], ["was", 50.38], ["going", 50.5], ["on", 50.68]]},
    {"t": [51.6, 56.28], "say": "And what did she find? There was Andare, on his hands and knees,", "show": "Page turns: there was Andare, on his hands and knees", "words": [["and", 51.6], ["what", 51.88], ["did", 52.1], ["she", 52.28], ["find", 52.44], ["there", 53.48], ["was", 53.86], ["andare", 54.16], ["on", 54.7], ["his", 55.34], ["hands", 55.5], ["and", 55.86], ["knees", 56.02]]},
    {"t": [56.28, 61.7], "say": "charging around and headbutting everyone, men and women, young and old alike!", "show": "He lunges on \"charging\" and \"headbutting\"; ribbon \"Headbutting!\"; guests tumble on \"men\" and \"young\"", "words": [["charging", 56.28], ["around", 56.92], ["and", 57.42], ["headbutting", 57.74], ["everyone", 58.52], ["men", 59.42], ["and", 59.82], ["women", 60.06], ["young", 60.64], ["and", 60.76], ["old", 60.98], ["alike", 61.36]]},
    {"t": [62.44, 66.8], "say": "He was tilting his head side to side, rolling his eyes, and ramming into people.", "show": "His head rocks side to side; a last lunge on \"ramming\"", "words": [["he", 62.44], ["was", 62.62], ["tilting", 62.78], ["his", 63.2], ["head", 63.4], ["side", 63.6], ["to", 63.88], ["side", 64.02], ["rolling", 64.6], ["his", 64.88], ["eyes", 65.14], ["and", 65.42], ["ramming", 65.66], ["into", 66.24], ["people", 66.48]]},
    {"t": [67.48, 69.5], "say": "She rushed over and grabbed hold of him at once.", "show": "Page turns: mother grabs him", "words": [["she", 67.48], ["rushed", 67.78], ["over", 68.0], ["and", 68.3], ["grabbed", 68.48], ["hold", 68.64], ["of", 68.88], ["him", 69.02], ["at", 69.14], ["once", 69.26]]},
    {"t": [70.18, 74.18], "say": "Mother: \"What on earth are you doing, son?", "show": "\"?!\" bubble on \"earth\"; ribbon \"What are you doing?\" on \"doing\"", "words": [["mother", 70.18], ["what", 71.42], ["on", 71.86], ["earth", 72.2], ["are", 72.6], ["you", 72.9], ["doing", 73.1], ["son", 73.98]]},
    {"t": [75.0, 77.58], "say": "Have you forgotten what I told you before we came here?\"", "show": "A cloud of the condition (card 1 and the bull) on \"forgotten\"", "words": [["have", 75.0], ["you", 75.14], ["forgotten", 75.24], ["what", 75.56], ["i", 75.82], ["told", 75.96], ["you", 76.24], ["before", 76.52], ["we", 76.78], ["came", 77.0], ["here", 77.24]]},
    {"t": [78.36, 80.5], "say": "Andare: \"I remember, Mother.\"", "show": "A tick bubble from Andare on \"remember\"", "words": [["andare", 78.36], ["i", 79.64], ["remember", 79.88], ["mother", 80.34]]},
    {"t": [81.12, 84.52], "say": "Mother: \"Then why are you bothering all these people?\"", "show": "The guests look on, grumpy", "words": [["mother", 81.12], ["then", 82.34], ["why", 82.58], ["are", 82.82], ["you", 83.02], ["bothering", 83.16], ["all", 83.54], ["these", 83.88], ["people", 84.04]]},
    {"t": [85.18, 89.36], "say": "Andare: \"Well, you're the one who told me to behave like a bull!", "show": "Page turns: Andare explains; ribbon \"Like a bull!\" on \"like\"; the bull cloud again on \"bull\"", "words": [["andare", 85.18], ["well", 86.24], ["you're", 86.7], ["the", 87.0], ["one", 87.14], ["who", 87.34], ["told", 87.5], ["me", 87.78], ["to", 87.96], ["behave", 88.14], ["like", 88.56], ["a", 88.84], ["bull", 89.04]]},
    {"t": [90.0, 94.64], "say": "So I remembered what you said and started headbutting people just like one!\"", "show": "Andare drops to his hands and knees and charges a guest on \"headbutting\"", "words": [["so", 90.0], ["i", 90.5], ["remembered", 90.74], ["what", 91.18], ["you", 91.46], ["said", 91.6], ["and", 91.92], ["started", 92.24], ["headbutting", 92.66], ["people", 93.22], ["just", 93.82], ["like", 94.14], ["one", 94.4]]},
    {"t": [95.82, 98.36], "say": "At that, everyone burst out laughing.", "show": "Page turns: everyone shocked; the pull tab turns every face to laughter on \"burst out laughing\"", "words": [["at", 95.82], ["that", 96.42], ["everyone", 97.02], ["burst", 97.46], ["out", 97.76], ["laughing", 98.02]]}
  ];
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
  const BOARD = [
 {
  "t": 5.7,
  "beats": [
   1,
   2
  ],
  "text": "Ribbon: \"A Stag at | the Wedding\"; invitation card \"Wedding\"",
  "note": "The book is open on the desk. Andare's house, father and mother stand on the cover spread with the title ribbon. On \"invited\" a wedding invitation rises on a paper arm; on \"Andare\" he jumps up through the page.",
  "cam": "Opens close on the left of the spread and drifts right.",
  "sound": "Page lands (slap, thud, card creaks), soft ding; a paper pop for the card; a hop and a pop for Andare."
 },
 {
  "t": 17.5,
  "beats": [
   3,
   4,
   5
  ],
  "text": "Ribbon: \"I want | to go!\"",
  "note": "Page turns indoors. Mother at her mirror with jasmine in her hair; Andare begging. On \"mischievous\" a thought cloud of him with a broken pot; on \"no\" a red X stamps over it; on \"ready\" her bag and umbrella; ribbon on \"go\".",
  "cam": "Breathes out for the turn, then drifts right to left.",
  "sound": "Page turn; soft pop for the cloud; a stamp for the X; pop for the bag; paper tick for the ribbon."
 },
 {
  "t": 27.2,
  "beats": [
   6,
   7
  ],
  "text": "Ribbon: \"Like a | bull\"; card \"1\"",
  "note": "Same room, the door now open. Mother raises a finger; a card \"1\" on \"one condition\". Ribbon \"Like a bull\" on \"like\", and a thought cloud with a calm bull, mouth shut, on \"bull\".",
  "cam": "Drifts left to right.",
  "sound": "Page turn; a wooden tock for the card; a soft low moo for the bull."
 },
 {
  "t": 33.7,
  "beats": [
   8,
   9
  ],
  "text": "Ribbon: \"Wait | outside\"",
  "note": "Page turns to the road and the wedding house. Andare nods on \"agreed\", mother appears on \"set off\", the coconut-leaf arch rises on \"wedding\". On \"outside\" the ribbon rises; on \"stepped into\" mother sinks into the page: she has gone in.",
  "cam": "Drifts right to left toward the arch.",
  "sound": "Page turn; pops for each arrival; a sparkle for the arch; a soft paper slide as mother goes in."
 },
 {
  "t": 40.6,
  "beats": [
   10,
   11
  ],
  "text": "Ribbon: \"Being | good\"",
  "note": "Page turns inside: the bride and groom on the poruwa, a brass oil lamp, guests. Mother stands at the front; on \"son\" a thought cloud of Andare standing quietly outside, with a tick; ribbon \"Being good\" on \"good\".",
  "cam": "Drifts left to right across the hall.",
  "sound": "Page turn; soft wedding drum taps under the narration; pop for the cloud."
 },
 {
  "t": 50.6,
  "beats": [
   12,
   13
  ],
  "text": "Ribbon: \"A huge | commotion!\"",
  "note": "Page turns back to the yard. On \"huge\" a cartoon dust cloud with guests flying out of it; ribbon on \"commotion\"; mother runs out of the house on \"running\".",
  "cam": "Drifts right to left.",
  "sound": "Page turn; an impact and crowd hubbub; a whoosh as mother runs."
 },
 {
  "t": 61.5,
  "beats": [
   14,
   15,
   16
  ],
  "text": "Ribbon: \"Head | butting!\"",
  "note": "Page turns: there is Andare on his hands and knees, snorting, in the middle of the yard. He lunges on \"charging\" and \"headbutting\" (ribbon rises); a man and a woman tumble on \"men\"; a boy and an old man on \"young\". Through line 16 his head rocks side to side, and he rams once more on \"ramming\".",
  "cam": "Drifts left to right, around the charge.",
  "sound": "Page turn; thuds on each lunge; tumbling thumps; hubbub underneath."
 },
 {
  "t": 80.6,
  "beats": [
   17,
   18,
   19,
   20,
   21
  ],
  "text": "Ribbon: \"What are | you doing?\"; bubble \"?!\"",
  "note": "Page turns: mother has him by the arm; he looks sheepish; the guests stand grumpy at the sides. \"?!\" bubble on \"earth\"; ribbon on \"doing\"; on \"forgotten\" a cloud of the condition (card 1 and the bull); a tick bubble from Andare on \"remember\".",
  "cam": "Drifts right to left.",
  "sound": "Page turn; a blip for each bubble; a pop for the cloud."
 },
 {
  "t": 93.6,
  "beats": [
   22,
   23
  ],
  "text": "Ribbon: \"Like a | bull!\"",
  "note": "Page turns: Andare, cheerful, explains with a hand up; mother puzzled. Ribbon \"Like a bull!\" on \"like\", the same bull cloud on \"bull\". On \"headbutting\" he drops onto his hands and knees and charges a guest again.",
  "cam": "Drifts left to right.",
  "sound": "Page turn; the low moo again; a thud and a star for the charge."
 },
 {
  "t": 99.2,
  "beats": [
   24
  ],
  "text": "Ribbon: \"Everyone | laughed\"",
  "note": "Page turns: mother, Andare and a guest stand shocked. The ribbon rises on \"everyone\", and on \"burst out laughing\" the pull tab slides out: every shocked face sinks and a laughing one rises in its place. The last second holds on the laughing yard.",
  "cam": "Ends in a gentle push in.",
  "sound": "Page turn; tape-pull for the tab; a sparkle and a two-note success as everyone laughs."
 }
];
  const ASSUMPTIONS = [
 "Timing comes from the audio file, not the pasted line times: the recording runs about 3 s behind them by the end (the last word ends at 98.4 s, so the piece is 99.4 s long). Word times are from Whisper, word by word.",
 "The recording does not say the bracketed \"(be as quiet as a mouse)\", so nothing on screen shows it. \"Behave like a bull\" is read as the saying for standing still and silent, like a tethered bull; Andare takes it literally.",
 "The title says \"stag\", the story says \"bull\": the title ribbon keeps your title, and every picture inside shows a bull (a humped village bull with curved horns).",
 "Andare has no horns: the story only says he went on his hands and knees, tilting his head and ramming, so he charges head-down, snorting.",
 "Setting: a Sri Lankan village wedding, shown with a coconut-leaf arch (gokkola), the poruwa platform with the bride in white and gold, a brass oil lamp and paper flags.",
 "Andare's family on the first spread is his father, mother and Andare. Andare and his mother look the same as in the hopper story.",
 "Each ribbon (and each pop-up piece) rises through a slit in the page on the word it shows, as in the hopper story, so pictures land on their words in a 99-second story."
];

  // ---------------------------------------------------------------- the book's clock (picture and sound both read it)
  const flip = (t, t0) => { const u = (t - t0) / TURN; if (u <= 0) return 0; if (u < 1) return Math.PI * u * u * (2.2 - 1.2 * u); const v = t - t0 - TURN; return Math.PI - 0.034 * Math.abs(Math.sin(v * 11)) * Math.exp(-v * 6); };
  const landed = (s) => TURNS[s] + TURN;

  registerStyle({
    id: 'paper-pop-up-stag',
    name: 'Paper Pop-Up',
    family: 'Material worlds',
    look: 'A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.',
    motion: 'The pages turn; the old spread is pressed flat and the next one is pulled up out of the gutter by its folds. Pieces on paper arms tremble when the page lands. Small pieces come up through slits on the word they show, Andare rocks and lunges on his paper tab, and a pull tab turns every shocked face to laughter on the last spread.',
    light: 'One warm desk lamp from the upper left with soft-edged shadows; a faint cool rim from behind; the table falls off into the dark.',
    materials: 'Thick uncoated card with visible fibre and a slight cockle, flat matt ink with a little grain, bare cream card on cut edges, cloth-covered boards, dark oiled wood.',
    camera: 'A long lens looking down the gutter from about twenty-five degrees up, the spread filling the frame. A slow drift across each spread that breathes out for each page turn and ends in a gentle push; shallow focus on the middle layers.',
    post: 'Real depth of field, motion blur and area-light shadows; neutral tone mapping, a soft vignette, very fine grain.',
    explains: 'A folk tale in ten spreads.',
    topic: 'A Stag at the Wedding',
    duration: DUR,
    fonts: ['700 100px "Fraunces"'],
    render: { samples: 56, shutter: 0.5, tone: 'neutral', exposure: 0.9, saturation: 1.1, bloom: 0.12, bloomThreshold: 1.1, vignette: 0.42, grain: 0.014, fov: 26, background: '#050403' },
    BEATS, BOARD, ASSUMPTIONS, SPREADS,

    build(S) {
      const { THREE, K, scene, camera } = S;
      S.renderer.localClippingEnabled = true;                    // sliders are cut off where they pass through the page
      const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const unit = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2])), rad = (d) => d * Math.PI / 180;

      // ------------------------------------------------------------ 1. paper
      const CARD_T = 0.03, LEAF_T = 0.045, STEP = 0.022, PX = 150;   // STEP: how much one page raises the stack (pages are thin)
      const fibre = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const n = K.noise(3), r = K.rng(8), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 128 + 70 * n.fbm(x * 0.006, y * 0.006, 0, 2) + 34 * n.fbm(x * 0.05, y * 0.05, 3, 3) + 14 * (K.hash(x, y) - 0.5); im.data.set([v, v, v, 255], (y * w + x) * 4); }
        ctx.putImageData(im, 0, 0); ctx.lineCap = 'round';
        for (let i = 0; i < 5200; i++) { const x = r.range(0, w), y = r.range(0, h), q = r.range(0, 6.3), len = r.range(8, 34); ctx.strokeStyle = `rgba(255,255,255,${r.range(0.05, 0.3)})`; ctx.lineWidth = r.range(0.8, 1.8); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(q + 0.6) * len * 0.5, y + Math.sin(q + 0.6) * len * 0.5, x + Math.cos(q) * len, y + Math.sin(q) * len); ctx.stroke(); }
      }, { data: true });
      fibre.wrapS = fibre.wrapT = THREE.RepeatWrapping;
      const bumpFor = (w, h) => { const b = fibre.clone(); b.repeat.set(w / 3.2, h / 3.2); b.needsUpdate = true; return b; };
      const speck = document.createElement('canvas'); speck.width = speck.height = 256;
      { const x = speck.getContext('2d'), im = x.createImageData(256, 256), r = K.rng(2); for (let i = 0; i < 65536; i++) { const v = 255 - 30 * Math.pow(r(), 3) - (r.chance(0.012) ? 60 : 0); im.data.set([v, v, v * 0.985, 255], i * 4); } x.putImageData(im, 0, 0); }
      const grain = (ctx, w, h) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ctx.createPattern(speck, 'repeat'); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; };
      const paper = (map, w, h) => new THREE.MeshStandardMaterial({ map, bumpMap: bumpFor(w, h), bumpScale: 0.45, roughness: 0.93, metalness: 0 });
      const core = new THREE.MeshStandardMaterial({ color: '#fbf5e6', roughness: 0.95 });

      const pen = (ctx, back) => {
        const a = {
          ctx, back,
          path(col, fn) { ctx.fillStyle = col; ctx.beginPath(); fn(ctx); ctx.fill(); return a; },
          disc(col, x, y, rx, ry = rx, rot = 0) { return a.path(col, (c) => c.ellipse(x, y, rx, ry, rot, 0, 7)); },
          box(col, x, y, w, h, r = 0) { return a.path(col, (c) => c.roundRect(x, y, w, h, r)); },
          line(col, w, fn, dash) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.setLineDash(dash || []); ctx.beginPath(); fn(ctx); ctx.stroke(); ctx.setLineDash([]); return a; },
          ridge(col, x0, x1, top, y0 = -0.1) { return a.path(col, (c) => { c.moveTo(x0, y0); for (let x = x0; x <= x1 + 1e-6; x += 0.1) c.lineTo(x, top(x)); c.lineTo(x1, y0); }); },
          clip(fn, inside) { ctx.save(); ctx.beginPath(); fn(ctx); ctx.clip(); inside(); ctx.restore(); return a; },
          text(str, x, y, size, col, align = 'center') { if (a.back) return a; ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, -size / 100); ctx.font = '700 100px "Fraunces"'; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); return a; },
        };
        return a;
      };
      const ruler = document.createElement('canvas').getContext('2d'); ruler.font = '700 100px "Fraunces"';
      const widthOf = (str, size) => ruler.measureText(str).width * size / 100;

      // ------------------------------------------------------------ 2. the die-cutter
      function trace(f, w, h, level, i0, i1) {
        const at = (i, j) => (i < i0 || i > i1 || j < 0 || j >= h ? 0 : f[j * w + i]), EW = w + 3;
        const id = (i, j, upright) => ((j + 1) * EW + i + 1) * 2 + upright, next = new Map(), where = new Map();
        const SEG = [[], [3, 2], [2, 1], [3, 1], [1, 0], [3, 2, 1, 0], [2, 0], [3, 0], [0, 3], [0, 2], [0, 3, 2, 1], [0, 1], [1, 3], [1, 2], [2, 3], []];
        for (let j = -1; j < h; j++) for (let i = Math.max(-1, i0 - 1); i <= Math.min(w - 1, i1); i++) {
          const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1), seg = SEG[(a >= level ? 8 : 0) | (b >= level ? 4 : 0) | (c >= level ? 2 : 0) | (d >= level ? 1 : 0)];
          if (!seg.length) continue;
          const ids = [id(i, j, 0), id(i + 1, j, 1), id(i, j + 1, 0), id(i, j, 1)];
          const pts = [[i + (level - a) / (b - a), j], [i + 1, j + (level - b) / (c - b)], [i + (level - d) / (c - d), j + 1], [i, j + (level - a) / (d - a)]];
          for (let k = 0; k < seg.length; k += 2) { next.set(ids[seg[k]], ids[seg[k + 1]]); where.set(ids[seg[k]], pts[seg[k]]); where.set(ids[seg[k + 1]], pts[seg[k + 1]]); }
        }
        const loops = [];
        while (next.size) { const start = next.keys().next().value, loop = []; let k = start; do { loop.push(where.get(k)); const n = next.get(k); next.delete(k); k = n; } while (k !== start && k !== undefined); loops.push(loop); }
        return loops;
      }
      function simplify(pts, tol) {
        const n = pts.length; if (n < 8) return pts;
        let far = 0, fd = 0; for (let i = 1; i < n; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
        const keep = new Uint8Array(n + 1), P = (i) => pts[i % n], stack = [[0, far], [far, n]]; keep[0] = keep[far] = 1;
        while (stack.length) {
          const [i0, i1] = stack.pop(), a = P(i0), b = P(i1), dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-9; let m = -1, md = tol;
          for (let i = i0 + 1; i < i1; i++) { const p = P(i), d = Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / len; if (d > md) { md = d; m = i; } }
          if (m > 0) { keep[m] = 1; stack.push([i0, m], [m, i1]); }
        }
        return pts.filter((_, i) => keep[i]);
      }
      const areaOf = (l) => { let s = 0; for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; };
      const inside = (p, l) => { let c = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) if ((l[i][1] > p[1]) !== (l[j][1] > p[1]) && p[0] < (l[j][0] - l[i][0]) * (p[1] - l[i][1]) / (l[j][1] - l[i][1]) + l[i][0]) c = !c; return c; };

      const MARGIN = 0.045;
      function dieCut(x0, y0, w, h, draw) {
        const cw = Math.ceil(w * PX / 4) * 4, ch = Math.ceil(h * PX / 2) * 2, mw = cw / 2, mh = ch / 2; w = cw / PX; h = ch / PX;
        const art = document.createElement('canvas'); art.width = cw; art.height = ch;
        const ctx = art.getContext('2d'); ctx.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(ctx));
        const soft = document.createElement('canvas'); soft.width = mw; soft.height = mh;
        const sx = soft.getContext('2d', { willReadFrequently: true }); sx.filter = `blur(${(MARGIN * PX / 2 / 0.84).toFixed(2)}px)`; sx.drawImage(art, 0, 0, mw, mh);
        const px = sx.getImageData(0, 0, mw, mh).data, f = new Float32Array(mw * mh); for (let i = 0; i < f.length; i++) f[i] = px[i * 4 + 3] / 255;
        const print = (back) => K.canvasTex(cw, ch, (c) => { c.fillStyle = C.card; c.fillRect(0, 0, cw, ch); if (back) { c.setTransform(PX, 0, 0, -PX, -x0 * PX, (y0 + h) * PX); draw(pen(c, true)); } else c.drawImage(art, 0, 0); grain(c, cw, ch); });
        const tex = print(false), rear = print(true);
        const mid = Math.round(-x0 * PX / 2);
        const outline = (side) => {
          const loops = trace(f, mw, mh, 0.2, side > 0 ? mid : 0, side < 0 ? mid - 1 : mw - 1)
            .map((l) => simplify(l.map(([i, j]) => { const x = x0 + (2 * i + 1) / PX; return [side && Math.abs(x) < 2.4 / PX ? 0 : x, y0 + h - (2 * j + 1) / PX]; }), 0.004))
            .filter((l) => l.length > 2 && Math.abs(areaOf(l)) > 0.004);
          if (!loops.length) return [];
          const sign = Math.sign(areaOf(loops.reduce((a, b) => (Math.abs(areaOf(b)) > Math.abs(areaOf(a)) ? b : a), loops[0])));
          const solid = loops.filter((l) => Math.sign(areaOf(l)) === sign).map((l) => ({ l, shape: new THREE.Shape(l.map((p) => new THREE.Vector2(p[0], p[1]))) }));
          loops.filter((l) => Math.sign(areaOf(l)) !== sign).forEach((hole) => { const o = solid.find((s) => inside(hole[0], s.l)); if (o) o.shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p[0], p[1])))); });
          return solid.map((s) => s.shape);
        };
        return { tex, rear, outline, x0, y0, w, h };
      }
      let cards = 1;
      function card(cut, side, parent) {
        const g = new THREE.ExtrudeGeometry(cut.outline(side), { depth: CARD_T, bevelEnabled: false }); g.translate(0, 0, -CARD_T / 2);
        const p = g.attributes.position, uv = g.attributes.uv, nm = g.attributes.normal, r = K.rng(cards++), bx = r.range(-0.05, 0.05), by = r.range(0.03, 0.08) * r.sign();
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = nm.getZ(i); uv.setXY(i, (x - cut.x0) / cut.w, (y - cut.y0) / cut.h);
          if (Math.abs(z) > 0.9) { const k = 1 / Math.hypot(1, bx * x, by * (y - 1)); nm.setXYZ(i, -bx * x * k * z, -by * (y - 1) * k * z, z * k); }
        }
        const all = g.groups.slice(); g.clearGroups();
        all.forEach((q) => { if (q.materialIndex) g.addGroup(q.start, q.count, 1); else { g.addGroup(q.start, q.count / 2, 2); g.addGroup(q.start + q.count / 2, q.count / 2, 0); } });
        const m = new THREE.Mesh(g, [paper(cut.tex, cut.w, cut.h), core, paper(cut.rear, cut.w, cut.h)]); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; m.frustumCulled = false; parent.add(m);
        return m;
      }
      const seat = (m, X, Y, O) => { const Z = cross(X, Y); m.matrix.set(X[0], Y[0], Z[0], O[0], X[1], Y[1], Z[1], O[1], X[2], Y[2], Z[2], O[2], 0, 0, 0, 1); m.matrixWorldNeedsUpdate = true; };

      // ------------------------------------------------------------ 3. the fold mechanisms
      function hinge(aL, aR) {
        const psi = (Math.PI - aL + aR) / 2, a = Math.min((aL + aR) / 2, Math.PI / 2 - 0.004), s = Math.sin(a), c = Math.cos(a);
        const b = [Math.cos(psi), Math.sin(psi), 0], x = [Math.sin(psi), -Math.cos(psi), 0];
        return { a, b, dL: add(mul(x, -c), b, s), dR: add(mul(x, c), b, s), nL: add(mul(x, s), b, c), nR: add(mul(x, -s), b, c) };
      }
      function solveV(h, alpha, beta, point) {
        const sa = Math.sin(alpha), ca = Math.cos(alpha), A = sa * Math.sin(h.a), g = Math.atan2(A, ca) + Math.acos(K.clamp(Math.cos(beta) / Math.hypot(A, ca), -1, 1));
        const c = [h.b[0] * Math.sin(g), h.b[1] * Math.sin(g), point * Math.cos(g)], out = (d) => { const gl = [d[0] * sa, d[1] * sa, point * ca]; return unit(add(gl, c, -dot(gl, c))); };
        return { c, uL: out(h.dL), uR: out(h.dR) };
      }
      const MAKE = {
        v(o, byId, group) {
          const cut = dieCut(-o.size[0] / 2, -0.1, o.size[0], o.size[1] + 0.25, o.art), L = card(cut, -1, group), R = card(cut, 1, group);
          const slit = o.slide ? [new THREE.Plane(), new THREE.Plane()] : null;
          if (slit) [L, R].forEach((m, i) => m.material.forEach((mt, k) => { m.material[k] = mt = mt.clone(); mt.clippingPlanes = [slit[i]]; mt.clipShadows = true; }));
          const part = { o, meshes: [L, R], pose(h, t) {
            const v = solveV(h, rad(o.alpha), rad(o.beta || 90), o.point === 'back' ? 1 : -1), up = o.slide ? o.slide(t) : 0, O = [v.c[0] * up, v.c[1] * up, o.z + v.c[2] * up];
            part.wing = { '-1': { X: mul(v.uL, -1), Y: v.c, O, n: h.nL }, 1: { X: v.uR, Y: v.c, O, n: h.nR } };
            seat(L, part.wing[-1].X, v.c, O); seat(R, v.uR, v.c, O);
            const hidden = o.slide && up < -(o.size[1] + 0.2);                        // fully under the page: skip drawing it
            L.visible = R.visible = !hidden;
            if (slit) { slit[0].normal.set(...h.nL); slit[1].normal.set(...h.nR); slit[0].constant = slit[1].constant = -LEAF_T / 2; }
          } };
          return part;
        },
        box(o, byId, group) {
          const side = o.span[0] < 0 ? -1 : 1, cut = dieCut(o.span[0], -0.1, o.span[1] - o.span[0], o.height + 0.25, o.art), front = card(cut, 0, group);
          const g = new THREE.BoxGeometry(0.5, o.depth, CARD_T); g.translate((o.span[0] + o.span[1]) / 2, o.depth / 2, 0);
          const strap = new THREE.Mesh(g, core); strap.castShadow = strap.receiveShadow = true; strap.matrixAutoUpdate = false; group.add(strap);
          return { o, meshes: [front, strap], pose() {
            const w = byId[o.on].wing[side], out = cross(w.X, w.n), O = add(w.O, out, o.depth);
            seat(front, w.X, w.Y, O); seat(strap, w.X, mul(out, -1), add(O, w.Y, o.strap));
          } };
        },
        float(o, byId, group, s) {
          const [x0, y0, x1, y1] = o.area, cut = dieCut(x0, y0, x1 - x0, y1 - y0, o.art), m = card(cut, 0, group);
          return { o, meshes: [m], pose(h, t) {
            const w = byId[o.on].wing[o.side], lift = o.gap * Math.max(0, dot(w.Y, w.n)) + CARD_T * K.clamp((Math.PI / 2 - h.a) * 8), dt = t - landed(s);
            const q = (o.wob ? o.wob(t) : 0) + (dt > 0 ? 0.085 * (o.sway || 0) * Math.sin(dt * 21) * Math.exp(-dt * 2.4) : 0), X = add(mul(w.X, Math.cos(q)), w.Y, Math.sin(q)), Y = add(mul(w.Y, Math.cos(q)), w.X, -Math.sin(q));
            let O = add(add(w.O, w.X, o.at[0]), w.Y, o.at[1]); O = add(add(O, X, -o.at[0]), Y, -o.at[1]);
            seat(m, X, Y, add(O, cross(w.X, w.Y), lift));
          } };
        },
      };
      // the words: a ribbon of card creased between two words, which rises through its slit when its word is spoken
      const ribbon = ([left, right], at) => {
        const em = Math.min(0.64, 3.3 / Math.max(widthOf(left, 1), widthOf(right, 1))), gap = 0.18, H = 0.86, xl = -(gap + widthOf(left, em) + 0.3), xr = gap + widthOf(right, em) + 0.3, tail = 0.42;
        return { fold: 'v', z: 1.95, alpha: 78, size: [2 * (Math.max(-xl, xr) + tail) + 0.1, H], slide: at == null ? null : up(at, H, 'ribbon'), art(a) {
          a.path(C.cream, (c) => { c.moveTo(xl - tail, -0.1); c.lineTo(xl - tail + 0.26, H / 2 - 0.05); c.lineTo(xl - tail, H); c.lineTo(xr + tail, H); c.lineTo(xr + tail - 0.26, H / 2 - 0.05); c.lineTo(xr + tail, -0.1); });
          a.box(C.coral, xl - tail + 0.32, H - 0.15, xr - xl + 2 * tail - 0.64, 0.055); a.box(C.coral, xl - tail + 0.32, 0.06, xr - xl + 2 * tail - 0.64, 0.055);
          a.text(left, -gap, 0.5 - 0.36 * em, em, C.navy, 'right'); a.text(right, gap, 0.5 - 0.36 * em, em, C.navy, 'left');
        } };
      };
      const spreads = SPREADS.map((sp, s) => {
        const group = new THREE.Group(), byId = {}; scene.add(group);
        const parts = [...sp.parts, ribbon(sp.words, sp.at)].map((o) => { const p = MAKE[o.fold](o, byId, group, s); if (o.id) byId[o.id] = p; return p; });
        return { group, parts };
      });
      // the paper engineer's check: shut every spread and see that nothing sticks out of the closed book
      const corner = new THREE.Vector3();
      spreads.forEach((sp, s) => {
        const h = hinge(0, Math.PI - 0.02); sp.parts.forEach((p) => p.pose(h, 0));
        sp.parts.forEach((p, i) => { let over = 0; p.meshes.forEach((m) => { const q = m.geometry.attributes.position; for (let k = 0; k < q.count; k += 3) { corner.fromBufferAttribute(q, k).applyMatrix4(m.matrix); over = Math.max(over, -corner.x - PAGE_W, Math.abs(corner.z) - PAGE_D / 2); } }); if (over > 0.02 && !p.o.slide) console.error(`pop-up: piece ${i} of spread ${s + 1} (${p.o.id || p.o.fold}) sticks ${over.toFixed(2)} out of the closed book`); });
      });

      // ------------------------------------------------------------ 4. the book
      const FPX = 128, book = new THREE.Group(); scene.add(book);
      const printed = (side, draw) => K.canvasTex(Math.round(PAGE_W * FPX), Math.round(PAGE_D * FPX), (ctx, w, h) => {
        ctx.fillStyle = C.card; ctx.fillRect(0, 0, w, h); ctx.setTransform(FPX, 0, 0, -FPX, side < 0 ? PAGE_W * FPX : 0, PAGE_D / 2 * FPX); draw(pen(ctx));
        ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createLinearGradient(side < 0 ? w : 0, 0, side < 0 ? w - 60 : 60, 0); g.addColorStop(0, 'rgba(70,50,30,0.3)'); g.addColorStop(1, 'rgba(70,50,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        grain(ctx, w, h);
      });
      const endpaper = (a) => { a.box(C.yellow, -5.7, -3.3, 11.4, 6.6); for (let i = -9; i <= 9; i++) for (let j = -5; j <= 5; j++) jasmine(a, i * 0.66, j * 0.66 + (i & 1 ? 0.33 : 0), 0.18); };
      const face = (side, draw, back) => { const t = printed(side, draw); if (back) { t.center.set(0.5, 0.5); t.rotation = Math.PI; } return paper(t, PAGE_W, PAGE_D); };
      const leaves = TURNS.map((_, j) => {
        const g = new THREE.BoxGeometry(PAGE_W, LEAF_T, PAGE_D); g.translate(PAGE_W / 2, 0, 0);
        const m = new THREE.Mesh(g, [core, core, face(1, j ? SPREADS[j - 1].floor : endpaper), face(-1, SPREADS[j].floor, true), core, core]);
        m.castShadow = m.receiveShadow = true; book.add(m); return m;
      });
      const NL = leaves.length, BLOCK_H = 0.3 + NL * STEP, TABLE_Y = -BLOCK_H - 0.06;   // the stacks reach the boards however many pages have turned
      const edges = new THREE.MeshStandardMaterial({ roughness: 0.95, map: K.canvasTex(32, 256, (ctx, w, h) => { ctx.fillStyle = '#f4ecda'; ctx.fillRect(0, 0, w, h); for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? 'rgba(120,96,60,0.5)' : 'rgba(150,126,90,0.35)'; ctx.fillRect(0, (k + 0.5) * h / 14, w, 2.5); } }) });
      const block = (side, top) => { const g = new THREE.BoxGeometry(PAGE_W, BLOCK_H + NL * STEP, PAGE_D); g.translate(side * PAGE_W / 2, -(BLOCK_H + NL * STEP) / 2, 0); const m = new THREE.Mesh(g, [edges, edges, top, edges, edges, edges]); m.castShadow = m.receiveShadow = true; book.add(m); return m; };
      const blockL = block(-1, face(-1, endpaper)), blockR = block(1, face(1, SPREADS[SPREADS.length - 1].floor));
      const cloth = new THREE.MeshStandardMaterial({ color: '#1f4a4b', roughness: 0.82, bumpScale: 2.5, bumpMap: K.canvasTex(256, 256, (ctx) => { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 256, 256); for (let i = 0; i < 256; i += 4) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(i, 0, 2, 256); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, i, 256, 2); } }, { data: true, repeat: [14, 9] }) });
      for (const side of [-1, 1]) { const b = new THREE.Mesh(K.roundedBox(PAGE_W + 0.22, 0.07, PAGE_D + 0.44, 0.025, 3), cloth); b.position.set(side * (PAGE_W / 2 + 0.17), TABLE_Y + 0.035, 0); b.castShadow = b.receiveShadow = true; book.add(b); }
      const spine = new THREE.Mesh(K.roundedBox(0.5, 0.05, PAGE_D + 0.44, 0.02, 2), cloth); spine.position.set(0, TABLE_Y + 0.025, 0); spine.receiveShadow = true; book.add(spine);
      const TAB = { x: [1.4, 3.1], z: 2.62 }, grip = dieCut(-0.6, -0.32, 1.2, 0.64, (a) => { a.box(C.coral, -0.52, -0.25, 1.04, 0.5, 0.16); for (const x of [-0.24, 0.06]) a.line(C.cream, 0.09, (c) => { c.moveTo(x, 0.12); c.lineTo(x + 0.16, 0); c.lineTo(x, -0.12); }); });
      const tab = card(grip, 0, blockR); tab.rotation.x = -Math.PI / 2; tab.matrixAutoUpdate = true;

      // ------------------------------------------------------------ 5. the table and the lamp
      const wood = K.canvasTex(1024, 1024, (ctx, w, h) => {
        const n = K.noise(12), r = K.rng(6), im = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) { const plank = Math.floor(y / 128), tone = 0.82 + 0.3 * K.hash(plank, 3); for (let x = 0; x < w; x++) { const v = K.clamp(0.5 + 1.25 * n.fbm(x * 0.0016 + plank * 9, y * 0.035, plank, 4) + 0.12 * n.n2(x * 0.02, y * 0.7)) * tone; im.data.set([40 + 78 * v, 23 + 46 * v, 12 + 24 * v, 255], (y * w + x) * 4); } }
        ctx.putImageData(im, 0, 0);
        for (let i = 0; i < 2200; i++) { ctx.fillStyle = `rgba(12,6,2,${r.range(0.1, 0.4)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(6, 40), 1); }
        for (let p = 0; p < 8; p++) { ctx.fillStyle = 'rgba(8,4,2,0.75)'; ctx.fillRect(0, p * 128, w, 2); }
      }, { repeat: [5, 5] });
      const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: 1.2, roughness: 0.58 }));
      table.rotation.x = -Math.PI / 2; table.position.y = TABLE_Y; table.receiveShadow = true; scene.add(table);
      const bits = K.rng(31), inks = [C.coral, C.yellow, C.leaf, C.cream, C.pink];
      [[-7.2, 2.6], [-6.7, 3.6], [6.9, 3.1], [7.5, 1.6], [6.6, -3.6], [-7.0, -2.9], [-3.2, 4.4], [2.2, 4.3], [-6.5, -4.6], [4.2, -4.7]].forEach(([x, z], i) => {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(bits.range(0.5, 1.3), bits.range(-0.1, 0.2)); sh.lineTo(bits.range(0.2, 0.9), bits.range(0.35, 0.8)); if (i % 2) sh.lineTo(bits.range(-0.2, 0.1), bits.range(0.4, 0.7));
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: CARD_T, bevelEnabled: false }), [new THREE.MeshStandardMaterial({ color: inks[i % inks.length], roughness: 0.93 }), core]);
        m.rotation.set(-Math.PI / 2, 0, bits.range(0, 6.3)); m.position.set(x, TABLE_Y + 0.002, z); m.castShadow = m.receiveShadow = true; scene.add(m);
      });
      // a cup of tea by the book
      const glaze = new THREE.MeshStandardMaterial({ color: '#1d3a44', roughness: 0.3 }), mug = new THREE.Group(); mug.position.set(-6.9, TABLE_Y, -6.2); scene.add(mug);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 2.0, 40), glaze); cup.position.y = 1.0; const ear = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.13, 12, 32), glaze); ear.position.set(1.05, 1.0, 0.3); ear.rotation.y = -0.3; mug.add(cup, ear); mug.traverse((m) => { m.castShadow = m.receiveShadow = true; });
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 6), new THREE.MeshStandardMaterial({ color: '#d99a1e', roughness: 0.45 })); pencil.rotation.set(Math.PI / 2, 0, 1.25); pencil.position.set(6.6, TABLE_Y + 0.1, -5.4); pencil.castShadow = pencil.receiveShadow = true; scene.add(pencil);

      K.env(S, { top: '#2a2119', horizon: '#3d3024', bottom: '#6b5740', intensity: 1.0, panels: [{ pos: [9, 11, 7], size: [7, 7], color: '#ffd9a6', power: 3 }, { pos: [-12, 6, -9], size: [6, 8], color: '#8fa8ff', power: 1.1 }] });
      K.spot(S, { pos: [4.5, 9.5, 11], target: [-0.2, 0.8, 0], color: '#ffe9d0', power: 1250, angle: 0.62, penumbra: 0.85, soft: 1.3, mapSize: S.R.lampMap || 4096 });
      K.spot(S, { pos: [-8, 5.5, -10], target: [0, 1, 0], color: '#c2d0ff', power: 150, angle: 0.5, penumbra: 1, shadow: false });
      K.skyLight(S, { color: '#ffe8d2', power: 1.1, size: 9, center: [0, 0, 0] });

      // ------------------------------------------------------------ 6. camera: one slow continuous move. Across each spread it
      // drifts (alternating direction), breathes out while a page turns, and ends in a gentle push.
      const camKeys = [], aimKeys = [];
      SPREADS.forEach((sp, s) => {
        const L = Math.max(0, landed(s)), T = s + 1 < SPREADS.length ? TURNS[s + 1] : DUR, dir = s % 2 ? -1 : 1, last = s === SPREADS.length - 1;
        if (s > 0) { camKeys.push([TURNS[s] + TURN * 0.5, [0, 6.45, 12.1]]); aimKeys.push([TURNS[s] + TURN * 0.5, [0, 1.1, 0.3]]); }
        camKeys.push([L + 0.4, [-0.75 * dir, 6.0, 11.4]]); aimKeys.push([L + 0.4, [-0.12 * dir, 1.05, 0.3]]);
        if (last) { camKeys.push([DUR - 1.2, [0.55, 5.6, 10.6]]); aimKeys.push([DUR - 1.2, [0.35, 1.0, 0.45]]); camKeys.push([DUR, [0.6, 5.58, 10.55]]); aimKeys.push([DUR, [0.36, 1.0, 0.45]]); }
        else { camKeys.push([T - 0.1, [0.75 * dir, 6.0, 11.4]]); aimKeys.push([T - 0.1, [0.12 * dir, 1.05, 0.3]]); }
      });
      camKeys[0][0] = 0; aimKeys[0][0] = 0;
      const cam = { pos: K.path(camKeys), aim: K.path(aimKeys) };

      const riseOf = (j, t) => K.seg(t, TURNS[j], TURNS[j] + TURN * 0.5, K.ease.inOut), sinkOf = (j, t) => K.seg(t, TURNS[j] + TURN * 0.6, TURNS[j] + TURN, K.ease.inOut);
      return {
        update(t) {
          const phi = TURNS.map((t0) => flip(t, t0));
          let onRight = 0, onLeft = 0;
          leaves.forEach((m, j) => { let below = 0; for (let i = 0; i < j; i++) below += 1 - riseOf(i, t); for (let i = j + 1; i < leaves.length; i++) below += sinkOf(i, t); m.rotation.z = phi[j]; m.position.y = -STEP * below; onRight += 1 - riseOf(j, t); onLeft += sinkOf(j, t); });
          blockR.position.y = STEP - LEAF_T / 2 - STEP * onRight; blockL.position.y = STEP - LEAF_T / 2 - STEP * onLeft;   // each block's top meets the lowest page on its side
          tab.position.set(K.lerp(TAB.x[0], TAB.x[1], pulled(t)), CARD_T / 2 + 0.004, TAB.z);
          spreads.forEach((sp, s) => {
            const aL = Math.PI - phi[s], aR = s + 1 < phi.length ? phi[s + 1] : 0;
            sp.group.visible = aL + aR < Math.PI - 0.02;
            if (sp.group.visible) { const h = hinge(aL, aR); sp.parts.forEach((p) => p.pose(h, t)); }
          });
          K.look(camera, cam.pos(t), cam.aim(t)); K.focus(camera, [0, 1.0, 1.35], 0.11);
        },
      };
    },

    sound(k) {
      k.bed('room', 0, DUR, { gain: 1.0 });
      k.music('pad', 0, DUR, { bpm: 76, chords: [['G3', 'B3', 'D4', 'F#4'], ['E3', 'G3', 'B3', 'D4'], ['C3', 'E3', 'G3', 'B3'], ['D3', 'F#3', 'A3', 'C4']], gain: 0.45 });
      const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5'];
      TURNS.forEach((t0, s) => {
        const hit = landed(s);
        if (t0 > 0) { k.play('paper', t0 + 0.02, { gain: 1.4, dur: 0.5, pan: 0.4 }); k.play('whoosh', t0 + 0.3, { gain: 0.55, dur: 0.8, top: 1500 }); k.play('paper', t0 + 0.5, { gain: 0.9, dur: 0.7 }); }
        k.withMinor(() => { for (let i = 0; i < 7; i++) if (hit - 0.62 + i * 0.085 > 0) k.play('tick', hit - 0.62 + i * 0.085, { gain: 0.45 + 0.06 * i, f: 1900 + i * 260, pan: -0.3 + i * 0.1 }); });   // card creaking upright
        if (hit > 0) { k.play('slap', hit, { gain: 0.6, pan: -0.3 }); k.play('thud', hit, { gain: 0.5, f: 105, pan: -0.3 }); k.play('paper', hit + 0.04, { gain: 0.45, dur: 0.22 }); }
        k.play('ding', Math.max(0.05, hit + 0.14), { gain: 0.26, f: NOTES[s % NOTES.length] });
        k.withMinor(() => { for (let i = 0; i < 4; i++) if (hit + 0.19 > 0) k.play('tick', hit + 0.19 + i * 0.3, { gain: 0.14 - 0.03 * i, f: 5200, pan: 0.2 }); });   // pieces trembling on their arms
      });
      // a village bull, low and calm (in the thought clouds)
      const moo = (t) => { k.tone(t, { f: [[0, 'A2'], [0.25, 'C3'], [0.95, 'G2']], type: 'sawtooth', dur: 1.05, gain: 0.07, a: 0.09, hold: 0.6, filter: 'lowpass', f2: 650, verb: 0.2 }); k.tone(t + 0.02, { f: [[0, 'A2'], [0.25, 'C3'], [0.95, 'G2']], type: 'triangle', dur: 1.0, gain: 0.08, a: 0.1, hold: 0.55, detune: 14 }); };
      REVEALS.forEach(({ at, kind }) => {
        const t = at - 0.3;                                                     // the piece breaks the page here
        if (kind === 'sink') { k.withMinor(() => k.play('paper', at - 0.3, { gain: 0.5, dur: 0.35, pan: -0.2 })); return; }
        k.withMinor(() => { k.play('tape', t, { gain: 0.6, dur: 0.32, pan: 0.15 }); k.play('tick', at + 0.15, { gain: 0.35, f: 3000 }); });
        if (kind === 'ribbon') k.withMinor(() => { k.play('paper', t, { gain: 0.5, dur: 0.3 }); k.play('tock', at + 0.15, { gain: 0.35, f: 640 }); });
        else if (kind === 'invite') { k.play('paper', t, { gain: 0.7, dur: 0.3 }); k.play('ding', at + 0.15, { gain: 0.3, f: 'E6' }); }
        else if (kind === 'jump') { k.play('jump', at - 0.05, { gain: 0.5 }); k.play('pop', at + 0.12, { gain: 0.5, f: 520 }); }
        else if (kind === 'no') k.play('stamp', at + 0.1, { gain: 0.8 });
        else if (kind === 'card') k.play('tock', at + 0.12, { gain: 0.6, f: 520 });
        else if (kind === 'bull') { k.play('pop', at + 0.1, { gain: 0.45, f: 560, minor: true }); moo(at + 0.15); }
        else if (kind === 'gate') k.play('sparkle', at + 0.05, { gain: 0.7, n: 6 });
        else if (kind === 'dust') { k.play('impact', at, { gain: 0.8 }); k.withMinor(() => { for (let i = 0; i < 5; i++) k.play('thud', at + 0.25 + i * 0.16, { gain: 0.35, f: 120 + 25 * (i % 3) }); }); }
        else if (kind === 'run') k.play('whoosh', at - 0.15, { gain: 0.6, dur: 0.6, pan: 0.5 });
        else if (kind === 'tumble') { k.play('swish', at - 0.05, { gain: 0.5 }); k.play('thud', at + 0.12, { gain: 0.6, f: 115 }); k.play('thud', at + 0.3, { gain: 0.45, f: 95 }); }
        else if (kind === 'speech') k.play('blip', at, { gain: 0.7, f: 'A5' });
        else if (kind === 'charge') { k.play('thud', at, { gain: 0.8, f: 90 }); k.play('swish', at - 0.12, { gain: 0.55 }); k.play('ding', at + 0.1, { gain: 0.12, f: 'C7' }); }
        else k.play('pop', at + 0.12, { gain: 0.55, f: kind === 'person' ? 480 : 640, minor: kind !== 'person' });
      });
      // wedding drums inside the hall, soft under the narration
      k.withMinor(() => { for (let t = landed(4) + 0.2, i = 0; t < TURNS[5] + 0.2; t += 0.27, i++) { const b = i % 8; if (b === 0 || b === 3 || b === 6) k.play('thud', t, { gain: b === 0 ? 0.32 : 0.22, f: b === 0 ? 120 : 160, pan: -0.4 }); if (b === 2 || b === 5 || b === 7) k.play('tock', t, { gain: 0.18, f: 420, pan: 0.3 }); } });
      // the hubbub in the yard, from the commotion until mother grabs him
      k.withMinor(() => { const r = K.rng(311); for (let t = W(12, 'huge'); t < TURNS[7] + 1.0; t += 0.05 + r() * 0.1) k.noise(t, { dur: 0.12 + r() * 0.15, color: 'pink', filter: 'bandpass', f: 450 + r() * 1100, q: 2.5, gain: 0.035 + r() * 0.03, a: 0.03, pan: r() * 1.4 - 0.7 }); });
      // Andare's charges and head-rocks on the yard
      LUNGES.forEach((l) => { k.play('swish', l - 0.12, { gain: 0.5 }); k.play('thud', l + 0.05, { gain: 0.65, f: 88 }); });
      k.withMinor(() => { for (let t = W(16, 'tilting'); t < W(16, 'people'); t += Math.PI / 7.5) k.play('tick', t, { gain: 0.3, f: 1600, pan: 0.2 }); });
      // the pull tab: everyone laughs
      k.play('tape', PULL[0], { gain: 1.2, dur: PULL[1] - PULL[0], pan: 0.4 }); k.play('paper', PULL[0], { gain: 0.7, dur: 0.7, pan: 0.4 });
      k.play('tock', PULL[1], { gain: 0.55, f: 500, pan: 0.4 }); k.play('sparkle', PULL[1] + 0.05, { gain: 0.8, n: 8 }); k.play('success', PULL[1] + 0.2, { gain: 0.6, f: 'C6' });
      k.play('ding', BEATS[BEATS.length - 1].t[1] + 0.35, { gain: 0.3, f: 'G5' });
    },
  });
}
