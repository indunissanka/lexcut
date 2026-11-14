{
  // ================================================================ content (change this block for a new story)
  // "Little Hoppers for Little Andare", told as a pop-up book on a desk. One spread per idea. Pieces stand on the same
  // fold mechanisms as the reference (v, box, float, slide). New here: `pop` pieces are V-fold sliders that come up
  // through a slit in the page on the word they illustrate (a hidden pull strip), and every ribbon of words is a slider too,
  // so it rises as its word is spoken. All times come from BEATS.
  const C = { card: '#f5ecd9', cream: '#fbf3df', navy: '#22364e', coral: '#e2604a', pink: '#f3ab99', yellow: '#f5bd35', honey: '#eba020', amber: '#cf7d22', leaf: '#74a25e', sage: '#a6c787', deep: '#2f6753', sky: '#cfe5df',
    skin: '#b0703f', skinD: '#8c522c', wood: '#8a5a32', clay: '#b4532f', brass: '#d39a2e', brassL: '#f0c45a', crisp: '#f3d28c', white: '#fffaf0', stone: '#8f8b80', dusk: '#f6c79a' };

  // ---------------------------------------------------------------- BEATS: one entry per voiceover line
  // t = [start, end] in seconds, say = the words spoken, show = what happens on screen. `words` can hold real word
  // timestamps ([[word, time], ...], taken from the voiceover with Whisper); without them W() estimates a word's time from its position in the line.
  const BEATS = [
    { t: [0.00, 5.20], say: 'Little Hoppers for Little Andare', show: 'Cover spread: the hopper pan on the fire, title ribbon', words: [["little", 1.24], ["hoppers", 1.64], ["for", 2.18], ["little", 2.48], ["andare", 2.82]] },
    { t: [5.20, 10.56], say: 'When Andare was a little boy, he loved eating hoppers for breakfast.', show: 'Page turns to Andare at home; a table of hoppers pops up on "hoppers"', words: [["when", 4.58], ["andare", 5.18], ["was", 5.74], ["a", 6.0], ["little", 6.14], ["boy", 6.3], ["he", 6.96], ["loved", 7.14], ["eating", 7.72], ["hoppers", 8.14], ["for", 8.82], ["breakfast", 9.02]] },
    { t: [10.56, 15.00], say: 'Every morning, his mother would give him twenty panam to buy some.', show: 'Mother rises on "mother"; four 5-panam coins on "twenty panam"', words: [["every", 10.18], ["morning", 10.54], ["his", 10.92], ["mother", 11.26], ["would", 11.6], ["give", 11.82], ["him", 12.02], ["twenty", 12.2], ["panam", 12.58], ["to", 13.28], ["buy", 13.42], ["some", 13.6]] },
    { t: [15.00, 21.56], say: 'Andare would take the money, head over to the hopper lady, and bring back four hoppers.', show: 'Page turns to the hopper stall; four hoppers pop up on "four"', words: [["andare", 14.6], ["would", 14.98], ["take", 15.14], ["the", 15.32], ["money", 15.48], ["head", 16.2], ["over", 16.32], ["to", 16.56], ["the", 16.76], ["hopper", 16.86], ["lady", 17.12], ["and", 17.88], ["bring", 18.06], ["back", 18.28], ["four", 18.64], ["hoppers", 19.22]] },
    { t: [21.56, 26.72], say: 'Sometimes the hoppers she made came out way too small, and those tiny ones wouldn\'t sell.', show: 'Close on the counter: a tray of tiny hoppers rises on "small"', words: [["sometimes", 20.7], ["the", 21.22], ["hoppers", 21.78], ["she", 22.06], ["made", 22.22], ["came", 22.44], ["out", 22.64], ["way", 22.8], ["too", 23.06], ["small", 23.26], ["and", 23.9], ["those", 24.3], ["tiny", 24.46], ["ones", 24.78], ["wouldn't", 25.04], ["sell", 25.42]] },
    { t: [26.72, 28.86], say: 'So what did she do with the leftovers?', show: 'Hold on the tiny hoppers', words: [["so", 26.28], ["what", 26.5], ["did", 26.72], ["she", 26.9], ["do", 27.1], ["with", 27.28], ["the", 27.44], ["leftovers", 27.56]] },
    { t: [28.86, 33.66], say: 'She sold all the tiny hoppers to little Andare.', show: 'Andare pops up holding the tiny hoppers on "sold"', words: [["she", 28.58], ["sold", 28.9], ["all", 29.34], ["the", 29.72], ["tiny", 29.92], ["hoppers", 30.38], ["to", 30.9], ["little", 31.4], ["andare", 31.76]] },
    { t: [33.66, 39.54], say: 'For a few days, Andare watched her pull this trick, quietly nursing a grudge.', show: 'Page turns: days pass in the sky, Andare with arms crossed', words: [["for", 33.36], ["a", 33.68], ["few", 33.8], ["days", 33.92], ["andare", 34.14], ["watched", 34.94], ["her", 35.46], ["pull", 35.74], ["this", 36.02], ["trick", 36.32], ["quietly", 36.92], ["nursing", 37.62], ["a", 38.22], ["grudge", 38.52]] },
    { t: [39.54, 47.26], say: 'Finally, one day, little Andare said to himself, "She gives me tiny hoppers every single day.', show: 'Thought cloud with a tiny hopper rises on "tiny"', words: [["finally", 39.62], ["one", 40.34], ["day", 40.48], ["little", 41.12], ["andare", 41.4], ["said", 41.9], ["to", 42.18], ["himself", 42.36], ["she", 43.38], ["gives", 43.66], ["me", 43.96], ["tiny", 44.18], ["hoppers", 44.64], ["every", 45.16], ["single", 45.72], ["day", 46.22]] },
    { t: [47.26, 50.18], say: 'I\'m going to teach her a good lesson."', show: 'An idea pops into the cloud on "lesson": tiny coins', words: [["i'm", 47.1], ["going", 47.6], ["to", 47.78], ["teach", 47.94], ["her", 48.1], ["a", 48.3], ["good", 48.48], ["lesson", 48.8]] },
    { t: [50.18, 56.14], say: 'Sure enough, that day too, she handed him four tiny hoppers for his twenty panam.', show: 'Page turns to the stall; four tiny hoppers in her hand on "four"', words: [["sure", 49.94], ["enough", 50.2], ["that", 50.88], ["day", 51.16], ["too", 51.36], ["she", 52.02], ["handed", 52.16], ["him", 52.42], ["four", 52.62], ["tiny", 53.14], ["hoppers", 53.7], ["for", 54.12], ["his", 54.3], ["twenty", 54.5], ["panam", 54.88]] },
    { t: [56.78, 60.50], say: '"Auntie, why are these hoppers so tiny?"', show: 'Speech bubble "?" on "Auntie"', words: [["auntie", 56.44], ["why", 57.96], ["are", 58.3], ["these", 58.48], ["hoppers", 58.74], ["so", 59.14], ["tiny", 59.36]] },
    { t: [60.50, 61.26], say: 'Andare asked.', show: 'Hold', words: [["andare", 60.38], ["asked", 60.72]] },
    { t: [62.38, 67.42], say: 'The hopper lady replied, "Well, Andare, you\'re small, aren\'t you?', show: 'Page turns: the lady explains, Andare small beside her', words: [["the", 62.3], ["hopper", 62.46], ["lady", 62.66], ["replied", 62.84], ["well", 63.9], ["andare", 64.68], ["you're", 65.58], ["small", 65.84], ["aren't", 66.48], ["you", 66.7]] },
    { t: [67.42, 71.46], say: 'It\'s much easier for little kids to eat little hoppers.', show: 'A bitten tiny hopper pops up on "eat"', words: [["it's", 67.36], ["much", 67.62], ["easier", 67.84], ["for", 68.56], ["little", 68.82], ["kids", 69.16], ["to", 69.52], ["eat", 69.74], ["little", 69.94], ["hoppers", 70.4]] },
    { t: [71.46, 76.38], say: 'Not only that, since they\'re lighter, they\'re easier for you to carry home, too."', show: 'A feather floats up on "lighter"', words: [["not", 71.32], ["only", 71.6], ["that", 71.8], ["since", 72.62], ["they're", 72.7], ["lighter", 72.96], ["they're", 73.84], ["easier", 74.08], ["for", 74.46], ["you", 74.72], ["to", 74.86], ["carry", 74.96], ["home", 75.24], ["too", 75.82]] },
    { t: [77.66, 80.34], say: '"Oh, is that so?"', show: 'Page turns: the basket on the counter, Andare grinning', words: [["oh", 77.36], ["is", 78.62], ["that", 78.94], ["so", 79.14]] },
    { t: [80.34, 85.74], say: 'Andare said, tossing some coins into her basket before grabbing his hoppers and running off toward home.', show: 'Coins arc into the basket on "tossing"; dust puffs on "running"', words: [["andare", 80.14], ["said", 80.58], ["tossing", 81.42], ["some", 81.72], ["coins", 81.88], ["into", 82.18], ["her", 82.44], ["basket", 82.6], ["before", 82.9], ["grabbing", 83.12], ["his", 83.56], ["hoppers", 83.76], ["and", 84.12], ["running", 84.46], ["off", 84.86], ["toward", 85.12], ["home", 85.32]] },
    { t: [87.10, 89.90], say: 'The hopper lady looked down into the basket.', show: 'Page turns: big basket, the lady peering in', words: [["the", 87.0], ["hopper", 87.26], ["lady", 87.52], ["looked", 87.76], ["down", 88.02], ["into", 88.44], ["the", 88.7], ["basket", 88.82]] },
    { t: [89.90, 96.86], say: 'Instead of four five-panam coins, there were only four one-panam coins sitting there.', show: 'Ghost 5-panam coins on "five-panam"; four tiny 1-panam coins on "one-panam"', words: [["instead", 89.78], ["of", 90.2], ["four", 90.46], ["five", 91.12], ["panam", 91.52], ["coins", 91.92], ["there", 92.9], ["were", 93.04], ["only", 93.14], ["four", 93.36], ["one", 94.02], ["panam", 94.58], ["coins", 95.18], ["sitting", 95.62], ["there", 95.92]] },
    { t: [96.86, 98.18], say: 'She was furious.', show: 'Page turns: anger bursts on "furious"', words: [["she", 96.78], ["was", 97.08], ["furious", 97.26]] },
    { t: [98.18, 100.30], say: '"Stop right there, Andare!', show: 'Ribbon rises on "Stop"', words: [["stop", 98.22], ["right", 98.6], ["there", 98.98], ["andare", 99.52]] },
    { t: [100.30, 102.50], say: 'You\'re short on money here.', show: 'Hold', words: [["you're", 100.2], ["short", 100.56], ["on", 101.0], ["money", 101.24], ["here", 101.6]] },
    { t: [102.50, 105.22], say: 'Why did you drop these tiny coins and run off?"', show: 'Tiny coins in her fist on "tiny coins"', words: [["why", 102.36], ["did", 102.68], ["you", 102.84], ["drop", 102.94], ["these", 103.22], ["tiny", 103.44], ["coins", 103.86], ["and", 104.18], ["run", 104.4], ["off", 104.54]] },
    { t: [105.22, 106.30], say: 'she yelled angrily.', show: 'Hold', words: [["she", 105.24], ["yelled", 105.4], ["angrily", 105.64]] },
    { t: [107.50, 110.90], say: '"When it\'s less money, it\'s easier for you to count, Auntie.', show: 'Page turns: the road home, Andare running', words: [["when", 107.26], ["it's", 107.68], ["less", 107.88], ["money", 108.06], ["it's", 108.7], ["easier", 108.88], ["for", 109.2], ["you", 109.42], ["to", 109.54], ["count", 109.64], ["auntie", 110.12]] },
    { t: [110.90, 114.26], say: 'And since the coins are tiny, they\'re easier for you to keep,"', show: 'Ribbon rises on "keep"', words: [["and", 110.92], ["since", 111.04], ["the", 111.16], ["coins", 111.36], ["are", 111.58], ["tiny", 111.7], ["they're", 112.5], ["easier", 112.6], ["for", 113.0], ["you", 113.28], ["to", 113.42], ["keep", 113.52]] },
    { t: [114.26, 117.78], say: 'Andare called back, running all the way home without looking back.', show: 'Pull tab: Andare reaches home with his hoppers', words: [["andare", 114.24], ["called", 114.58], ["back", 114.84], ["running", 115.46], ["all", 115.74], ["the", 116.1], ["way", 116.28], ["home", 116.46], ["without", 116.72], ["looking", 117.0], ["back", 117.36]] },
  ];
  // time a word is spoken in line n (1-based). nth picks a later occurrence.
  const W = (n, word, nth = 0) => {
    const b = BEATS[n - 1];
    if (b.words) { const key = word.toLowerCase().split('-')[0].replace(/[^a-z0-9']/g, ''), hit = b.words.filter(([w]) => w.startsWith(key))[nth]; if (hit) return hit[1]; }
    const s = b.say.toLowerCase(); let i = -1; for (let k = 0; k <= nth; k++) i = s.indexOf(word.toLowerCase(), i + 1);
    if (i < 0) throw new Error(`word "${word}" not in line ${n}`);
    return b.t[0] + (i / s.length) * (b.t[1] - b.t[0]);
  };
  const DUR = BEATS[BEATS.length - 1].t[1] + 1.0;

  const PAGE_W = 5.6, PAGE_D = 6.4;
  const TURN = 1.25;
  // pop-up reveals. Each records itself so the score can play its sound on the same frame.
  const REVEALS = [];
  const up = (at, h, kind, sinkAt) => { REVEALS.push({ at, kind }); return (t) => -(h + 0.25) * (1 - K.seg(t, at - 0.32, at + 0.18, K.ease.out)) - (sinkAt ? (h + 0.25) * K.seg(t, sinkAt, sinkAt + 0.4, K.ease.inOut) : 0); };
  const pop = (z, at, size, art, kind = 'pop') => ({ fold: 'v', z, alpha: 58, size, slide: up(at, size[1], kind), art });

  // ---------------------------------------------------------------- printed motifs
  const leaf = (a, x, y, len, q, col = C.leaf) => a.path(col, (c) => { const ex = x + Math.cos(q) * len, ey = y + Math.sin(q) * len; c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(q + 0.6) * len * 0.6, y + Math.sin(q + 0.6) * len * 0.6, ex, ey); c.quadraticCurveTo(x + Math.cos(q - 0.6) * len * 0.6, y + Math.sin(q - 0.6) * len * 0.6, x, y); });
  const grass = (a, x0, x1, h, col, seed) => a.path(col, (c) => { const r = K.rng(seed); c.moveTo(x0, -0.1); for (let x = x0; x < x1 - 0.05;) { const w = r.range(0.13, 0.24); c.lineTo(x + w * r.range(0.2, 0.8), h * r.range(0.75, 1.5)); x += w; c.lineTo(Math.min(x, x1), h * 0.5); } c.lineTo(x1, -0.1); });
  const ground = (a, x0, x1, col = C.wood) => a.box(col, x0, -0.12, x1 - x0, 0.14, 0.04);           // the strip a slider stands on (below the page when up)
  // the paper arm a piece rides on, printed as a dotted path
  const arm = (a, pts) => { const p = (c) => { c.moveTo(pts[0], pts[1]); c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); }; a.line(C.cream, 0.13, p); a.line(C.navy, 0.045, p, [0.1, 0.12]); };
  // a hopper seen from the side: a crisp lacy bowl with a soft middle
  const hopper = (a, x, y, r) => {
    a.path(C.amber, (c) => { c.moveTo(x - r, y + 0.42 * r); c.quadraticCurveTo(x, y - 0.55 * r, x + r, y + 0.42 * r); c.closePath(); });
    for (let k = -2; k <= 2; k++) a.disc(C.honey, x + k * 0.3 * r, y + 0.12 * r - Math.abs(k) * 0.04 * r, 0.07 * r);
    a.disc(C.amber, x, y + 0.42 * r, r, 0.27 * r); a.disc(C.crisp, x, y + 0.42 * r, 0.86 * r, 0.2 * r); a.disc(C.white, x, y + 0.4 * r, 0.42 * r, 0.1 * r);
  };
  const hopperTop = (a, x, y, r) => { a.disc(C.amber, x, y, r); a.disc(C.crisp, x, y, 0.8 * r); for (let k = 0; k < 8; k++) a.disc(C.honey, x + 0.62 * r * Math.cos(k * 0.785), y + 0.62 * r * Math.sin(k * 0.785), 0.07 * r); a.disc(C.white, x, y, 0.42 * r); };
  // a coin with its value stamped on it. ghost = only an outline (what should have been there)
  const coin = (a, x, y, r, label, ghost) => {
    if (ghost) { a.disc(C.cream, x, y, r); a.line(C.amber, 0.05, (c) => c.arc(x, y, r * 0.86, 0, 7), [0.09, 0.07]); a.text(label, x, y - 0.36 * r, r * 1.05, C.amber); return; }
    a.disc('#a8741f', x, y, r); a.disc(C.brass, x, y, r * 0.9); a.disc(C.brassL, x, y, r * 0.74); a.text(label, x, y - 0.37 * r, r * 1.05, C.navy);
  };
  const leafPlate = (a, x, y, w) => { a.path(C.deep, (c) => c.ellipse(x, y, w / 2, w * 0.13, 0, 0, 7)); a.path(C.leaf, (c) => c.ellipse(x, y + 0.03, w / 2 * 0.93, w * 0.09, 0, 0, 7)); a.line(C.sage, 0.03, (c) => { c.moveTo(x - w * 0.45, y + 0.03); c.lineTo(x + w * 0.45, y + 0.03); }); };
  const flame = (a, x, y, s) => { a.path(C.coral, (c) => { c.moveTo(x - 0.22 * s, y); c.quadraticCurveTo(x - 0.25 * s, y + 0.35 * s, x, y + 0.7 * s); c.quadraticCurveTo(x + 0.25 * s, y + 0.35 * s, x + 0.22 * s, y); }); a.path(C.yellow, (c) => { c.moveTo(x - 0.11 * s, y); c.quadraticCurveTo(x - 0.12 * s, y + 0.2 * s, x, y + 0.42 * s); c.quadraticCurveTo(x + 0.12 * s, y + 0.2 * s, x + 0.11 * s, y); }); };
  // the clay hearth with a small hopper pan (appa thachchiya) on it
  const hearth = (a, x, y, s, withHopper = true) => {
    a.box(C.stone, x - 0.75 * s, y, 1.5 * s, 0.18 * s, 0.06 * s);
    [-0.55, 0, 0.55].forEach((k) => a.disc(C.stone, x + k * s, y + 0.3 * s, 0.17 * s, 0.22 * s));
    flame(a, x - 0.25 * s, y + 0.12 * s, 0.75 * s); flame(a, x + 0.25 * s, y + 0.12 * s, 0.65 * s); flame(a, x, y + 0.12 * s, 0.9 * s);
    a.path(C.navy, (c) => { c.moveTo(x - 0.78 * s, y + 0.8 * s); c.quadraticCurveTo(x, y + 0.12 * s, x + 0.78 * s, y + 0.8 * s); c.closePath(); });
    a.line(C.navy, 0.09 * s, (c) => c.arc(x - 0.86 * s, y + 0.8 * s, 0.1 * s, Math.PI * 0.5, Math.PI * 1.5)); a.line(C.navy, 0.09 * s, (c) => c.arc(x + 0.86 * s, y + 0.8 * s, 0.1 * s, -Math.PI * 0.5, Math.PI * 0.5));
    if (withHopper) { a.disc(C.amber, x, y + 0.8 * s, 0.7 * s, 0.16 * s); a.disc(C.crisp, x, y + 0.81 * s, 0.6 * s, 0.12 * s); a.disc(C.white, x, y + 0.8 * s, 0.28 * s, 0.06 * s); }
    a.disc('#3a4c63', x, y + 0.8 * s, 0.82 * s, 0.05 * s);
  };
  const smoke = (a, x, y, s) => a.line('#ece4d3', 0.12 * s, (c) => { c.moveTo(x, y); c.bezierCurveTo(x - 0.3 * s, y + 0.3 * s, x + 0.3 * s, y + 0.5 * s, x, y + 0.85 * s); });
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
  const stallRoof = (a, x0, x1, y) => {
    a.box(C.wood, x0 + 0.05, -0.1, 0.11, y + 0.1); a.box(C.wood, x1 - 0.16, -0.1, 0.11, y + 0.1);
    a.path(C.honey, (c) => { c.moveTo(x0 - 0.25, y); c.lineTo(x0 + 0.2, y + 0.6); c.lineTo(x1 - 0.2, y + 0.6); c.lineTo(x1 + 0.25, y); });
    for (let x = x0 - 0.1; x < x1 + 0.15; x += 0.16) a.line(C.amber, 0.035, (c) => { c.moveTo(x, y + 0.02); c.lineTo(x + (x - (x0 + x1) / 2) * -0.08, y + 0.56); });
    a.box(C.amber, x0 - 0.25, y - 0.06, x1 - x0 + 0.5, 0.1, 0.04);
  };
  const counter = (a, x0, x1, h) => {
    a.box(C.wood, x0, -0.1, x1 - x0, h + 0.1, 0.05); a.box(C.coral, x0 + 0.08, 0.05, x1 - x0 - 0.16, h - 0.25, 0.04);
    a.line(C.cream, 0.05, (c) => { c.moveTo(x0 + 0.12, h * 0.42); for (let x = x0 + 0.12; x < x1 - 0.12; x += 0.16) c.lineTo(x + 0.08, h * 0.42 + ((x - x0) / 0.16 % 2 < 1 ? 0.09 : -0.02)); }, null);
    a.box('#6e4526', x0 - 0.06, h - 0.08, x1 - x0 + 0.12, 0.1, 0.03);
  };
  const basket = (a, x, y, w, h) => {
    a.path(C.amber, (c) => { c.moveTo(x - w / 2, y + h); c.lineTo(x - w * 0.38, y); c.lineTo(x + w * 0.38, y); c.lineTo(x + w / 2, y + h); });
    for (let k = 1; k < 5; k++) a.line(C.honey, 0.045, (c) => { const yy = y + k * h / 5, ww = K.lerp(w * 0.38, w / 2, k / 5); c.moveTo(x - ww + 0.04, yy); c.lineTo(x + ww - 0.04, yy); });
    for (let k = -3; k <= 3; k++) a.line('#b0641b', 0.035, (c) => { c.moveTo(x + k * w * 0.11, y + 0.03); c.lineTo(x + k * w * 0.14, y + h - 0.03); });
    a.box(C.wood, x - w / 2 - 0.05, y + h - 0.06, w + 0.1, 0.13, 0.06);
  };
  const cloud = (a, x, y, w, col = C.white) => { [[-0.32, 0, 0.3], [0, 0.1, 0.36], [0.32, 0, 0.3], [0.12, -0.12, 0.28], [-0.16, -0.12, 0.26]].forEach(([dx, dy, r]) => a.disc(C.sky, x + dx * w, y + dy * w, r * w + 0.05)); [[-0.32, 0, 0.3], [0, 0.1, 0.36], [0.32, 0, 0.3], [0.12, -0.12, 0.28], [-0.16, -0.12, 0.26]].forEach(([dx, dy, r]) => a.disc(col, x + dx * w, y + dy * w, r * w)); };
  const sunDisc = (a, x, y, r) => { for (let k = 0; k < 12; k++) a.line(C.yellow, 0.06, (c) => { c.moveTo(x + Math.cos(k * 0.5236) * r * 1.2, y + Math.sin(k * 0.5236) * r * 1.2); c.lineTo(x + Math.cos(k * 0.5236) * r * 1.45, y + Math.sin(k * 0.5236) * r * 1.45); }); a.disc(C.yellow, x, y, r); a.disc('#f9d46c', x, y, r * 0.72); };
  const moon = (a, x, y, r) => { a.disc(C.cream, x, y, r); a.disc(C.navy, x + r * 0.45, y + r * 0.2, r * 0.85); };
  const burst = (a, x, y, r, col = C.coral) => a.path(col, (c) => { for (let k = 0; k < 18; k++) { const q = k * Math.PI / 9, rr = k % 2 ? r * 0.55 : r; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } c.closePath(); });
  const bubble = (a, x, y, w, h, tailX, tailY, str) => { a.path(C.navy, (c) => { c.moveTo(x - 0.15, y - h / 2 + 0.05); c.lineTo(tailX, tailY); c.lineTo(x + 0.15, y - h / 2 + 0.05); }); a.box(C.navy, x - w / 2 - 0.05, y - h / 2 - 0.05, w + 0.1, h + 0.1, h / 2); a.box(C.white, x - w / 2, y - h / 2, w, h, h / 2); a.text(str, x, y - h * 0.3, h * 0.8, C.coral); };
  const pageNo = (a, n) => { a.disc(C.coral, -4.6, -2.55, 0.34); a.disc(C.cream, -4.6, -2.55, 0.27); a.text(String(n), -4.6, -2.72, 0.46, C.navy); };
  const floorBase = (a, col) => a.box(col, -5.42, -3.02, 10.84, 6.04, 0.45);
  const scatter = (a, seed, n, fn) => { const r = K.rng(seed); for (let i = 0; i < n; i++) { const x = r.range(-5, 5), y = r.range(-2.7, 2.7); if (Math.abs(x) < 2.6 && y > -1.6 && y < 1.4) continue; fn(x, y, r); } };

  // ---------------------------------------------------------------- the people (drawn in their own units, standing on y0)
  const face = (a, hx, hy, r, mood, k) => {   // k = which way the face looks (+1 right)
    const ex = 0.33 * r * k, ey = hy + 0.05 * r;
    if (mood === 'angry') { a.line(C.navy, 0.06, (c) => { c.moveTo(hx + ex - 0.5 * r, ey + 0.38 * r); c.lineTo(hx + ex - 0.12 * r, ey + 0.22 * r); }); a.line(C.navy, 0.06, (c) => { c.moveTo(hx + ex + 0.5 * r, ey + 0.38 * r); c.lineTo(hx + ex + 0.12 * r, ey + 0.22 * r); }); }
    if (mood === 'grumpy') { a.line(C.navy, 0.05, (c) => { c.moveTo(hx + ex - 0.45 * r, ey + 0.32 * r); c.lineTo(hx + ex - 0.12 * r, ey + 0.24 * r); }); a.line(C.navy, 0.05, (c) => { c.moveTo(hx + ex + 0.45 * r, ey + 0.32 * r); c.lineTo(hx + ex + 0.12 * r, ey + 0.24 * r); }); }
    if (mood === 'sly') a.line(C.navy, 0.045, (c) => { c.moveTo(hx + ex + 0.12 * r, ey + 0.3 * r); c.quadraticCurveTo(hx + ex + 0.3 * r, ey + 0.42 * r, hx + ex + 0.48 * r, ey + 0.32 * r); });
    const dy = mood === 'look' ? -0.12 * r : 0;
    a.disc(C.navy, hx + ex - 0.28 * r, ey + dy, 0.12 * r, mood === 'sly' ? 0.06 * r : 0.14 * r); a.disc(C.navy, hx + ex + 0.28 * r, ey + dy, 0.12 * r, 0.14 * r);
    a.disc(C.pink, hx + ex - 0.5 * r, hy - 0.3 * r, 0.12 * r, 0.08 * r); a.disc(C.pink, hx + ex + 0.52 * r, hy - 0.3 * r, 0.12 * r, 0.08 * r);
    const mx = hx + ex, my = hy - 0.42 * r;
    if (mood === 'happy' || mood === 'sly') a.line(C.navy, 0.05, (c) => c.arc(mx, my + 0.22 * r, 0.3 * r, Math.PI + 0.55, 2 * Math.PI - 0.55));
    else if (mood === 'grumpy' || mood === 'look') a.line(C.navy, 0.05, (c) => c.arc(mx, my - 0.22 * r, 0.24 * r, 0.6, Math.PI - 0.6));
    else if (mood === 'angry' || mood === 'ask' || mood === 'eat') a.disc(C.navy, mx, my, 0.17 * r, mood === 'eat' ? 0.15 * r : 0.21 * r);
    else a.line(C.navy, 0.05, (c) => { c.moveTo(mx - 0.15 * r, my); c.lineTo(mx + 0.15 * r, my); });
  };
  // Andare: a small boy in a yellow shirt and navy shorts. pose: stand, hold, reach, cross, run, toss, wave
  const kid = (a, x, y0, s, o = {}) => {
    const c = a.ctx, k = o.face || 1, pose = o.pose || 'stand'; c.save(); c.translate(x, y0); c.scale(s * k, s);
    const skin = (pts, w = 0.15) => a.line(C.skin, w, (p) => { p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); });
    if (pose === 'run') { skin([-0.1, 0.72, -0.32, 0.38, -0.55, 0.12], 0.17); skin([0.1, 0.72, 0.3, 0.38, 0.52, 0.3], 0.17); a.disc(C.navy, -0.6, 0.08, 0.12, 0.07); a.disc(C.navy, 0.6, 0.28, 0.12, 0.07, 0.6); }
    else { a.box(C.skin, -0.2, 0.04, 0.15, 0.72); a.box(C.skin, 0.05, 0.04, 0.15, 0.72); a.disc(C.navy, -0.14, 0.04, 0.14, 0.07); a.disc(C.navy, 0.16, 0.04, 0.14, 0.07); }
    a.box(C.navy, -0.32, 0.6, 0.64, 0.38, 0.07);
    const back = { stand: [-0.3, 1.42, -0.45, 0.95], hold: [-0.28, 1.4, -0.1, 1.08, 0.42, 1.2], reach: [-0.3, 1.42, -0.45, 0.95], cross: [-0.3, 1.4, 0.05, 1.18, 0.34, 1.3], run: [-0.3, 1.42, -0.6, 1.12, -0.72, 1.3], toss: [-0.3, 1.42, -0.48, 0.98], wave: [-0.3, 1.42, -0.45, 0.95] }[pose];
    const front = { stand: [0.3, 1.42, 0.45, 0.95], hold: [0.28, 1.4, 0.45, 1.08, 0.62, 1.22], reach: [0.3, 1.42, 0.62, 1.3, 0.92, 1.4], cross: [0.3, 1.4, -0.05, 1.25, -0.34, 1.32], run: [0.3, 1.42, 0.6, 1.2, 0.82, 1.42], toss: [0.3, 1.45, 0.62, 1.72, 0.82, 1.98], wave: [0.3, 1.45, 0.58, 1.75, 0.66, 2.1] }[pose];
    skin(back);
    a.box(o.shirt || C.yellow, -0.36, 0.88, 0.72, 0.68, 0.14); a.box(C.cream, -0.06, 1.25, 0.12, 0.28, 0.04);
    skin(front);
    if (pose === 'cross') skin(back);
    a.box(C.skin, -0.09, 1.5, 0.18, 0.2);
    const hx = 0, hy = 1.98, r = 0.42;
    a.disc(C.skin, -0.4, hy - 0.02, 0.09); a.disc(C.skin, 0.4, hy - 0.02, 0.09);
    a.disc(C.skin, hx, hy, r);
    a.clip((p) => p.ellipse(hx, hy + 0.02, r + 0.03, r + 0.03, 0, 0, 7), () => { a.path(C.navy, (p) => { p.moveTo(-0.6, hy + 0.1); p.lineTo(-0.3, hy + 0.2); p.lineTo(-0.1, hy + 0.13); p.lineTo(0.15, hy + 0.22); p.lineTo(0.38, hy + 0.12); p.lineTo(0.6, hy + 0.15); p.lineTo(0.6, hy + 0.6); p.lineTo(-0.6, hy + 0.6); }); });
    a.disc(C.navy, -0.18, hy + 0.42, 0.13, 0.08, -0.4);
    face(a, hx, hy - 0.05, r * 0.82, o.mood || 'happy', 1);
    c.restore();
  };
  // an adult woman in a jacket and wrap-around cloth. pose: stand, give, explain, angry, hold, look
  const lady = (a, x, y0, s, o = {}) => {
    const c = a.ctx, k = o.face || 1, pose = o.pose || 'stand'; c.save(); c.translate(x, y0); c.scale(s * k, s);
    const skin = (pts, w = 0.15) => a.line(C.skin, w, (p) => { p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); });
    a.disc(C.navy, -0.16, 0.04, 0.15, 0.07); a.disc(C.navy, 0.18, 0.04, 0.15, 0.07);
    a.path(o.cloth || C.deep, (p) => { p.moveTo(-0.46, 0.04); p.lineTo(-0.38, 1.15); p.lineTo(0.38, 1.15); p.lineTo(0.46, 0.04); });
    a.clip((p) => { p.moveTo(-0.46, 0.04); p.lineTo(-0.38, 1.15); p.lineTo(0.38, 1.15); p.lineTo(0.46, 0.04); }, () => { for (let yy = 0.18; yy < 1.1; yy += 0.24) a.box(o.trim || C.yellow, -0.6, yy, 1.2, 0.05); a.line(o.trim || C.yellow, 0.04, (p) => { p.moveTo(0.18, 0.04); p.lineTo(0.24, 1.15); }); });
    const back = { stand: [-0.38, 1.7, -0.5, 1.15], give: [-0.38, 1.7, -0.5, 1.15], explain: [-0.38, 1.7, -0.52, 1.25, -0.25, 1.15], angry: [-0.38, 1.7, -0.72, 1.95, -0.72, 2.35], hold: [-0.38, 1.7, -0.5, 1.15], look: [-0.38, 1.7, -0.2, 1.42, 0.35, 1.55] }[pose];
    const front = { stand: [0.38, 1.7, 0.5, 1.15], give: [0.38, 1.7, 0.72, 1.4, 1.05, 1.45], explain: [0.38, 1.7, 0.7, 1.55, 0.78, 1.98], angry: [0.38, 1.7, 0.72, 1.95, 0.72, 2.35], hold: [0.38, 1.7, 0.7, 1.4, 0.95, 1.5], look: [0.38, 1.7, 0.6, 1.42, 0.9, 1.55] }[pose];
    skin(back);
    a.box(o.top || C.white, -0.44, 1.08, 0.88, 0.75, 0.16); a.line(C.coral, 0.04, (p) => { p.moveTo(-0.42, 1.14); p.lineTo(0.42, 1.14); }, [0.06, 0.05]);
    skin(front);
    if (pose === 'angry') { a.disc(C.skin, -0.72, 2.38, 0.11); a.disc(C.skin, 0.72, 2.38, 0.11); }
    a.box(C.skin, -0.09, 1.78, 0.18, 0.18);
    const hx = 0, hy = 2.22, r = 0.38;
    a.disc(C.navy, -0.32, hy + 0.2, 0.2);                                  // the bun
    a.disc(C.skin, hx, hy, r);
    a.clip((p) => p.ellipse(hx, hy, r + 0.02, r + 0.02, 0, 0, 7), () => a.path(C.navy, (p) => { p.moveTo(-0.5, hy + 0.05); p.quadraticCurveTo(-0.1, hy + 0.32, 0.05, hy + 0.24); p.quadraticCurveTo(0.3, hy + 0.32, 0.5, hy + 0.08); p.lineTo(0.5, hy + 0.6); p.lineTo(-0.5, hy + 0.6); }));
    a.disc(C.yellow, 0.06, hy - 0.2, 0.04);
    face(a, hx, hy - 0.04, r * 0.85, o.mood || 'happy', 1);
    c.restore();
  };

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
  const stallBack = (a) => {
    a.box('#e9c98a', -4.7, -0.1, 9.4, 3.0, 0.08);                                         // woven cadjan wall
    a.clip((c) => c.roundRect(-4.7, -0.1, 9.4, 3.0, 0.08), () => { for (let j = 0; j < 13; j++) for (let i = 0; i < 40; i++) a.box((i + j) % 2 ? '#dcb36a' : '#efd59c', -4.7 + i * 0.25, -0.1 + j * 0.24, 0.23, 0.22, 0.03); });
    a.box(C.wood, -4.7, 1.6, 9.4, 0.12, 0.03);                                             // a shelf
    [-3.9, -3.2, -2.6, 2.6, 3.3, 4.0].forEach((x, i) => { a.box(i % 2 ? C.clay : C.deep, x - 0.22, 1.72, 0.44, 0.5, 0.12); a.box(C.cream, x - 0.14, 2.2, 0.28, 0.1, 0.03); });
    [-1.2, -0.4, 0.4, 1.2].forEach((x) => { a.disc(C.cream, x, 1.78, 0.32, 0.07); hopper(a, x, 1.8, 0.3); hopper(a, x, 2.02, 0.28); });
  };

  // ---------------------------------------------------------------- the spreads
  // turn = when the page that opens this spread starts to turn; words/at = the ribbon and the moment it rises.
  const RUN = [W(28, 'running'), W(28, 'home') + 0.25];            // the pull tab: Andare runs home
  const pulled = (t) => K.seg(t, RUN[0], RUN[1], K.ease.inOut);
  const SPREADS = [
    { // ------------------------------------------------------------ 0. cover: hoppers on the fire
      turn: -1.03, words: ['Little Hoppers', 'for Little Andare'], at: null,
      floor(a) {
        floorBase(a, '#f4dfa6');
        scatter(a, 4, 30, (x, y, r) => (r.chance(0.6) ? hopperTop(a, x, y, r.range(0.22, 0.34)) : leaf(a, x, y, 0.5, r.range(0, 6.3), r.pick([C.leaf, C.sage]))));
      },
      parts: [
        { id: 'back', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { villageBack(a, { sunX: 0.9, houses: [[-1.8, 1.1, 0.75], [2.1, 1.0, 0.7]] }); } },
        { fold: 'box', on: 'back', span: [-4.6, -2.4], depth: 1.35, strap: 0.75, height: 2.2, art(a) { grass(a, -4.55, -2.45, 0.3, C.deep, 3); palm(a, -3.6, 0.1, 1.45, 0.35, 0.95); } },
        { fold: 'box', on: 'back', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.9, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 5); basket(a, 3.55, 0.12, 1.5, 0.75); [3.05, 3.55, 4.05].forEach((x, i) => hopper(a, x, 0.82 + (i === 1 ? 0.12 : 0), 0.32)); } },
        { id: 'fire', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          grass(a, -2.25, 2.25, 0.3, C.deep, 7);
          hearth(a, 0, 0.05, 1.55); smoke(a, -0.45, 1.6, 1); smoke(a, 0.55, 1.75, 0.9);
          hopper(a, -1.75, 0.2, 0.4); hopper(a, 1.75, 0.2, 0.4);
        } },
        { fold: 'float', on: 'fire', side: 1, at: [1.45, 0.9], gap: 0.3, sway: 1, area: [1.0, 0.3, 2.95, 2.95], art(a) { arm(a, [1.45, 0.9, 1.9, 1.2, 2.15, 0.9]); kid(a, 2.2, 0.85, 0.7, { face: -1, pose: 'reach', mood: 'happy' }); } },
      ],
    },
    { // ------------------------------------------------------------ 1. Andare at home, breakfast; his mother and twenty panam
      turn: W(2, 'When') - 1.2, words: ['Andare', 'loves hoppers'], at: W(2, 'hoppers'),
      floor(a) {
        floorBase(a, '#e9c47a');
        a.clip((c) => c.roundRect(-5.42, -3.02, 10.84, 6.04, 0.45), () => { for (let i = -24; i <= 24; i++) a.box(i % 2 ? '#e2b765' : '#efd08f', i * 0.24, -3.1, 0.2, 6.2); for (let j = -14; j <= 14; j += 2) a.box('rgba(176,100,27,0.25)', -5.5, j * 0.22, 11, 0.06); });
        pageNo(a, 1);
      },
      parts: [
        { id: 'wall', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) {
          a.box(C.sky, -4.7, -0.1, 9.4, 3.05, 0.08); a.box('#b9d6cf', -4.7, -0.1, 9.4, 0.7, 0.04);
          a.box(C.wood, -1.6, 1.0, 3.2, 1.8, 0.08); a.box('#fbe7b3', -1.42, 1.15, 2.84, 1.5, 0.04);
          a.clip((c) => c.rect(-1.42, 1.15, 2.84, 1.5), () => { sunDisc(a, 0.75, 2.25, 0.32); palm(a, -0.8, 1.0, 1.1, 0.2, 0.55); a.ridge(C.sage, -1.6, 1.6, (x) => 1.4 + 0.12 * Math.cos(x * 2.1)); });
          a.box(C.wood, -0.05, 1.12, 0.1, 1.55); a.box(C.wood, -1.6, 1.86, 3.2, 0.08);
          a.box(C.wood, 2.4, 1.9, 1.6, 0.85, 0.05); a.box(C.cream, 2.5, 2.0, 1.4, 0.65, 0.03); a.disc(C.coral, 3.2, 2.3, 0.22); a.disc(C.leaf, 3.0, 2.22, 0.14);   // a picture on the wall
          a.box(C.navy, -4.3, -0.1, 1.1, 2.4, [0.5, 0.5, 0, 0]); a.box('#2c4a66', -4.18, -0.1, 0.86, 2.25, [0.42, 0.42, 0, 0]);                  // the doorway
        } },
        { fold: 'box', on: 'wall', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.9, art(a) { a.box(C.wood, -4.5, -0.1, 2.0, 1.0, 0.05); a.box('#6e4526', -4.4, 0.6, 1.8, 0.07); [-4.15, -3.5, -2.85].forEach((x, i) => { a.disc(C.clay, x, 1.25, 0.3, 0.28); a.box(C.clay, x - 0.15, 1.45, 0.3, 0.14, 0.04); a.box('#93401f', x - 0.3, 1.18, 0.6, 0.05); }); a.disc(C.clay, -3.5, 0.32, 0.36, 0.32); } },
        { fold: 'box', on: 'wall', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.8, art(a) { a.path(C.clay, (c) => { c.moveTo(3.1, -0.1); c.lineTo(2.95, 0.6); c.lineTo(4.05, 0.6); c.lineTo(3.9, -0.1); }); [[3.2, 1.0, 2.3], [3.5, 1.35, 0.8], [3.75, 1.05, 1.6]].forEach(([x, y, q]) => leaf(a, 3.5, 0.6, 0.9, q, C.leaf)); a.disc(C.coral, 3.2, 1.35, 0.16); a.disc(C.yellow, 3.85, 1.25, 0.14); a.disc(C.pink, 3.5, 1.6, 0.15); } },
        { id: 'boy', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) { ground(a, -2.2, 2.2); kid(a, -0.35, -0.02, 1.08, { face: -1, pose: 'stand', mood: 'happy' }); } },
        pop(0.82, W(2, 'hoppers'), [4.4, 1.6], (a) => { ground(a, -2.1, 0.2); a.box(C.wood, -2.05, -0.1, 0.12, 0.92); a.box(C.wood, -1.05, -0.1, 0.12, 0.92); a.box(C.coral, -2.15, 0.75, 1.32, 0.16, 0.04); a.disc(C.cream, -1.48, 0.95, 0.62, 0.1); hopper(a, -1.8, 0.98, 0.3); hopper(a, -1.18, 0.98, 0.3); hopper(a, -1.5, 1.12, 0.3); }, 'plate'),
        pop(0.9, W(3, 'mother'), [4.6, 2.9], (a) => { ground(a, 0, 2.2); lady(a, 1.55, -0.02, 0.95, { face: -1, pose: 'give', cloth: C.coral, top: C.pink, trim: C.cream, mood: 'happy' }); }, 'person'),
        pop(0.98, W(3, 'twenty'), [2.0, 2.0], (a) => { ground(a, -0.9, 0.9); arm(a, [0.75, -0.05, 0.95, 0.9, 0.5, 1.28]); [[0.3, 1.38], [0.66, 1.38], [0.3, 1.74], [0.66, 1.74]].forEach(([x, y]) => coin(a, x, y, 0.17, '5')); }, 'coins4'),
      ],
    },
    { // ------------------------------------------------------------ 2. off to the hopper lady; four hoppers
      turn: W(4, 'Andare') - 0.8, words: ['Four', 'hoppers'], at: W(4, 'four'),
      floor(a) {
        floorBase(a, '#ecd8a6');
        a.line('#d9bf83', 0.9, (c) => { c.moveTo(-5.4, -1.8); c.bezierCurveTo(-3, -0.6, -2.5, 0.6, 0, 0.5); c.bezierCurveTo(2.5, 0.4, 3.4, -1.6, 5.4, -1.2); });
        const r = K.rng(12); for (let i = 0; i < 9; i++) { const x = -4.9 + i * 0.55, y = -1.55 + i * 0.17 + (i % 2) * 0.18; a.disc(C.amber, x, y, 0.07, 0.11, 0.6); }
        scatter(a, 13, 18, (x, y, r) => grass(a, x, x + 0.4, 0.15, C.sage, r.int(1, 99)));
        pageNo(a, 2);
      },
      parts: [
        { id: 'road', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { villageBack(a, { sunX: 2.2, sunY: 2.35, houses: [[-2.2, 1.0, 0.7]], palms: [[-4.2, 1.1, 0.2], [-0.9, 1.25, -0.2], [0.8, 1.3, 0.25], [3.6, 1.15, -0.2]], seed: 21 }); } },
        { fold: 'box', on: 'road', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.9, art(a) { grass(a, -4.55, -2.45, 0.25, C.deep, 33); house(a, -3.5, 1.5, 1.05); } },
        { fold: 'box', on: 'road', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 35); palm(a, 3.5, 0.1, 1.5, -0.3, 0.9); } },
        { id: 'stall', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          stallRoof(a, -1.3, 2.25, 2.25);
          lady(a, 0.55, 0.15, 0.9, { face: -1, pose: 'stand', mood: 'happy' });
          counter(a, -1.2, 2.15, 1.05); hearth(a, 1.35, 1.0, 0.5); hearth(a, 0.3, 1.0, 0.45, false); smoke(a, 1.35, 1.55, 0.6);
        } },
        { fold: 'float', on: 'stall', side: -1, at: [-1.6, 0.8], gap: 0.32, sway: 1, area: [-2.95, 0.2, -1.3, 2.75], art(a) { arm(a, [-1.6, 0.8, -1.9, 0.45, -2.2, 0.55]); kid(a, -2.25, 0.5, 0.8, { face: 1, pose: 'reach', mood: 'happy' }); coin(a, -1.5, 1.6, 0.13, '5'); } },
        pop(0.85, W(4, 'four'), [4.6, 2.0], (a) => { ground(a, -0.2, 2.2); arm(a, [1.9, -0.05, 2.1, 0.8, 1.6, 1.25]); leafPlate(a, 1.05, 1.28, 1.6); [0.55, 0.88, 1.21, 1.54].forEach((x, i) => hopper(a, x, 1.3 + (i % 2) * 0.05, 0.24)); }, 'hoppers4'),
      ],
    },
    { // ------------------------------------------------------------ 3. the hoppers that came out too small, sold to Andare
      turn: W(5, 'Sometimes') + 0.05, words: ['Too', 'small'], at: W(5, 'small'),
      floor(a) {
        floorBase(a, '#cfe0b4');
        scatter(a, 41, 16, (x, y, r) => { a.path(C.leaf, (c) => c.ellipse(x, y, 0.75, 0.3, r.range(-0.4, 0.4), 0, 7)); a.line(C.sage, 0.04, (c) => { c.moveTo(x - 0.65, y); c.lineTo(x + 0.65, y); }); hopperTop(a, x + 0.15, y + 0.05, 0.13); });
        pageNo(a, 3);
      },
      parts: [
        { id: 'shop', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { stallBack(a); } },
        { fold: 'box', on: 'shop', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.9, art(a) { basket(a, -3.5, -0.08, 1.7, 0.8); [-4.0, -3.5, -3.0, -3.75, -3.25].forEach((x, i) => hopper(a, x, i < 3 ? 0.7 : 0.92, 0.34)); } },
        { fold: 'box', on: 'shop', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.05, art(a) { lady(a, 3.5, -0.02, 0.72, { face: -1, pose: 'hold', cloth: C.navy, top: C.sky, trim: C.coral, mood: 'happy' }); leafPlate(a, 2.85, 1.12, 0.6); hopper(a, 2.85, 1.12, 0.26); } },
        { id: 'tray', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          lady(a, -0.7, 0.2, 0.95, { face: 1, pose: 'look', mood: 'look' });
          counter(a, -2.2, 2.2, 1.0); hearth(a, -1.6, 0.95, 0.45); hopper(a, -0.75, 1.0, 0.34); hopper(a, -0.05, 1.0, 0.34); hopper(a, -0.4, 1.2, 0.34);
        } },
        pop(0.82, W(5, 'small'), [4.4, 2.0], (a) => { ground(a, -0.3, 1.0); arm(a, [0.6, -0.05, 0.25, 0.8, 0.7, 1.28]); a.box(C.wood, 0.3, 1.18, 1.0, 0.1, 0.04); [0.42, 0.61, 0.8, 0.99, 1.18, 0.52, 0.71, 0.9, 1.09].forEach((x, i) => hopper(a, x, i < 5 ? 1.3 : 1.42, 0.11)); }, 'tiny'),
        pop(0.9, W(7, 'sold'), [4.6, 2.6], (a) => { ground(a, 0.8, 2.25); kid(a, 1.7, -0.02, 0.88, { face: -1, pose: 'hold', mood: 'happy' }); leafPlate(a, 1.2, 1.18, 0.5); [1.08, 1.2, 1.32].forEach((x) => hopper(a, x, 1.2, 0.08)); }, 'person'),
      ],
    },
    { // ------------------------------------------------------------ 4. days go by: a grudge, and a plan
      turn: W(8, 'For') - 0.05, words: ['A quiet', 'grudge'], at: W(8, 'grudge'),
      floor(a) {
        floorBase(a, '#d7e2dd');
        for (let k = 0; k < 7; k++) { const x = -4.6 + k * 1.5, y = 1.9 - Math.abs(k - 3) * 0.25; if (k % 2) moon(a, x, y, 0.22); else sunDisc(a, x, y, 0.18); }
        scatter(a, 51, 16, (x, y, r) => a.disc(r.pick([C.cream, C.sage]), x, y, 0.06));
        pageNo(a, 4);
      },
      parts: [
        { id: 'sky', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) {
          a.box('#f3d8a8', -4.7, -0.1, 9.4, 3.0, 0.08);
          a.line(C.cream, 0.08, (c) => { c.moveTo(-4.3, 1.6); c.quadraticCurveTo(0, 3.6, 4.3, 1.6); }, [0.12, 0.12]);
          [[-3.6, 'sun'], [-2.15, 'moon'], [-0.75, 'sun'], [0.75, 'moon'], [2.15, 'sun'], [3.6, 'moon']].forEach(([x, k]) => { const y = 1.6 + 2.0 * (1 - (x / 4.3) ** 2) * 0.5 + 0.1; if (k === 'sun') sunDisc(a, x, y, 0.3); else { a.disc(C.navy, x, y, 0.42); moon(a, x, y, 0.3); } });
          villageBack(a, { sun: false, palms: [[-4.1, 0.9, 0.2], [4.0, 1.0, -0.2]], houses: [], seed: 55 });
        } },
        { fold: 'box', on: 'sky', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.05, art(a) { stallRoof(a, -4.4, -2.65, 1.25); counter(a, -4.35, -2.7, 0.6); lady(a, -3.5, 0.55, 0.42, { face: 1, pose: 'stand', mood: 'happy' }); counter(a, -4.35, -2.7, 0.6); } },
        { fold: 'box', on: 'sky', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.0, art(a) { grass(a, 2.55, 4.55, 0.25, C.deep, 57); palm(a, 3.6, 0.1, 1.45, -0.25, 0.85); } },
        { id: 'boy', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) { grass(a, -2.2, 2.2, 0.28, C.deep, 59); kid(a, -0.6, 0.05, 1.08, { face: 1, pose: 'cross', mood: 'grumpy' }); leafPlate(a, -1.75, 0.18, 0.7); [-1.93, -1.75, -1.57].forEach((x) => hopper(a, x, 0.2, 0.09)); } },
        pop(0.82, W(9, 'tiny'), [4.6, 2.95], (a) => { ground(a, 0.5, 2.25); arm(a, [2.0, -0.05, 2.3, 1.2, 1.75, 2.0]); a.disc(C.white, 0.15, 2.22, 0.09); a.disc(C.white, 0.42, 2.38, 0.12); cloud(a, 1.32, 2.48, 1.05); hopper(a, 1.15, 2.4, 0.2); a.text('?', 1.65, 2.32, 0.42, C.coral); }, 'thought'),
        pop(0.9, W(10, 'lesson'), [4.4, 2.9], (a) => { ground(a, 1.2, 2.2); arm(a, [2.05, -0.05, 2.35, 1.4, 1.95, 2.48]); burst(a, 1.95, 2.62, 0.3, C.yellow); coin(a, 1.95, 2.62, 0.16, '1'); }, 'idea'),
      ],
    },
    { // ------------------------------------------------------------ 5. four tiny hoppers again: "why so tiny?"
      turn: W(11, 'Sure') - 0.15, words: ['Why so', 'tiny?'], at: W(12, 'tiny'),
      floor(a) {
        floorBase(a, '#ecd8a6');
        scatter(a, 61, 22, (x, y, r) => (r.chance(0.5) ? grass(a, x, x + 0.4, 0.15, C.sage, r.int(1, 99)) : a.disc(C.amber, x, y, 0.07, 0.11, r.range(0, 3))));
        pageNo(a, 5);
      },
      parts: [
        { id: 'road', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { villageBack(a, { sunX: -1.6, sunY: 2.3, houses: [[2.4, 1.0, 0.7]], seed: 62 }); } },
        { fold: 'box', on: 'road', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { grass(a, -4.55, -2.45, 0.25, C.deep, 63); palm(a, -3.5, 0.1, 1.5, 0.3, 0.9); } },
        { fold: 'box', on: 'road', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.8, art(a) { basket(a, 3.55, -0.08, 1.5, 0.7); [3.1, 3.55, 4.0].forEach((x) => hopper(a, x, 0.68, 0.3)); } },
        { id: 'stall', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          stallRoof(a, -2.25, 0.95, 2.25);
          lady(a, -0.75, 0.15, 0.92, { face: 1, pose: 'give', mood: 'sly' });
          counter(a, -2.2, 0.75, 1.05); hearth(a, -1.55, 1.0, 0.48);
          kid(a, 1.55, -0.02, 0.9, { face: -1, pose: 'reach', mood: 'ask' });
        } },
        pop(0.84, W(11, 'four'), [2.6, 2.0], (a) => { ground(a, -0.2, 0.9); arm(a, [0.85, -0.05, 1.05, 0.7, 0.55, 1.3]); leafPlate(a, 0.42, 1.34, 0.62); [0.24, 0.36, 0.48, 0.6].forEach((x) => hopper(a, x, 1.36, 0.08)); }, 'tiny4'),
        pop(0.92, W(12, 'Auntie'), [4.6, 2.95], (a) => { ground(a, 1.6, 2.25); arm(a, [2.2, -0.05, 2.35, 1.5, 2.1, 2.3]); bubble(a, 1.5, 2.58, 0.75, 0.55, 1.55, 2.12, '?'); }, 'speech'),
      ],
    },
    { // ------------------------------------------------------------ 6. "you're small": easier to eat, lighter to carry
      turn: W(14, 'The') - 1.0, words: ["You're", 'small'], at: W(14, 'small'),
      floor(a) {
        floorBase(a, '#f2cfc0');
        scatter(a, 71, 26, (x, y, r) => hopperTop(a, x, y, r.chance(0.5) ? 0.3 : 0.1));
        pageNo(a, 6);
      },
      parts: [
        { id: 'shop', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { stallBack(a); } },
        { fold: 'box', on: 'shop', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.6, art(a) { hearth(a, -3.5, -0.08, 0.95); smoke(a, -3.5, 0.9, 0.7); } },
        { fold: 'box', on: 'shop', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.8, art(a) { basket(a, 3.55, -0.08, 1.6, 0.8); [3.05, 3.55, 4.05].forEach((x, i) => hopper(a, x, 0.78 + (i === 1 ? 0.1 : 0), 0.34)); } },
        { id: 'talk', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.2, 2.2);
          lady(a, -0.65, -0.02, 1.1, { face: 1, pose: 'explain', mood: 'sly' });
          kid(a, 1.45, -0.02, 0.78, { face: -1, pose: 'hold', mood: 'look' }); leafPlate(a, 0.97, 1.0, 0.45); [0.86, 0.97, 1.08].forEach((x) => hopper(a, x, 1.02, 0.07));
        } },
        pop(0.84, W(15, 'eat'), [4.6, 2.6], (a) => { ground(a, 1.2, 2.2); arm(a, [2.0, -0.05, 2.25, 1.3, 1.95, 1.9]); hopper(a, 1.82, 2.0, 0.17); a.disc(C.card, 1.98, 2.15, 0.08); a.disc(C.card, 1.9, 2.18, 0.06); }, 'bite'),
        pop(0.92, W(16, 'lighter'), [4.6, 2.95], (a) => { ground(a, 0.5, 1.4); arm(a, [1.0, -0.05, 0.75, 1.4, 0.82, 2.3]); a.path(C.white, (c) => { c.moveTo(0.62, 2.3); c.quadraticCurveTo(1.15, 2.35, 1.38, 2.92); c.quadraticCurveTo(0.85, 2.85, 0.62, 2.3); }); a.line(C.sky, 0.04, (c) => { c.moveTo(0.6, 2.26); c.quadraticCurveTo(1.05, 2.5, 1.35, 2.9); }); [0.0, 0.16].forEach((d) => a.line(C.navy, 0.03, (c) => { c.moveTo(0.45 - d, 2.5 + d); c.quadraticCurveTo(0.36 - d, 2.65 + d, 0.45 - d, 2.8 + d); })); }, 'feather'),
      ],
    },
    { // ------------------------------------------------------------ 7. "Oh, is that so?" coins into the basket, and off he runs
      turn: W(17, 'Oh') - 1.15, words: ['Coins', 'tossed'], at: W(18, 'coins'),
      floor(a) {
        floorBase(a, '#ecd8a6');
        scatter(a, 81, 20, (x, y, r) => a.disc(C.amber, x, y, 0.07, 0.11, r.range(0, 3)));
        pageNo(a, 7);
      },
      parts: [
        { id: 'road', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { villageBack(a, { sunX: 0.4, sunY: 2.4, houses: [[3.0, 1.0, 0.7]], seed: 82 }); } },
        { fold: 'box', on: 'road', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.1, art(a) { stallRoof(a, -4.45, -2.6, 1.5); counter(a, -4.4, -2.65, 0.75); hearth(a, -3.5, 0.72, 0.5); } },
        { fold: 'box', on: 'road', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 85); palm(a, 3.6, 0.1, 1.5, -0.3, 0.9); } },
        { id: 'stall', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          lady(a, -1.25, 0.15, 0.9, { face: 1, pose: 'stand', mood: 'happy' });
          counter(a, -2.2, 0.6, 1.0); basket(a, -0.4, 0.95, 0.9, 0.45);
          kid(a, 1.55, -0.02, 0.92, { face: -1, pose: 'toss', mood: 'sly' }); leafPlate(a, 1.95, 1.05, 0.5); [1.83, 1.95, 2.07].forEach((x) => hopper(a, x, 1.07, 0.08));
        } },
        pop(0.86, W(18, 'tossing'), [4.6, 2.95], (a) => { ground(a, -0.2, 1.4); arm(a, [1.2, -0.05, 1.35, 1.2, 0.85, 2.15]); a.line(C.navy, 0.035, (c) => { c.moveTo(0.85, 2.0); c.quadraticCurveTo(0.3, 2.65, -0.35, 1.6); }, [0.08, 0.1]); [[0.7, 2.25], [0.35, 2.4], [0.0, 2.3], [-0.28, 1.95]].forEach(([x, y]) => coin(a, x, y, 0.1, '1')); }, 'toss'),
        pop(0.94, W(18, 'running'), [4.6, 1.5], (a) => { ground(a, 1.8, 2.3); [[2.05, 0.25, 0.22], [2.35, 0.38, 0.18], [2.2, 0.55, 0.13]].forEach(([x, y, r]) => a.disc('#e3cf9f', x, y, r)); a.box('#e3cf9f', 1.9, -0.05, 0.4, 0.3); }, 'dust'),
      ],
    },
    { // ------------------------------------------------------------ 8. the basket: one-panam coins, not five
      turn: W(19, 'The') - 1.2, words: ['1 panam', 'not 5'], at: W(20, 'one-panam'),
      floor(a) {
        floorBase(a, '#e9c47a');
        a.clip((c) => c.roundRect(-5.42, -3.02, 10.84, 6.04, 0.45), () => { for (let i = -24; i <= 24; i++) a.box(i % 2 ? '#e2b765' : '#efd08f', i * 0.24, -3.1, 0.2, 6.2); });
        pageNo(a, 8);
      },
      parts: [
        { id: 'shop', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { stallBack(a); } },
        { fold: 'box', on: 'shop', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 1.6, art(a) { hearth(a, -3.5, -0.08, 0.95); } },
        { fold: 'box', on: 'shop', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 1.8, art(a) { a.box(C.wood, 2.7, -0.1, 1.7, 0.75, 0.05); [3.1, 3.55, 4.0].forEach((x) => hopper(a, x, 0.72, 0.3)); } },
        { id: 'basket', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          lady(a, -0.2, 0.25, 0.95, { face: 1, pose: 'look', mood: 'look' });
          ground(a, -2.2, 2.2); basket(a, 0, -0.08, 2.6, 1.45);
        } },
        pop(0.84, W(20, 'five-panam'), [4.6, 2.95], (a) => { ground(a, 0.9, 2.25); arm(a, [1.9, -0.05, 2.3, 1.5, 1.55, 2.1]); cloud(a, 1.3, 2.52, 1.25); [0.72, 1.12, 1.52, 1.92].forEach((x, i) => coin(a, x, 2.52 + (i % 2) * 0.06, 0.2, '5', true)); }, 'ghost'),
        pop(0.92, W(20, 'one-panam'), [2.6, 2.0], (a) => { ground(a, -1.0, 1.0); arm(a, [-0.9, -0.05, -1.05, 0.9, -0.55, 1.46]); [-0.5, -0.17, 0.16, 0.49].forEach((x, i) => coin(a, x, 1.5 + (i % 2) * 0.05, 0.14, '1')); }, 'reveal'),
      ],
    },
    { // ------------------------------------------------------------ 9. she was furious: "Stop right there, Andare!"
      turn: W(21, 'She') - 0.66, words: ['Stop,', 'Andare!'], at: W(22, 'Stop'),
      floor(a) {
        floorBase(a, '#f1c3b0');
        scatter(a, 91, 22, (x, y, r) => burst(a, x, y, r.range(0.12, 0.22), r.pick(['#e9a48f', C.coral, C.yellow])));
        pageNo(a, 9);
      },
      parts: [
        { id: 'road', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { a.box('#f6cdb0', -4.7, 1.0, 9.4, 2.2, 0.08); villageBack(a, { sunX: -2.4, sunY: 2.3, houses: [[3.2, 1.0, 0.7]], seed: 92 }); } },
        { fold: 'box', on: 'road', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.05, art(a) { stallRoof(a, -4.45, -2.6, 1.45); counter(a, -4.4, -2.65, 0.75); basket(a, -3.5, 0.72, 0.8, 0.4); } },
        { fold: 'box', on: 'road', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.1, art(a) { grass(a, 2.55, 4.55, 0.28, C.deep, 95); palm(a, 3.5, 0.1, 1.5, 0.25, 0.9); } },
        { id: 'angry', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          ground(a, -2.2, 2.2);
          lady(a, -0.7, -0.02, 1.0, { face: 1, pose: 'angry', mood: 'angry' });
          kid(a, 1.85, 0.1, 0.5, { face: 1, pose: 'run', mood: 'happy' }); leafPlate(a, 2.2, 0.85, 0.3);
          [[1.25, 0.45], [1.05, 0.5]].forEach(([x, y]) => a.line(C.navy, 0.035, (c) => { c.moveTo(x, y); c.lineTo(x + 0.3, y); }));
        } },
        pop(0.84, W(21, 'furious'), [4.6, 2.95], (a) => { ground(a, -1.6, 0.2); arm(a, [-0.3, -0.05, 0.25, 1.4, -0.15, 2.6]); burst(a, -0.2, 2.65, 0.28); burst(a, -1.25, 2.55, 0.22); burst(a, 0.35, 2.15, 0.18, C.yellow); a.line(C.coral, 0.07, (c) => { c.moveTo(-0.95, 2.6); c.lineTo(-0.45, 2.7); }); }, 'burst'),
        pop(0.92, W(24, 'tiny'), [2.6, 2.95], (a) => { ground(a, -0.6, 0.6); arm(a, [0.4, -0.05, 0.7, 1.6, 0.25, 2.55]); [0.0, 0.2, 0.4, 0.6].forEach((x, i) => coin(a, x - 0.1, 2.62 + (i % 2) * 0.08, 0.1, '1')); }, 'tinycoins'),
      ],
    },
    { // ------------------------------------------------------------ 10. the reply, and the run home (pull tab)
      turn: W(26, 'When') - 1.15, words: ['Easy', 'to keep'], at: W(27, 'keep'),
      floor(a) {
        floorBase(a, '#f3d9a0');
        a.line('#e2c27f', 1.0, (c) => { c.moveTo(-5.4, 1.2); c.bezierCurveTo(-2.4, 0.2, -1.5, -0.6, 0.6, -0.5); c.bezierCurveTo(2.6, -0.4, 3.6, 0.8, 5.4, 1.4); });
        for (let i = 0; i < 12; i++) a.disc(C.amber, -4.7 + i * 0.85, 0.6 - Math.sin(i * 0.33) * 1.1 + (i % 2) * 0.18, 0.07, 0.11, -0.3);
        pageNo(a, 10);
        a.box(C.navy, 0.9, -2.66, 3.1, 0.075, 0.035);                                        // the slot the pull tab runs in
      },
      parts: [
        { id: 'dusk', fold: 'v', z: -1.0, alpha: 76, size: [9.6, 3.2], art(a) { a.box(C.dusk, -4.7, 0.9, 9.4, 2.3, 0.08); villageBack(a, { sunX: -0.4, sunY: 1.6, houses: [[-2.0, 0.9, 0.62, true], [1.6, 0.9, 0.62, true]], seed: 102 }); } },
        { fold: 'box', on: 'dusk', span: [-4.6, -2.4], depth: 1.35, strap: 0.7, height: 2.05, art(a) { stallRoof(a, -4.45, -2.55, 1.5); lady(a, -3.5, 0.3, 0.58, { face: 1, pose: 'hold', mood: 'grumpy' }); counter(a, -4.4, -2.6, 0.75); [-2.95, -2.8].forEach((x) => coin(a, x, 1.25, 0.07, '')); } },
        { fold: 'box', on: 'dusk', span: [2.5, 4.6], depth: 1.2, strap: 0.7, height: 2.0, art(a) { grass(a, 2.55, 4.55, 0.25, C.deep, 105); palm(a, 3.7, 0.1, 1.45, -0.25, 0.85); } },
        { id: 'home', fold: 'v', z: 0.7, alpha: 58, size: [4.8, 2.95], art(a) {
          grass(a, -2.2, 2.2, 0.28, C.deep, 107);
          house(a, 1.25, 1.9, 1.65, { glow: true });
          for (let x = -2.1; x < -0.15; x += 0.32) a.box(C.wood, x, -0.1, 0.1, 0.75, [0.05, 0.05, 0, 0]); a.box(C.wood, -2.15, 0.45, 2.05, 0.08);
          [-1.8, -1.0, -0.4].forEach((x, i) => { a.disc([C.coral, C.yellow, C.pink][i], x, 0.95, 0.13); a.line(C.deep, 0.05, (c) => { c.moveTo(x, 0.82); c.lineTo(x, 0.1); }); });
        } },
        { fold: 'v', z: 0.86, alpha: 58, size: [4.6, 2.6], slide: (t) => -2.85 * pulled(t), art(a) { ground(a, -1.9, 0.2); kid(a, -0.95, 0.1, 0.95, { face: 1, pose: 'run', mood: 'happy' }); leafPlate(a, -0.12, 1.42, 0.5); [-0.24, -0.12, 0].forEach((x) => hopper(a, x, 1.44, 0.08)); [[-1.95, 0.55], [-2.1, 0.8], [-1.9, 1.05]].forEach(([x, y]) => a.line(C.navy, 0.035, (c) => { c.moveTo(x, y); c.lineTo(x + 0.35, y); })); } },
        { fold: 'v', z: 0.94, alpha: 58, size: [4.6, 2.6], slide: (t) => -2.85 * (1 - pulled(t)), art(a) { ground(a, 0.6, 2.2); kid(a, 1.25, -0.02, 0.82, { face: -1, pose: 'wave', mood: 'eat' }); hopper(a, 0.82, 1.08, 0.13); } },
      ],
    },
  ];
  const TURNS = SPREADS.map((s) => s.turn);
  // the storyboard: which frame stands for each beat
  const BOARD = [
    { t: 3.2, beats: [1], text: "Ribbon: \"Little Hoppers | for Little Andare\"", note: 'The book is open on the desk. The cover spread pulls the hopper pan and fire up out of the gutter; little Andare peeks in on a paper arm. The title ribbon is already standing.', cam: 'Opens close and low on the left of the spread, drifting right.', sound: 'Page lands (slap, thud, card creaks), a soft ding; fire crackle under the narration.' },
    { t: 9.4, beats: [2], text: "Ribbon: \"Andare | loves hoppers\"", note: 'Page turns: the cover is pressed flat and Andare\'s home rises. On "hoppers" a little table with a plate of hoppers comes up through a slit, then the ribbon rises.', cam: 'Breathes out for the turn, then drifts back right to left.', sound: 'Page turn rustle and whoosh; tape-pull and pop for the table; paper tick for the ribbon.' },
    { t: 14.0, beats: [3], text: "Ribbon: \"Andare | loves hoppers\"; four coins stamped \"5\"", note: 'Same spread: his mother rises on "mother", then four 5-panam coins on a paper arm on "twenty panam".', cam: 'Keeps drifting left across the room.', sound: 'Pop for mother; four small coin chinks on "twenty".' },
    { t: 21.1, beats: [4], text: "Ribbon: \"Four | hoppers\"; a \"5\" coin in Andare's hand", note: 'Page turns to the village road and the hopper stall. Andare walks over on a paper arm, a coin in hand. On "four" four hoppers on a banana leaf pop up and the ribbon "Four hoppers" rises.', cam: 'Breathes out for the turn, drifts left to right toward the stall.', sound: 'Page turn; hearth crackle; pop for the leaf of hoppers.' },
    { t: 30.6, beats: [5, 6, 7], text: "Ribbon: \"Too | small\"", note: 'Page turns to the counter. On "small" a tray of tiny hoppers rises next to the big ones. On "sold" Andare pops up holding three tiny hoppers.', cam: 'Drifts right to left along the counter.', sound: 'Page turn; little tick-pops for the tray; pop for Andare.' },
    { t: 49.9, beats: [8, 9, 10], text: "Ribbon: \"A quiet | grudge\"; \"?\" in the cloud; a coin stamped \"1\"", note: 'Page turns: suns and moons cross the sky (a few days). Andare stands with arms crossed. "A quiet grudge" rises on "grudge"; a thought cloud with a tiny hopper on "tiny"; a bright idea (a tiny 1-panam coin) on "lesson".', cam: 'Slow drift left to right toward the thought cloud.', sound: 'Page turn; soft pop for the cloud; a sparkle for the idea.' },
    { t: 60.6, beats: [11, 12, 13], text: "Ribbon: \"Why so | tiny?\"; \"?\" in the speech bubble", note: 'Page turns back to the stall. On "four" her hand holds four tiny hoppers out; on "Auntie" a "?" speech bubble pops up; the ribbon "Why so tiny?" on "tiny".', cam: 'Drifts right to left between the two of them.', sound: 'Page turn; pop; a light blip for the question.' },
    { t: 75.6, beats: [14, 15, 16], text: "Ribbon: \"You're | small\"", note: 'Page turns: the lady explains, finger up, sly smile; Andare small beside her. Ribbon "You\'re small" on "small". A bitten tiny hopper on "eat", a feather floats up on "lighter".', cam: 'Drifts left to right.', sound: 'Page turn; pop; airy swish for the feather.' },
    { t: 85.3, beats: [17, 18], text: "Ribbon: \"Coins | tossed\"; coins stamped \"1\"", note: 'Page turns: the basket sits on the counter. On "tossing" four coins arc from Andare\'s hand into it; "Coins tossed" ribbon on "coins"; dust puffs as he runs off on "running".', cam: 'Drifts right to left, from Andare to the basket.', sound: 'Page turn; four coin chinks into the basket; a whoosh for the run.' },
    { t: 95.6, beats: [19, 20], text: "Ribbon: \"1 panam | not 5\"; ghost coins \"5\"; coins \"1\"", note: 'Page turns: the big basket, the lady peering in. On "five-panam" a thought cloud of four ghost 5-panam coins; on "one-panam" four tiny 1-panam coins rise in the basket and the ribbon "1 panam, not 5".', cam: 'Drifts left to right and settles on the basket.', sound: 'Page turn; airy pop for the ghost coins; a deep press and a falling two-note for the 1-panam coins.' },
    { t: 105.5, beats: [21, 22, 23, 24, 25], text: "Ribbon: \"Stop, | Andare!\"; coins \"1\"", note: 'Page turns: she is furious, fists up; anger bursts pop on "furious"; ribbon "Stop, Andare!" on "Stop"; four tiny coins in her fist on "tiny coins". Andare is a small figure running off on the right.', cam: 'Drifts right to left.', sound: 'Page turn; a stamp on "furious"; small chinks for the coins.' },
    { t: 118.4, beats: [26, 27, 28], text: "Ribbon: \"Easy | to keep\"", note: 'Page turns to the road home at dusk. Ribbon "Easy to keep" on "keep". The pull tab slides out on "running ... home": the running Andare sinks into the page and Andare at his own door, eating a hopper, rises. Last second holds here.', cam: 'Ends in a gentle push in on the house.', sound: 'Page turn; tape-pull for the tab, a two-note success when he is home.' },
  ];
  const ASSUMPTIONS = [
    'Twenty panam is four 5-panam coins: line 20 says she expected "four five-panam coins", so the coins mother gives and Andare normally pays are drawn as four coins stamped "5". That makes each hopper 5 panam.',
    'Andare paid with four 1-panam coins, so he paid 4 panam instead of 20.',
    'Setting: a Sri Lankan village. Hoppers (appa) are cooked one at a time in a small round pan over a wood fire, and look like bowls with crisp lacy edges and a soft middle.',
    'Andare is drawn as a small boy (about 8) in a yellow shirt and shorts; the hopper lady in a white jacket and a wrap-around cloth; his mother in pink and coral.',
    'Word times are estimated from each word\'s position in its line, since I only had line times. Real word timestamps can go into BEATS[n].words.',
    'Each beat\'s ribbon (and each pop-up piece) rises through a slit in the page on the word it shows, as if a hidden tab were pulled. This bends the reference\'s "only the pages move" a little, so pictures can land on words in a 2-minute story.',
  ];

  // ---------------------------------------------------------------- the book's clock (picture and sound both read it)
  const flip = (t, t0) => { const u = (t - t0) / TURN; if (u <= 0) return 0; if (u < 1) return Math.PI * u * u * (2.2 - 1.2 * u); const v = t - t0 - TURN; return Math.PI - 0.034 * Math.abs(Math.sin(v * 11)) * Math.exp(-v * 6); };
  const landed = (s) => TURNS[s] + TURN;

  registerStyle({
    id: 'paper-pop-up-andare',
    name: 'Paper Pop-Up',
    family: 'Material worlds',
    look: 'A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.',
    motion: 'The pages turn; the old spread is pressed flat and the next one is pulled up out of the gutter by its folds. Pieces on paper arms tremble when the page lands. Small pieces come up through slits on the word they show, and a pull tab sends Andare home on the last spread.',
    light: 'One warm desk lamp from the upper left with soft-edged shadows; a faint cool rim from behind; the table falls off into the dark.',
    materials: 'Thick uncoated card with visible fibre and a slight cockle, flat matt ink with a little grain, bare cream card on cut edges, cloth-covered boards, dark oiled wood.',
    camera: 'A long lens looking down the gutter from about twenty-five degrees up, the spread filling the frame. A slow drift across each spread that breathes out for each page turn and ends in a gentle push; shallow focus on the middle layers.',
    post: 'Real depth of field, motion blur and area-light shadows; neutral tone mapping, a soft vignette, very fine grain.',
    explains: 'A folk tale in eleven spreads.',
    topic: 'Little Hoppers for Little Andare',
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
            const q = dt > 0 ? 0.085 * (o.sway || 0) * Math.sin(dt * 21) * Math.exp(-dt * 2.4) : 0, X = add(mul(w.X, Math.cos(q)), w.Y, Math.sin(q)), Y = add(mul(w.Y, Math.cos(q)), w.X, -Math.sin(q));
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
      const endpaper = (a) => { a.box(C.yellow, -5.7, -3.3, 11.4, 6.6); for (let i = -9; i <= 9; i++) for (let j = -5; j <= 5; j++) hopperTop(a, i * 0.66, j * 0.66 + (i & 1 ? 0.33 : 0), 0.2); };
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
      // a cup of plain tea, as you would have with hoppers
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
      k.music('pad', 0, DUR, { bpm: 72, chords: [['F3', 'A3', 'C4', 'E4'], ['D3', 'F3', 'A3', 'C4'], ['Bb2', 'D3', 'F3', 'A3'], ['C3', 'E3', 'G3', 'Bb3']], gain: 0.45 });
      // the fire on the cover: soft crackle
      k.withMinor(() => { const r = K.rng(77); for (let x = 0.3; x < TURNS[1]; x += 0.09 + r() * 0.25) k.noise(x, { dur: 0.02, filter: 'bandpass', f: 1800 + r() * 2500, q: 1.5, gain: 0.05 + r() * 0.06, pan: r() * 0.6 - 0.3 }); });
      const NOTES = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5', 'C5'];
      TURNS.forEach((t0, s) => {
        const hit = landed(s);
        if (t0 > 0) { k.play('paper', t0 + 0.02, { gain: 1.4, dur: 0.5, pan: 0.4 }); k.play('whoosh', t0 + 0.3, { gain: 0.55, dur: 0.8, top: 1500 }); k.play('paper', t0 + 0.5, { gain: 0.9, dur: 0.7 }); }
        k.withMinor(() => { for (let i = 0; i < 7; i++) if (hit - 0.62 + i * 0.085 > 0) k.play('tick', hit - 0.62 + i * 0.085, { gain: 0.45 + 0.06 * i, f: 1900 + i * 260, pan: -0.3 + i * 0.1 }); });   // card creaking upright
        if (hit > 0) { k.play('slap', hit, { gain: 0.6, pan: -0.3 }); k.play('thud', hit, { gain: 0.5, f: 105, pan: -0.3 }); k.play('paper', hit + 0.04, { gain: 0.45, dur: 0.22 }); }
        k.play('ding', Math.max(0.05, hit + 0.14), { gain: 0.26, f: NOTES[s % NOTES.length] });
        k.withMinor(() => { for (let i = 0; i < 4; i++) if (hit + 0.19 > 0) k.play('tick', hit + 0.19 + i * 0.3, { gain: 0.14 - 0.03 * i, f: 5200, pan: 0.2 }); });   // pieces trembling on their arms
      });
      const chink = (t, i = 0, g = 1) => { k.tone(t, { f: 2600 + 380 * (i % 3), dur: 0.35, gain: 0.07 * g, verb: 0.2, pan: 0.1 * i }); k.tone(t, { f: (2600 + 380 * (i % 3)) * 2.4, dur: 0.15, gain: 0.03 * g, pan: 0.1 * i }); k.play('tick', t, { gain: 0.4 * g, f: 5800 }); };
      REVEALS.forEach(({ at, kind }) => {
        const t = at - 0.3;                                                     // the piece breaks the page here
        k.withMinor(() => { k.play('tape', t, { gain: 0.6, dur: 0.32, pan: 0.15 }); k.play('tick', at + 0.15, { gain: 0.35, f: 3000 }); });
        if (kind === 'ribbon') k.withMinor(() => { k.play('paper', t, { gain: 0.5, dur: 0.3 }); k.play('tock', at + 0.15, { gain: 0.35, f: 640 }); });
        else if (kind === 'coins4' || kind === 'tinycoins') k.withMinor(() => { for (let i = 0; i < 4; i++) chink(at + i * 0.09, i, kind === 'tinycoins' ? 0.7 : 1); });
        else if (kind === 'toss') { for (let i = 0; i < 4; i++) chink(at + 0.25 + i * 0.11, i, 0.9); k.play('swish', at - 0.05, { gain: 0.6 }); }
        else if (kind === 'dust') k.play('whoosh', at - 0.1, { gain: 0.55, dur: 0.6, pan: 0.5 });
        else if (kind === 'feather') k.play('swish', at - 0.1, { gain: 0.5, dur: 0.5 });
        else if (kind === 'idea') k.play('sparkle', at, { gain: 0.8, n: 5 });
        else if (kind === 'speech') k.play('blip', at, { gain: 0.7, f: 'A5' });
        else if (kind === 'ghost') k.play('riser', at - 0.4, { gain: 0.4, dur: 0.6 });
        else if (kind === 'reveal') { k.play('press', at + 0.1, { gain: 0.8 }); k.tone(at + 0.25, { f: 'E5', dur: 0.4, gain: 0.12, verb: 0.3 }); k.tone(at + 0.5, { f: 'C5', dur: 0.8, gain: 0.12, verb: 0.3 }); for (let i = 0; i < 4; i++) chink(at + 0.12 + i * 0.07, i, 0.6); }
        else if (kind === 'burst') k.play('stamp', at, { gain: 1.0 });
        else k.play('pop', at + 0.12, { gain: 0.55, f: kind === 'person' ? 480 : 640, minor: kind !== 'person' });
      });
      // the pull tab: Andare runs home
      k.play('tape', RUN[0], { gain: 1.2, dur: RUN[1] - RUN[0], pan: 0.4 }); k.play('paper', RUN[0], { gain: 0.7, dur: 0.7, pan: 0.4 });
      k.play('tock', RUN[1], { gain: 0.55, f: 500, pan: 0.4 }); k.play('success', RUN[1] + 0.12, { gain: 0.6, f: 'C6' });
      k.play('ding', BEATS[BEATS.length - 1].t[1] + 0.15, { gain: 0.3, f: 'G5' });
    },
  });
}
