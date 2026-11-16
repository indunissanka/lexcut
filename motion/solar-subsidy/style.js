{
  // ================================================================ content (change this block for a new take or topic)
  const ACCENT = '#ff6a00';   // the ONE colour. It only ever means "the subsidy": money the budget sends to homes.

  // BEATS: one entry per idea, timed from the voiceover subtitles (sri_lanka_solar_budget_news_sinhala_updated.srt).
  //   s / e  the subtitle lines' start and end
  //   w      word times inside the line (the visual for a word lands on it, never after it). Estimated from the word's
  //          position in its subtitle line; drop real word timestamps in here and everything follows.
  //   say    the words spoken (Sinhala, verbatim from the script)
  //   show   what happens on screen
  const BEATS = [
    { id: 'budget', s: 0.0, e: 8.0, say: 'ශ්‍රී ලංකාවේ ගෘහස්ථ සූර්ය බලශක්ති පද්ධති සඳහා නව සහනාධාර යෝජනාවක් 2027 අයවැයෙන් ඉදිරිපත් කර තිබෙනවා. ජනාධිපති අනුර කුමාර දිසානායක මහතා මෙම යෝජනාව පාර්ලිමේන්තුවට ඉදිරිපත් කළා.',
      w: { budget: 2.4, parliament: 6.6 }, show: 'Parliament on its island. The budget book on the steps is already glowing; BUDGET 2027 lands on "2027", PARLIAMENT on "පාර්ලිමේන්තුවට".' },
    { id: 'rooftop', s: 8.0, e: 13.0, say: 'මෙම යෝජනාව යටතේ, අලුතින් වහල මත සූර්ය පද්ධතියක් සවි කරන ගෘහස්ථ පාරිභෝගිකයන්ට සහනාධාරයක් ලැබීමට නියමිතයි.',
      w: { rooftop: 9.6, subsidy: 11.8 }, show: 'The accent leaves the book, crosses the causeway and runs along the road to a house; its new rooftop panels switch on.' },
    { id: 'battery', s: 13.0, e: 20.0, say: 'බැටරි පද්ධතියක් සහිත නව සූර්ය බලශක්ති පද්ධතියක් ස්ථාපනය කරන නිවාස හිමියන්ට රුපියල් 250,000ක් දක්වා රජයේ සහනාධාරයක් ලබා දීමට යෝජනා කර තිබෙනවා.',
      w: { battery: 13.1, amount: 16.8 }, show: 'A branch runs along the wall to the battery rack beside the house. UP TO Rs 250,000 lands on the number.' },
    { id: 'perkwh', s: 20.0, e: 29.0, say: 'බැටරි ගබඩා ධාරිතාව කිලෝවොට් පැයකට, එනම් 1 kWh එකකට රුපියල් 25,000 බැගින් රජයෙන් සහනාධාරයක් ලබා දීමට යෝජනා කර තිබෙනවා.',
      w: { one: 22.6, amount: 23.9 }, show: 'Close on the rack: module 1 lights on "1 kWh"; the readout shows Rs 25,000 on the number.' },
    { id: 'five', s: 29.0, e: 34.0, say: 'ඒ අනුව, 5 kWh බැටරියක් සඳහා රුපියල් 125,000ක සහනාධාරයක් ලැබිය හැකියි.',
      w: { five: 29.9, amount: 31.9 }, show: 'Modules 2-5 light, one tick each; the readout counts up to 5 kWh / Rs 125,000.' },
    { id: 'eight', s: 34.0, e: 39.0, say: '8 kWh බැටරියක් සඳහා රුපියල් 200,000ක සහනාධාරයක් ලැබිය හැකියි.',
      w: { eight: 34.1, amount: 36.0 }, show: 'Modules 6-8 light; 8 kWh / Rs 200,000.' },
    { id: 'ten', s: 39.0, e: 44.0, say: '10 kWh හෝ ඊට වැඩි බැටරි ගබඩා ධාරිතාවක් සඳහා උපරිම සහනාධාරය රුපියල් 250,000ක්.',
      w: { ten: 39.1, more: 39.9, max: 42.2, amount: 43.2 }, show: 'Modules 9-10 light; two more modules drop on top but stay white; a MAX tab slides to 10. Rs 250,000.' },
    { id: 'perhome', s: 44.0, e: 49.0, say: 'එනම්, එක් නිවසකට ලබා දීමට යෝජිත උපරිම සහනාධාරය රුපියල් දෙලක්ෂ පනස්දහසක්.',
      w: { home: 44.9, amount: 47.6 }, show: 'The camera pulls back to the whole house: MAX PER HOME, Rs 250,000.' },
    { id: 'fund', s: 49.0, e: 54.0, say: 'මෙම සහනාධාර වැඩසටහන සඳහා රජය රුපියල් බිලියන 3.5ක් වෙන් කිරීමට යෝජනා කර තිබෙනවා.',
      w: { fund: 51.3 }, show: 'Crane up: the accent runs from the parliament down two back streets and lights a whole neighbourhood of homes. Rs 3.5 BILLION.' },
    { id: 'levy', s: 54.0, e: 64.0, say: 'තවත් සහනයක් ලෙස, සූර්ය බලශක්තිය ගබඩා කිරීමට භාවිත කරන ආනයනික බැටරි සඳහා අය කරන සියයට 10ක වරාය හා ගුවන්තොටුපළ සංවර්ධන බද්ද ඉවත් කිරීමටද යෝජනා කර තිබෙනවා.',
      w: { imported: 57.4, levy: 59.3, remove: 62.3 }, show: 'Travel to the port: a crate of imported batteries carries a 10% levy block. On "ඉවත් කිරීමට" the block is lifted off and set aside.' },
    { id: 'saving', s: 64.0, e: 73.0, say: 'මෙම බදු ඉවත් කිරීමෙන් බැටරි මිලදී ගන්නා අයට කිලෝවොට් පැයකට රුපියල් 4,000ත් 5,000ත් අතර අමතර ඉතිරියක් ලැබිය හැකි බව අයවැය ඉදිරිපත් කිරීමේදී සඳහන් වුණා.',
      w: { amount: 66.8 }, show: 'The crate lights; a second conduit carries the saving back up the road to the battery. SAVE Rs 4,000-5,000 per kWh.' },
    { id: 'netplus', s: 73.0, e: 78.0, say: 'මෙම යෝජනාව අදාළ වන්නේ Net Plus ක්‍රමය යටතේ බැටරි සහිත නව ගෘහස්ථ සූර්ය පද්ධති සවි කරන අයටයි.',
      w: { netplus: 74.6 }, show: 'At the house: the meter and its line to the grid switch on. NET PLUS: new solar + battery.' },
    { id: 'notice', s: 78.0, e: 88.0, say: 'කෙසේ වෙතත්, මෙය අයවැය යෝජනාවක් බැවින් අයදුම් කිරීමේ ක්‍රමවේදය සහ ක්‍රියාත්මක වන දිනය පිළිබඳ අවසන් රජයේ නිවේදන අනිවාර්යයෙන්ම පරීක්ෂා කළ යුතුයි.',
      w: { apply: 80.6, date: 82.0 }, show: 'A notice card hinges up in the front yard: How to apply? Start date? STILL A PROPOSAL.' },
    { id: 'goal', s: 88.0, e: 97.0, say: 'ශ්‍රී ලංකාවේ නිවාස හිමියන්ට සූර්ය බලශක්තිය සහ බැටරි ගබඩා පද්ධති ලබාගැනීම පහසු කිරීමයි මෙම නව අයවැය යෝජනාවේ ප්‍රධාන අරමුණ වන්නේ.',
      w: { homes: 89.0 }, show: 'One long crane up and back over the whole board: parliament, the lit neighbourhood, the port. Hold on the result.' },
  ];
  const B = Object.fromEntries(BEATS.map((b) => [b.id, b]));
  const DURATION = Math.ceil((BEATS[BEATS.length - 1].e + 1.0) * 10) / 10;

  // The schedule every move and sound reads from. Everything is derived from BEATS.
  const T = {
    trunk: [B.rooftop.s + 0.5, B.rooftop.w.rooftop - 0.15],          // book -> house roof
    panels: B.rooftop.w.rooftop, panelStep: 0.07,
    branch: [B.battery.w.battery - 0.1, B.battery.w.battery + 1.5],   // house wall -> battery rack
    mods: [],                                                         // when each of the 12 modules lights (or is placed)
    more: B.ten.w.more, max: B.ten.w.max,
    fund: [B.fund.w.fund - 0.9, B.fund.w.fund + 2.6],
    levyOff: B.levy.w.remove,
    crate: B.saving.s + 0.3, saving: [B.saving.s + 0.5, B.saving.w.amount - 0.1],
    netplus: B.netplus.w.netplus,
    notice: B.notice.s - 0.3,
  };
  // module k (1-based) lights so that the LAST module of each group lands on its spoken number
  const group = (from, to, land, gap = 0.16) => { for (let k = from; k <= to; k++) T.mods[k] = land - (to - k) * gap; };
  group(1, 1, B.perkwh.w.one); group(2, 5, B.five.w.five); group(6, 8, B.eight.w.eight); group(9, 10, B.ten.w.ten);
  T.mods[11] = T.more; T.mods[12] = T.more + 0.22;                    // placed, but never paid for
  const RS = 25000, CAP = 10;
  const HOME_TIMES = [];   // filled by build (when the fund reaches each home), read by the score

  // Labels, in story order. `at` = draws in, `out` = leaves. `off` = label position in px from its anchor point.
  const LABELS = [
    { key: 'book', name: 'BUDGET 2027', note: 'new subsidy proposal', at: B.budget.w.budget - 0.15, out: B.rooftop.s + 1.2, off: [150, -170] },
    { key: 'parliament', name: 'PARLIAMENT', note: 'proposal presented', at: B.budget.w.parliament - 0.15, out: B.rooftop.s + 1.2, off: [-130, -230] },
    { key: 'roof', name: 'NEW ROOFTOP SOLAR', note: 'households qualify', at: B.rooftop.w.rooftop - 0.1, out: B.battery.s + 0.4, off: [-360, -170] },
    { key: 'rack', name: 'WITH A BATTERY', note: 'new solar + storage', at: B.battery.w.battery - 0.05, out: B.perkwh.s - 0.3, off: [170, -230], big: { text: 'UP TO Rs 250,000', at: B.battery.w.amount - 0.1 } },
    { key: 'home', name: 'MAX PER HOME', note: 'Rs 250,000', at: B.perhome.w.home - 0.1, out: B.fund.s + 0.3, off: [-430, -190] },
    { key: 'fund', name: 'Rs 3.5 BILLION', note: 'set aside for the scheme', at: B.fund.w.fund - 0.15, out: B.levy.s + 1.5, off: [120, -200] },
    { key: 'crate', name: 'IMPORTED BATTERIES', note: 'for solar storage', at: B.levy.w.imported - 0.1, out: B.saving.w.amount - 0.3, off: [-260, 260] },
    { key: 'levy', name: '10% LEVY', note: 'port & airport development', at: B.levy.w.levy - 0.1, out: B.levy.w.remove + 0.3, off: [120, -300] },
    { key: 'levyOff', name: 'LEVY REMOVED', note: 'no 10% on these batteries', at: B.levy.w.remove + 0.15, out: B.saving.w.amount - 0.3, off: [-120, -330] },
    { key: 'saving', name: 'SAVE Rs 4,000-5,000', note: 'per kWh of battery', at: B.saving.w.amount - 0.1, out: B.netplus.s + 0.2, off: [-300, -260] },
    { key: 'meter', name: 'NET PLUS', note: 'new solar + battery only', at: B.netplus.w.netplus - 0.1, out: B.notice.s + 0.5, off: [160, -210] },
    { key: 'notice', name: 'STILL A PROPOSAL', note: 'check the official notice', at: B.notice.s + 0.1, out: B.goal.s + 0.5, off: [-470, -150] },
  ];

  registerStyle({
    id: 'white-model-solar-subsidy',
    name: 'White Model',
    family: 'Diagrams with depth',
    look: 'An architect\'s presentation model: everything is matte white card and foam on a white site board, and one saturated accent colour is reserved for the thing being explained.',
    motion: 'Nothing in the model moves. Only the accent moves: it starts at the source and travels through the model along thin conduits, switching each part on as it arrives, and a numbered label with a thin leader line draws in at every stop.',
    light: 'Soft daylight from one side plus sky light with real occlusion. The accent glows a little and throws its own colour onto the white around it.',
    materials: 'Four slightly different whites with a fine paper grain and a tiny bevel on every edge; scored pencil lines on the board; a mid-grey table behind.',
    camera: 'Long lens with shallow focus. One slow continuous crane through the whole board.',
    post: 'Neutral tone mapping, light bloom on the accent only, soft vignette, almost no grain.',
    topic: 'Sri Lanka Budget 2027: a proposed subsidy of Rs 25,000 per kWh of home battery (up to Rs 250,000) for new rooftop solar with storage, a Rs 3.5 bn fund, and the 10% port levy removed on imported batteries',
    duration: DURATION,
    BEATS, LABELS, T,
    fonts: ['700 50px "Inter"', '800 86px "Inter"', '500 38px "Inter"', '600 30px "IBM Plex Mono"', '600 40px "IBM Plex Mono"', '700 120px "Inter"'],
    render: { samples: 48, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.32, bloomThreshold: 1.1, vignette: 0.3, grain: 0.012, contrast: 1.05, fov: 24, background: '#b4b8bd', far: 400 },

    build(S) {
      const { THREE, K, scene, camera } = S;
      const accent = new THREE.Color(ACCENT), V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
      const INK = '#1b1e22';

      // ================================================================ 1. THE KIT: whites, daylight, set
      const grain = K.canvasTex(256, 256, (ctx, w, h) => {
        const r = K.rng(3), im = ctx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) { const v = 128 + r.gauss() * 26; im.data.set([v, v, v, 255], i * 4); }
        ctx.putImageData(im, 0, 0);
      }, { data: true, repeat: [3, 3] });
      const white = (color, roughness = 0.92) => new THREE.MeshStandardMaterial({ color, roughness, bumpMap: grain, bumpScale: 0.4 });
      const M = { card: white('#f8f6f0'), foam: white('#eef3f8', 0.8), paper: white('#fcfbf8'), plaster: white('#eeebe6', 1) };

      const put = (geo, mat, pos = [0, 0, 0], rot, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
      const box = (w, h, d, mat, pos, rot, parent) => put(K.roundedBox(w, h, d, 0.012, 2), mat, pos, rot, parent);
      const cyl = (r, h, mat, pos, parent, rTop = r) => put(new THREE.CylinderGeometry(rTop, r, h, 28), mat, pos, null, parent);
      const cut = (outline, holes = [], depth = 0.08) => {
        const s = new THREE.Shape(outline.map((p) => new THREE.Vector2(p[0], p[1])));
        for (const [x0, x1, y0, y1] of holes) s.holes.push(new THREE.Path([[x0, y0], [x0, y1], [x1, y1], [x1, y0]].map((p) => new THREE.Vector2(p[0], p[1]))));
        return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 24 });
      };
      // a flat card lying on the board, cut to an outline of [x, z] points, `h` thick, at height y
      const slab = (pts, h, mat, y = 0) => put(cut(pts.map(([x, z]) => [x, -z]), [], h), mat, [0, y, 0], [-Math.PI / 2, 0, 0]);
      const ellipse = (cx, cz, rx, rz, n = 96, wob = 0, k = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, f = 1 + wob * (0.5 * Math.sin(a * 3 + k) + 0.3 * Math.sin(a * 5 + 2 * k)); return [cx + rx * f * Math.cos(a), cz + rz * f * Math.sin(a)]; });
      // ink printed on the model (numbers, a notice): a lit text plane so it takes the same light and shadow
      const ink = (text, h, pos, rot, parent, font = '700 120px "Inter"', color = INK) => { const m = K.textPlane(text, { font, color, height: h, lit: true, roughness: 0.9 }); m.position.set(...pos); if (rot) m.rotation.set(...rot); m.receiveShadow = true; (parent || scene).add(m); return m; };

      K.env(S, { top: '#ffffff', horizon: '#e6eaef', bottom: '#b8b4ad', intensity: 0.36 });
      const SUN_DIR = V([-14.5, 19.6, 18]).normalize();
      const sun = K.sun(S, { pos: [-14.5, 19.6, 18], target: [0, 1, 0], color: '#fff7ec', power: 2.4, size: 13, soft: 1.6, mapSize: 4096, far: 140 });
      const sky = K.skyLight(S, { color: '#e6eeff', power: 1.35, size: 12, center: [0, 1, 0], mapSize: 2048, dist: 40 });

      // ---- the board: a grey table and one long white site board, scored with the plan of everything on it
      const BOARD = { x0: -27, x1: 27, z0: -15, z1: 10, th: 0.3, ppu: 70 };
      const ROAD = { z0: 3.7, z1: 5.5 }, BACK = [[-5.4, -4.2], [-9.3, -8.1]], SPINE = [-11.6, -10.4], QUAY = 19.5;
      const LAKE = { cx: -18, cz: -2.6, rx: 5.6, rz: 4.2 }, ISLE = { cx: -18, cz: -3.0, rx: 3.3, rz: 2.3 };
      const ROW = [-8, -4.6, -1.2, 2.2, 5.6, 9.0], ROWZ = [-6.9, -10.8];
      const POLES = [-12, -8.2, 0.8, 7.2, 12], POLE_Z = 6.05;
      const TREES = [[-7.6, -1.2, 0.5, 1.5], [-8.9, 0.4, 0.42, 1.3], [6.4, -2.0, 0.55, 1.6], [8.2, -1.2, 0.42, 1.3], [12.4, 1.2, 0.5, 1.5], [-23.5, 4.2, 0.5, 1.5], [13.6, -2.6, 0.5, 1.5], [-9.6, -12.6, 0.5, 1.5], [12.8, -12.2, 0.45, 1.3], [-24.4, -9.4, 0.55, 1.6], [-14.4, 8.4, 0.4, 1.2]];
      put(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: '#a9adb3', roughness: 1 }), [0, -BOARD.th, 0], [-Math.PI / 2, 0, 0]).castShadow = false;
      const bw = BOARD.x1 - BOARD.x0, bd = BOARD.z1 - BOARD.z0, bcx = (BOARD.x0 + BOARD.x1) / 2, bcz = (BOARD.z0 + BOARD.z1) / 2;
      box(bw, BOARD.th, bd, M.foam, [bcx, -BOARD.th / 2 - 0.002, bcz]);
      const scored = K.canvasTex(Math.round(bw * BOARD.ppu), Math.round(bd * BOARD.ppu), (ctx, w, h) => {
        const P = BOARD.ppu, X = (x) => (x - BOARD.x0) * P, Z = (z) => (z - BOARD.z0) * P;
        const line = (pts, a = 0.4, lw = 1.5, dash) => { ctx.strokeStyle = `rgba(52,58,66,${a})`; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Z(p[1])) : ctx.moveTo(X(p[0]), Z(p[1])))); ctx.stroke(); };
        const rect = (x0, z0, x1, z1, a, lw, dash) => line([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], a, lw, dash);
        const ring = (x, z, r, a = 0.3, lw = 1.4) => { ctx.strokeStyle = `rgba(52,58,66,${a})`; ctx.lineWidth = lw; ctx.setLineDash([]); ctx.beginPath(); ctx.arc(X(x), Z(z), r * P, 0, 7); ctx.stroke(); };
        ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, w, h);
        for (let x = Math.ceil(BOARD.x0); x < BOARD.x1; x++) line([[x, BOARD.z0], [x, BOARD.z1]], 0.08, 1);
        for (let z = Math.ceil(BOARD.z0); z < BOARD.z1; z++) line([[BOARD.x0, z], [BOARD.x1, z]], 0.08, 1);
        // water: the lake and the harbour, a faint cool tint and fine parallel hatching
        const water = (path) => {
          ctx.save(); ctx.beginPath(); path(); ctx.closePath(); ctx.fillStyle = 'rgba(205,220,235,0.35)'; ctx.fill(); ctx.clip();
          for (let z = BOARD.z0; z < BOARD.z1; z += 0.22) line([[BOARD.x0, z], [BOARD.x1, z]], 0.12, 1);
          ctx.restore();
        };
        water(() => ellipse(LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz, 120, 0.05, 1).forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z)))));
        line([...ellipse(LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz, 120, 0.05, 1), ellipse(LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz, 120, 0.05, 1)[0]], 0.36, 2);
        water(() => { ctx.moveTo(X(QUAY), Z(BOARD.z0)); ctx.lineTo(X(BOARD.x1), Z(BOARD.z0)); ctx.lineTo(X(BOARD.x1), Z(BOARD.z1)); ctx.lineTo(X(QUAY), Z(BOARD.z1)); });
        line([[QUAY, BOARD.z0], [QUAY, BOARD.z1]], 0.45, 2.4);
        // roads
        for (const z of [ROAD.z0, ROAD.z1]) line([[BOARD.x0, z], [QUAY, z]], 0.36, 2.2);
        line([[BOARD.x0, (ROAD.z0 + ROAD.z1) / 2], [QUAY, (ROAD.z0 + ROAD.z1) / 2]], 0.28, 2, [40, 30]);
        for (const [z0, z1] of BACK) { line([[SPINE[1], z0], [12.6, z0]], 0.32, 1.8); line([[SPINE[1], z1], [12.6, z1]], 0.32, 1.8); }
        line([[SPINE[0], ROAD.z0], [SPINE[0], BACK[1][0]]], 0.32, 1.8); line([[SPINE[1], ROAD.z0], [SPINE[1], BACK[0][1]]], 0.32, 1.8);
        line([[SPINE[1], BACK[0][0]], [SPINE[1], BACK[1][1]]], 0.32, 1.8);
        // plots: the hero plot and the neighbourhood
        rect(-3.6, -1.9, 4.0, 3.4, 0.34, 2); rect(-3.5, -1.8, 3.9, 3.3, 0.14, 1);
        rect(-1.95, -1.65, 2.75, 1.65, 0.28, 1.4, [10, 7]);
        line([[-0.56, 1.4], [-0.56, ROAD.z0]], 0.3); line([[-0.12, 1.4], [-0.12, ROAD.z0]], 0.3);
        for (const [i, rz] of ROWZ.entries()) for (const x of ROW) rect(x - 1.55, rz - 1.4, x + 1.55, rz + 1.15, 0.24, 1.2);
        // port: quay paving and a dashed loading bay
        for (let z = -6; z < 9; z += 1.5) line([[15.6, z], [QUAY, z]], 0.12, 1);
        rect(16.2, 1.2, 18.8, 3.4, 0.32, 1.6, [12, 8]);
        // island contour and trees
        for (const [x, z, r] of TREES) { ring(x, z, r + 0.12, 0.24); ring(x, z, 0.03, 0.4, 3); }
      });
      put(new THREE.PlaneGeometry(bw, bd), new THREE.MeshStandardMaterial({ map: scored, roughness: 0.94 }), [bcx, 0, bcz], [-Math.PI / 2, 0, 0]).castShadow = false;

      // ================================================================ 2. THE ACCENT RULE
      const runs = [];
      let laid = 0;
      const run = (curve, t0, t1, radius = 0.032, o = {}) => {
        const len = curve.getLength(), u = { uHead: { value: 0 }, uTime: { value: 0 }, uLen: { value: len }, uOff: { value: laid }, uAccent: { value: accent } };
        const mat = new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.75 });
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAlong;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAlong = uv.x;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uHead, uTime, uLen, uOff; uniform vec3 uAccent; varying float vAlong;')
            .replace('#include <color_fragment>', '#include <color_fragment>\nfloat on = step(vAlong, uHead - 0.0001);\ndiffuseColor.rgb = mix(diffuseColor.rgb, uAccent, on);')
            .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
              float d = fract((uOff + vAlong * uLen - uTime * 2.2) / 0.6);
              totalEmissiveRadiance += uAccent * on * (0.4 + 0.9 * smoothstep(0.0, 0.1, d) * smoothstep(0.42, 0.3, d));`);
        };
        put(new THREE.TubeGeometry(curve, Math.ceil(len * 30), radius, 10), mat);
        runs.push({ curve, t0, t1, u, bead: o.bead !== false }); laid += len;
        return curve;
      };
      const conduit = (pts, r = 0.07) => {
        const P = pts.map(V), path = new THREE.CurvePath(); let prev = P[0];
        for (let i = 1; i < P.length - 1; i++) {
          const a = P[i].clone().add(P[i - 1].clone().sub(P[i]).setLength(Math.min(r, P[i].distanceTo(P[i - 1]) * 0.45)));
          const b = P[i].clone().add(P[i + 1].clone().sub(P[i]).setLength(Math.min(r, P[i].distanceTo(P[i + 1]) * 0.45)));
          path.add(new THREE.LineCurve3(prev, a)); path.add(new THREE.QuadraticBezierCurve3(a, P[i], b)); prev = b;
        }
        path.add(new THREE.LineCurve3(prev, P[P.length - 1]));
        return path;
      };
      const hang = (a, b, sag) => new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const u = i / 8; return V([K.lerp(a[0], b[0], u), K.lerp(a[1], b[1], u) - sag * 4 * u * (1 - u), K.lerp(a[2], b[2], u)]); }));
      const glow = (mat, base = 0.25) => { const c0 = mat.color.clone(); return (k, flash = 0) => { mat.color.copy(c0).lerp(accent, k); mat.emissive.copy(accent).multiplyScalar(k * base + flash); }; };
      // a run's [t0, t1] split across consecutive legs in proportion to their length, so the front moves at one speed
      const legs = (curves, t0, t1, radius, o) => {
        const L = curves.map((c) => c.getLength()), tot = L.reduce((a, b) => a + b, 0); let acc = 0;
        return curves.map((c, i) => { const a = K.lerp(t0, t1, acc / tot); acc += L[i]; return run(c, a, K.lerp(t0, t1, acc / tot), radius, o); });
      };
      const beads = [0, 1].map(() => { const b = put(new THREE.SphereGeometry(0.075, 20, 12), new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(2.0) })); b.castShadow = b.receiveShadow = false; const l = new THREE.PointLight(accent, 0, 3.2, 2); scene.add(l); return { b, l }; });
      const cells = K.canvasTex(252, 420, (ctx, w, h) => {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(40,48,58,0.32)'; ctx.lineWidth = 2.5;
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * w / 6, 0); ctx.lineTo(i * w / 6, h); ctx.stroke(); }
        for (let j = 1; j < 10; j++) { ctx.beginPath(); ctx.moveTo(0, j * h / 10); ctx.lineTo(w, j * h / 10); ctx.stroke(); }
      });
      const signTex = (draw) => K.canvasTex(128, 128, (ctx) => { ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; draw(ctx); });
      const sign = (draw, size, pos, rot, parent = scene) => {
        const m = put(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: signTex(draw), transparent: true, color: '#b9bec4' }), pos, rot, parent); m.castShadow = m.receiveShadow = false;
        return (k) => m.material.color.set('#b9bec4').lerp(accent, k).multiplyScalar(1 + 0.9 * k);
      };
      const batteryIcon = (ctx) => { ctx.strokeRect(20, 38, 80, 52); ctx.fillRect(100, 52, 10, 24); ctx.fillRect(32, 50, 18, 28); ctx.fillRect(56, 50, 18, 28); };

      // ================================================================ 3. THE MODEL
      // ---- 3a. parliament on its island in the lake (a pavilion cluster with steep, stacked hipped roofs)
      for (let k = 0; k < 2; k++) slab(ellipse(ISLE.cx, ISLE.cz, ISLE.rx - k * 0.35, ISLE.rz - k * 0.3, 96, 0.04, k + 2), 0.11, k ? M.paper : M.card, k * 0.11);
      const PY = 0.22, PC = [ISLE.cx, ISLE.cz];
      box(3.5, 0.2, 2.5, M.plaster, [PC[0], PY + 0.1, PC[1]]);
      for (let i = 0; i < 3; i++) box(1.5 - i * 0.2, 0.067 * (3 - i), 0.22, M.paper, [PC[0], PY + 0.0335 * (3 - i), PC[1] + 1.25 + 0.22 * (2 - i) + 0.11]);   // front steps
      const hipRoof = (cx, cz, y, w, d, h, tiers, mat) => {
        // a stack of square-plan frustums: each tier slightly smaller, the last one a point
        for (let i = 0; i < tiers; i++) {
          const s0 = 1 - i * 0.42, s1 = i === tiers - 1 ? 0.02 : 1 - (i + 1) * 0.42 + 0.12, hh = h / tiers;
          const g = new THREE.CylinderGeometry(s1 * Math.SQRT1_2, s0 * Math.SQRT1_2, hh, 4, 1); g.rotateY(Math.PI / 4); g.scale(w, 1, d); g.computeVertexNormals();
          put(g, mat, [cx, y + i * hh * 1.05 + hh / 2, cz]);
          if (i < tiers - 1) box(w * s1 * 0.92, hh * 0.18, d * s1 * 0.92, M.plaster, [cx, y + (i + 1) * hh * 1.05 - hh * 0.04, cz]);
        }
      };
      const pavilion = (cx, cz, w, d, h, roofH, tiers) => {
        const y0 = PY + 0.2;
        box(w * 0.62, h, d * 0.62, M.card, [cx, y0 + h / 2, cz]);
        for (let i = 0; i <= 4; i++) for (const sz of [-1, 1]) box(0.035, h, 0.035, M.paper, [cx - w * 0.4 + i * w * 0.2, y0 + h / 2, cz + sz * d * 0.4]);   // colonnade
        box(w * 0.9, 0.05, d * 0.9, M.paper, [cx, y0 + h + 0.025, cz]);
        hipRoof(cx, cz, y0 + h + 0.05, w * 1.06, d * 1.06, roofH, tiers, M.foam);
      };
      pavilion(PC[0], PC[1] + 0.05, 1.7, 1.3, 0.5, 1.15, 2);
      for (const [dx, dz] of [[-1.25, -0.55], [1.25, -0.55], [-1.2, 0.55], [1.2, 0.55]]) pavilion(PC[0] + dx, PC[1] + dz, 0.9, 0.8, 0.36, 0.6, 2);
      slab([[ISLE.cx - 0.5, ISLE.cz + ISLE.rz - 0.3], [ISLE.cx + 0.5, ISLE.cz + ISLE.rz - 0.3], [ISLE.cx + 0.5, ROAD.z0 - 0.05], [ISLE.cx - 0.5, ROAD.z0 - 0.05]], 0.1, M.card);   // causeway
      // the budget book on the top step: the source, glowing from frame one
      const BOOK = [PC[0] + 0.45, PY + 0.2 + 0.035, PC[1] + 1.42];
      const book = box(0.4, 0.07, 0.3, new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, emissive: accent, emissiveIntensity: 0.55 }), BOOK, [0, 0.25, 0]); book.castShadow = false;
      const bookLight = new THREE.PointLight(accent, 2.5, 2.6, 2); bookLight.position.set(BOOK[0], BOOK[1] + 0.3, BOOK[2] + 0.1); scene.add(bookLight);

      // ---- 3b. the hero house (card walls with real openings, a gable roof, the new array on the front slope)
      const HX = 0, HW = 4.2, HD = 2.8, EAVE = 2.3, PITCH = 32 * Math.PI / 180, WT = 0.09, RIDGE = EAVE + HD / 2 * Math.tan(PITCH), ROOF_T = 0.08, FZ = HD / 2;
      const SLOPE = HD / 2 / Math.cos(PITCH) + 0.22;
      const house = new THREE.Group(); house.position.x = HX; scene.add(house);
      const hp = (x, y, z) => [x + HX, y, z];
      const roofPt = (x, s, h = 0) => [x + HX, RIDGE - s * Math.sin(PITCH) + (ROOF_T + h) * Math.cos(PITCH), s * Math.cos(PITCH) + (ROOF_T + h) * Math.sin(PITCH)];
      const WIN = { living: [-0.15, 1.25, 0.32, 1.05], door: [-0.95, -0.53, 0.03, 0.95], up: [[-1.2, -0.6, 1.5, 2.05], [-0.1, 0.5, 1.5, 2.05], [0.95, 1.55, 1.5, 2.05]] };
      const rectPts = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      const gable = [[-FZ, 0], [FZ, 0], [FZ, EAVE], [0, RIDGE], [-FZ, EAVE]];
      put(cut(rectPts(-HW / 2, HW / 2, 0, EAVE), [WIN.living, WIN.door, ...WIN.up], WT), M.card, [0, 0, FZ - WT], null, house);
      put(cut(rectPts(-HW / 2, HW / 2, 0, EAVE), [], WT), M.card, [0, 0, -FZ], null, house);
      put(cut(gable, [[-0.5, 0.35, 0.4, 1.0], [-0.5, 0.35, 1.5, 2.05]], WT), M.plaster, [-HW / 2 + WT, 0, 0], [0, -Math.PI / 2, 0], house);
      put(cut(gable, [], WT), M.plaster, [HW / 2, 0, 0], [0, -Math.PI / 2, 0], house);
      box(HW - 0.1, 0.08, HD - 0.1, M.paper, [0, 1.18, 0], null, house);
      box(HW - 0.1, 0.06, HD - 0.1, M.paper, [0, EAVE - 0.03, 0], null, house);
      box(HW - 0.1, 0.02, HD - 0.1, M.paper, [0, 0.012, 0], null, house);
      box(0.07, 1.1, HD - 0.2, M.paper, [-0.36, 0.58, 0], null, house); box(0.07, 1.05, HD - 0.2, M.paper, [0.72, 1.75, 0], null, house);
      box(1.0, 0.2, 0.42, M.foam, [0.6, 0.12, -0.5], null, house); box(1.0, 0.36, 0.12, M.foam, [0.6, 0.2, -0.76], null, house);
      box(0.6, 0.16, 0.9, M.foam, [-0.4, 1.31, -0.6], null, house); box(0.5, 0.16, 0.9, M.foam, [1.3, 1.31, -0.6], null, house);
      box(0.4, 0.9, 0.03, M.foam, [-0.74, 0.49, FZ - 0.07], null, house); box(0.03, 0.03, 0.05, M.plaster, [-0.6, 0.48, FZ - 0.04], null, house);
      for (const [x0, x1, y0, y1] of [WIN.living, ...WIN.up]) {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, n = x1 - x0 > 1 ? 3 : 1;
        for (let i = 1; i <= n; i++) box(0.024, y1 - y0, 0.03, M.paper, [x0 + (x1 - x0) * i / (n + 1), cy, FZ - WT / 2], null, house);
        box(x1 - x0, 0.024, 0.03, M.paper, [cx, y0 + (y1 - y0) * 0.62, FZ - WT / 2], null, house);
        box(x1 - x0 + 0.12, 0.035, 0.08, M.paper, [cx, y0 - 0.018, FZ + 0.03], null, house);
      }
      for (const sgn of [1, -1]) {
        const sc = (SLOPE - 0.04) / 2;
        box(HW + 0.5, ROOF_T, SLOPE + 0.04, M.foam, [0, RIDGE - sc * Math.sin(PITCH) + ROOF_T / 2 * Math.cos(PITCH), sgn * (sc * Math.cos(PITCH) + ROOF_T / 2 * Math.sin(PITCH))], [sgn * PITCH, 0, 0], house);
      }
      box(HW + 0.52, 0.05, 0.14, M.paper, [0, RIDGE + ROOF_T + 0.03, 0], null, house);
      box(0.36, 0.95, 0.36, M.plaster, [1.25, RIDGE - 0.1, -0.62], null, house); box(0.44, 0.05, 0.44, M.paper, [1.25, RIDGE + 0.39, -0.62], null, house);
      // the array: 6 x 2 panels; they switch on in a wave from the end where the conduit arrives
      const COLS = 6, ROWS = 2, PW = 0.42, PH = 0.7, GAP = 0.03, AX = -0.1, AS = 0.17, PNY = ROOF_T + 0.06;
      const roofG = new THREE.Group(); roofG.position.set(...roofPt(0, 0, -ROOF_T)); roofG.rotation.x = PITCH; scene.add(roofG);
      const panels = [];
      for (let r = 0; r < ROWS; r++) {
        const s = AS + PH / 2 + r * (PH + GAP);
        for (const ds of [-0.2, 0.2]) box(COLS * (PW + GAP) + 0.1, 0.035, 0.035, M.plaster, [AX, ROOF_T + 0.02, s + ds], null, roofG);
        for (let c = 0; c < COLS; c++) {
          const x = AX + (c - (COLS - 1) / 2) * (PW + GAP);
          box(PW, 0.035, PH, M.foam, [x, PNY, s], null, roofG);
          const face = put(new THREE.PlaneGeometry(PW - 0.03, PH - 0.03), new THREE.MeshStandardMaterial({ color: '#f4f6f8', map: cells, roughness: 0.6 }), [x, PNY + 0.019, s], [-Math.PI / 2, 0, 0], roofG);
          face.castShadow = false;
          panels.push({ set: glow(face.material, 0.3), at: T.panels + (c + r * 0.6) * T.panelStep });
        }
      }
      const arrayLeft = AX - COLS / 2 * (PW + GAP);
      const WZ = FZ + 0.045;
      // meter box on the front wall, and the service line to the pole across the road
      box(0.36, 0.38, 0.11, M.foam, [1.72, 0.9, FZ + 0.055], null, house);
      const meterSign = sign((ctx) => { ctx.beginPath(); ctx.arc(64, 64, 40, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(88, 44); ctx.stroke(); }, 0.24, [1.72, 0.9, FZ + 0.113], null, house);
      cyl(0.045, 0.1, M.paper, hp(2.0, 1.95, WZ));

      // ---- 3c. the battery rack beside the house: 12 module slots, numbered; each kWh module can take the accent
      const RX = 3.0, RZ = 0.75, RW = 0.74, RD = 0.46, MH = 0.095, PITCH_M = 0.12, RY0 = 0.13;
      const modY = (k) => RY0 + (k - 0.5) * PITCH_M;                    // centre height of module k (1-based)
      box(RW + 0.12, 0.08, RD + 0.1, M.plaster, [RX, 0.04, RZ]);       // plinth
      for (const sx of [-1, 1]) box(0.04, RY0 + 12 * PITCH_M + 0.06, RD, M.card, [RX + sx * (RW / 2 + 0.02), (RY0 + 12 * PITCH_M + 0.06) / 2, RZ]);
      box(RW + 0.08, RY0 + 12 * PITCH_M + 0.06, 0.03, M.card, [RX, (RY0 + 12 * PITCH_M + 0.06) / 2, RZ - RD / 2]);
      const battSign = sign(batteryIcon, 0.2, [RX + RW / 2 + 0.045, 0.62, RZ + 0.05], [0, Math.PI / 2, 0]);
      const mods = [];
      for (let k = 1; k <= 12; k++) {
        const g = new THREE.Group(); g.position.set(RX, modY(k), RZ + 0.01); scene.add(g);
        box(RW - 0.04, MH, RD - 0.06, M.foam, [0, 0, 0], null, g);
        const face = put(new THREE.PlaneGeometry(RW - 0.1, MH - 0.03), new THREE.MeshStandardMaterial({ color: '#f6f5f2', roughness: 0.7 }), [0, 0, (RD - 0.06) / 2 + 0.003], null, g); face.castShadow = false;
        ink(String(k), 0.062, [-(RW - 0.1) / 2 + 0.07, 0, (RD - 0.06) / 2 + 0.006], null, g, '600 120px "IBM Plex Mono"');
        for (let i = 0; i < 4; i++) box(0.05, 0.012, 0.01, M.paper, [0.12 + i * 0.07, 0, (RD - 0.06) / 2 + 0.006], null, g);   // vents
        mods.push({ g, set: glow(face.material, 0.55), at: T.mods[k], k });
      }
      // the MAX tab: a card flag that slides in at the 10th module
      const maxTab = new THREE.Group(); scene.add(maxTab);
      box(0.34, 0.012, 0.16, M.paper, [0.17, 0, 0], null, maxTab);
      box(0.3, 0.13, 0.012, M.paper, [0.3, 0.065, 0.07], null, maxTab);
      ink('MAX', 0.07, [0.3, 0.068, 0.078], null, maxTab, '800 120px "Inter"');
      const MAX_Y = RY0 + 10 * PITCH_M + 0.004;

      // ---- 3d. the neighbourhood: two rows of smaller homes on the back streets, each with an array and a battery
      const mini = (x, z) => {
        const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
        const w = 2.1, d = 1.5, h = 1.05, pitch = 30 * Math.PI / 180, rh = d / 2 * Math.tan(pitch);
        box(w, h, d, M.card, [0, h / 2, 0], null, g);
        for (const wx of [-0.55, 0.45]) box(0.36, 0.3, 0.02, M.plaster, [wx, 0.6, d / 2 + 0.005], null, g);
        box(0.26, 0.5, 0.02, M.foam, [0.02, 0.25, d / 2 + 0.005], null, g);
        put(cut([[-d / 2 - 0.12, 0], [d / 2 + 0.12, 0], [0, rh + 0.07]], [], w + 0.24), M.foam, [-(w + 0.24) / 2, h, 0], [0, Math.PI / 2, 0], g);
        const sl = Math.hypot(d / 2 + 0.12, rh + 0.07), face = put(new THREE.PlaneGeometry(w * 0.72, sl * 0.62), new THREE.MeshStandardMaterial({ color: '#f4f6f8', map: cells, roughness: 0.6 }), [0, h + (rh + 0.07) * 0.45 + 0.03, (d / 2 + 0.12) * 0.55 + 0.02], [-(Math.PI / 2 - pitch), 0, 0], g);
        face.castShadow = false; face.material.map = cells;
        box(0.3, 0.5, 0.24, M.foam, [w / 2 + 0.25, 0.25, 0.2], null, g);
        const bface = put(new THREE.PlaneGeometry(0.22, 0.4), new THREE.MeshStandardMaterial({ color: '#f6f5f2', roughness: 0.7 }), [w / 2 + 0.25, 0.25, 0.321], null, g); bface.castShadow = false;
        return { roof: glow(face.material, 0.3), batt: glow(bface.material, 0.55), front: [x, 0.04, z + d / 2] };
      };
      const homes = [];
      ROWZ.forEach((z, r) => ROW.forEach((x, c) => homes.push(Object.assign(mini(x + (r ? 0.3 : 0), z), { r, c }))));

      // ---- 3e. the grid along the road: poles and two wires
      const WIRE_Y = 3.22;
      for (const x of POLES) {
        cyl(0.06, 3.2, M.card, [x, 1.6, POLE_Z], scene, 0.045); box(0.08, 0.07, 0.98, M.card, [x, 3.06, POLE_Z]);
        for (const dz of [-0.36, 0.36]) cyl(0.035, 0.12, M.paper, [x, 3.155, POLE_Z + dz]);
      }
      for (let i = 0; i + 1 < POLES.length; i++) for (const dz of [-0.36, 0.36]) if (!(dz < 0 && (i === 1 || i === 2))) put(new THREE.TubeGeometry(hang([POLES[i], WIRE_Y, POLE_Z + dz], [POLES[i + 1], WIRE_Y, POLE_Z + dz], 0.2), 24, 0.02, 8), M.paper);
      const TAP = [POLES[2], WIRE_Y, POLE_Z - 0.36];

      // ---- 3f. the port: quay, a container ship, a gantry crane, and the crate of imported batteries with its levy block
      const SHIP = [23.4, 2.4];
      slab([[SHIP[0] - 1.1, SHIP[1] + 4.2], [SHIP[0] + 1.1, SHIP[1] + 4.2], [SHIP[0] + 1.1, SHIP[1] - 3.2], [SHIP[0], SHIP[1] - 4.6], [SHIP[0] - 1.1, SHIP[1] - 3.2]], 0.55, M.card, 0);
      slab([[SHIP[0] - 1.0, SHIP[1] + 4.1], [SHIP[0] + 1.0, SHIP[1] + 4.1], [SHIP[0] + 1.0, SHIP[1] - 3.1], [SHIP[0], SHIP[1] - 4.4], [SHIP[0] - 1.0, SHIP[1] - 3.1]], 0.06, M.paper, 0.55);
      box(1.8, 1.0, 1.0, M.plaster, [SHIP[0], 0.61 + 0.5, SHIP[1] + 3.4]); box(1.9, 0.06, 1.1, M.paper, [SHIP[0], 1.64, SHIP[1] + 3.4]);
      { const r = K.rng(7), mats = [M.card, M.foam, M.plaster, M.paper];
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const n = 1 + Math.floor(r() * 3); for (let k = 0; k < n; k++) box(0.58, 0.36, 0.95, mats[(i + j + k) % 4], [SHIP[0] - 0.62 + j * 0.62, 0.61 + 0.18 + k * 0.37, SHIP[1] - 2.6 + i * 1.0]); } }
      for (const z of [-3.6, -0.6]) { for (const x of [18.0, 20.6]) box(0.12, 3.6, 0.12, M.card, [x, 1.8, z]); box(2.8, 0.14, 0.14, M.card, [19.3, 3.5, z]); }
      box(0.14, 0.16, 3.1, M.card, [18.0, 3.65, -2.1]); box(7.6, 0.16, 0.6, M.foam, [21.2, 3.8, -2.1]); box(0.4, 0.3, 0.5, M.plaster, [22.6, 3.6, -2.1]);
      const CRATE = [17.5, 0.33, 2.3];
      box(0.95, 0.66, 0.66, M.foam, CRATE);
      for (const dx of [-0.3, 0, 0.3]) box(0.04, 0.68, 0.68, M.paper, [CRATE[0] + dx, CRATE[1], CRATE[2]]);
      const crateSign = sign(batteryIcon, 0.36, [CRATE[0] - 0.15, CRATE[1], CRATE[2] + 0.345]);
      const levy = new THREE.Group(); scene.add(levy);
      box(0.72, 0.42, 0.46, M.card, [0, 0.21, 0], null, levy);
      ink('10%', 0.21, [0, 0.21, 0.236], null, levy, '800 120px "Inter"');
      const LEVY_ON = [CRATE[0] + 0.12, CRATE[1] + 0.33, CRATE[2]], LEVY_OFF = [16.0, 0.002, 1.75];
      for (const [x, z] of [[16.4, 4.0], [17.4, 3.95], [18.2, 1.0]]) box(0.95, 0.66, 0.66, M.foam, [x, 0.33, z]);   // other crates on the quay

      // ---- 3g. the notice card in the front yard: it hinges up off the board like a page
      const notice = new THREE.Group(); notice.position.set(-4.2, 0.02, 2.75); notice.rotation.y = 0.32; scene.add(notice);
      const NW = 2.4, NH = 1.55, nCard = new THREE.Group(); notice.add(nCard);
      box(NW, NH, 0.04, M.paper, [0, NH / 2, 0], null, nCard);
      ink('OFFICIAL NOTICE', 0.17, [0, NH - 0.2, 0.025], null, nCard, '800 120px "Inter"');
      box(NW - 0.3, 0.012, 0.01, M.plaster, [0, NH - 0.34, 0.025], null, nCard);
      ink('How to apply ?', 0.16, [0.12, NH - 0.62, 0.025], null, nCard, '600 120px "IBM Plex Mono"');
      ink('Start date ?', 0.16, [0.12, NH - 0.98, 0.025], null, nCard, '600 120px "IBM Plex Mono"');
      for (const y of [NH - 0.62, NH - 0.98]) box(0.13, 0.13, 0.015, M.plaster, [-NW / 2 + 0.22, y, 0.03], null, nCard);
      for (const sx of [-1, 1]) box(0.04, 0.6, 0.04, M.card, [sx * NW * 0.36, 0.3, -0.1], [0.35, 0, 0], notice);

      // ---- scale cues: trees and a few figures
      for (const [x, z, r, h] of TREES) { cyl(0.03, h, M.paper, [x, h / 2, z]); put(new THREE.SphereGeometry(r, 32, 20), M.plaster, [x, h, z]); }
      const figure = (x, z, h, ry = 0) => {
        const body = new THREE.Shape([[-0.07, 0], [0.07, 0], [0.15, 0.72], [0.1, 0.78], [-0.1, 0.78], [-0.15, 0.72]].map((p) => new THREE.Vector2(p[0] * h, p[1] * h))), head = new THREE.Shape(); head.absarc(0, 0.9 * h, 0.1 * h, 0, Math.PI * 2);
        put(new THREE.ExtrudeGeometry([body, head], { depth: 0.03, bevelEnabled: false, curveSegments: 20 }), M.paper, [x, 0, z], [0, ry, 0]);
      };
      figure(1.9, 2.55, 0.72, -0.3); figure(2.3, 2.7, 0.46, -0.2); figure(-16.6, 2.1, 0.7, 0.4); figure(16.6, 3.0, 0.72, -0.6);

      // ================================================================ 4. THE PATHS: where the accent goes, and when
      const VZ = ROAD.z0 - 0.4;                                          // the north verge of the main road
      // the subsidy: book -> down the steps -> causeway -> along the road -> up the hero house -> into the array
      const trunk = [
        conduit([[BOOK[0] + 0.22, BOOK[1] - 0.03, BOOK[2]], [BOOK[0] + 0.3, 0.06, BOOK[2] + 0.25], [ISLE.cx + 0.3, 0.13, ISLE.cz + ISLE.rz + 0.2], [ISLE.cx + 0.3, 0.13, VZ - 0.35], [ISLE.cx + 0.6, 0.03, VZ], [-1.75, 0.03, VZ]]),
        conduit([[-1.75, 0.03, VZ], [-1.75, 0.03, WZ], [-1.75, EAVE - 0.32, WZ], roofPt(-1.75, SLOPE + 0.03, 0.03), roofPt(-1.75, 0.88, 0.03), roofPt(arrayLeft, 0.88, 0.03)]),
      ];
      legs(trunk, ...T.trunk);
      // branch: from the wall to the battery rack
      run(conduit([hp(-1.75, 0.25, WZ), hp(2.25, 0.25, WZ), [2.25, 0.25, RZ], [RX - RW / 2 - 0.02, 0.25, RZ]]), ...T.branch);
      // the fund: a spine from the causeway down to the back streets, then along both streets to every home
      const FS = T.fund, sx = SPINE[1] + 0.25;
      const spine = conduit([[ISLE.cx + 0.6, 0.03, VZ - 0.12], [sx, 0.03, VZ - 0.12], [sx, 0.03, BACK[0][0] - 0.15]]);
      const spineEnd = K.lerp(FS[0], FS[1], 0.3);
      run(spine, FS[0], spineEnd);
      const homeAt = HOME_TIMES; homeAt.length = 0;
      BACK.forEach(([z0], r) => {
        const zv = z0 - 0.15, x1 = ROW[ROW.length - 1] + 0.6 + (r ? 0.3 : 0);
        const street = r === 0 ? conduit([[sx, 0.03, zv], [x1, 0.03, zv]]) : conduit([[sx, 0.03, BACK[0][0] - 0.15], [sx, 0.03, zv], [x1, 0.03, zv]]);
        const x0 = r === 0 ? sx : sx, len0 = r === 0 ? 0 : Math.abs(zv - (BACK[0][0] - 0.15)), total = len0 + (x1 - x0);
        const t0 = spineEnd + r * 0.25, t1 = FS[1] - 0.5 + r * 0.25;
        run(street, t0, t1, 0.028, { bead: r === 0 });
        homes.filter((h) => h.r === r).forEach((h) => {
          const xh = h.front[0] + 0.55, ta = K.lerp(t0, t1, (len0 + xh - x0) / total);
          run(conduit([[xh, 0.03, zv], [xh, 0.03, h.front[2] + 0.02], [xh, 0.3, h.front[2] + 0.02]]), ta, ta + 0.25, 0.024, { bead: false });
          homeAt.push((h.at = ta + 0.25));
        });
      });
      // the saving: from the crate, back up the road to the battery rack
      const savePts = [[CRATE[0] - 0.5, 0.03, CRATE[2] + 0.2], [CRATE[0] - 0.9, 0.03, VZ + 0.18], [3.45, 0.03, VZ + 0.18], [3.45, 0.03, RZ + RD / 2 + 0.25], [RX + 0.1, 0.03, RZ + RD / 2 + 0.25], [RX + 0.1, 0.08, RZ + RD / 2 - 0.02]];
      run(conduit(savePts), ...T.saving);
      // Net Plus: the meter and its line to the grid
      const NP = [T.netplus - 0.35, T.netplus + 0.5];
      run(conduit([hp(1.9, 0.9, WZ), hp(2.0, 0.9, WZ), hp(2.0, 1.95, WZ)]), NP[0], K.lerp(NP[0], NP[1], 0.45));
      run(hang(hp(2.0, 1.95, WZ), TAP, 0.2), K.lerp(NP[0], NP[1], 0.45), NP[1], 0.024);
      run(hang(TAP, [POLES[3], WIRE_Y, POLE_Z - 0.36], 0.2), NP[1], NP[1] + 1.2, 0.024, { bead: false });
      run(hang(TAP, [POLES[1], WIRE_Y, POLE_Z - 0.36], 0.2), NP[1], NP[1] + 1.2, 0.024, { bead: false });

      // ================================================================ 5. LABELS (overlay, so they stay sharp)
      const anchors = {
        book: [BOOK[0], BOOK[1] + 0.06, BOOK[2]], parliament: [PC[0] - 0.4, PY + 1.6, PC[1]], roof: roofPt(AX - 0.6, AS + 0.4, 0.1),
        rack: [RX + 0.2, RY0 + 10 * PITCH_M, RZ + RD / 2], home: roofPt(0.8, 0.3, 0.2), fund: [sx, 0.05, BACK[0][0] - 0.15],
        crate: [CRATE[0] - 0.3, CRATE[1] + 0.2, CRATE[2] + 0.33], levy: [LEVY_ON[0], LEVY_ON[1] + 0.3, LEVY_ON[2] + 0.17], levyOff: [LEVY_OFF[0], 0.3, LEVY_OFF[2] + 0.17],
        saving: [8.5, 0.05, VZ + 0.18], meter: hp(1.72, 1.09, FZ + 0.11), notice: [-4.2 - 0.9, 1.5, 2.75 + 0.3],
      };
      const pv = new THREE.Vector3();
      const px = (p, W, H) => { pv.set(p[0], p[1], p[2]).project(camera); return [(pv.x * 0.5 + 0.5) * W, (-pv.y * 0.5 + 0.5) * H, pv.z]; };
      const halo = (ctx, text, x, y, lw = 6) => { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y); ctx.fillStyle = INK; ctx.fillText(text, x, y); };
      function label(ctx, L, n, t, W, H) {
        const p = K.seg(t, L.at, L.at + 0.6), q = K.seg(t, L.out - 0.35, L.out); if (p <= 0 || q >= 1) return;
        const a = px(anchors[L.key], W, H); if (a[2] > 1) return;
        ctx.save(); ctx.globalAlpha = 1 - q;
        ctx.font = '700 50px "Inter"'; ctx.letterSpacing = '3px'; const wName = ctx.measureText(L.name).width;
        ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px'; let wText = Math.max(wName, ctx.measureText(L.note).width); const R = 25;
        if (L.big) { ctx.font = '800 86px "Inter"'; wText = Math.max(wText, ctx.measureText(L.big.text).width); }
        const c = [K.clamp(a[0] + L.off[0], 70 + R, W - 70 - R - 18 - wText), K.clamp(a[1] + L.off[1], 80 + R, H - 150)];
        const d = Math.hypot(a[0] - c[0], a[1] - c[1]) || 1, ux = (a[0] - c[0]) / d, uy = (a[1] - c[1]) / d;
        const grow = K.ease.out(K.clamp(p / 0.45)), ex = a[0] - ux * (d - R) * grow, ey = a[1] - uy * (d - R) * grow;
        ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(a[0], a[1], 6, 0, 7); ctx.fill();
        const pop = K.ease.outBack(K.clamp((p - 0.35) / 0.4));
        if (pop > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(c[0], c[1], R * pop, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
          ctx.globalAlpha = (1 - q) * K.clamp((p - 0.45) / 0.3); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 30px "IBM Plex Mono"'; ctx.fillStyle = INK; ctx.fillText(String(n), c[0], c[1] + 2);
          const tx = c[0] + R + 18 - (1 - K.ease.out(K.clamp((p - 0.4) / 0.5))) * 14;
          ctx.textAlign = 'left'; ctx.font = '700 50px "Inter"'; ctx.letterSpacing = '3px'; halo(ctx, L.name, tx, c[1] + 2);
          ctx.font = '500 38px "Inter"'; ctx.letterSpacing = '0px'; halo(ctx, L.note, tx, c[1] + 50);
          if (L.big) {   // the key number, large, landing on its word
            const b = K.seg(t, L.big.at, L.big.at + 0.45, K.ease.outBack);
            if (b > 0) { ctx.globalAlpha = (1 - q) * K.clamp(b * 2); ctx.font = '800 86px "Inter"'; ctx.save(); ctx.translate(tx, c[1] + 140); ctx.scale(0.85 + 0.15 * b, 0.85 + 0.15 * b); ctx.fillStyle = ACCENT; halo(ctx, L.big.text, 0, 0, 10); ctx.fillStyle = ACCENT; ctx.fillText(L.big.text, 0, 0); ctx.restore(); }
          }
        }
        ctx.restore();
      }
      // the battery readout: a big counter beside the rack, live from the module schedule
      const fmt = (n) => 'Rs ' + n.toLocaleString('en-US');
      const RO = { at: T.mods[1] - 0.1, out: B.perhome.s + 0.6 };
      function readout(ctx, t, W, H) {
        const p = K.seg(t, RO.at, RO.at + 0.5), q = K.seg(t, RO.out - 0.4, RO.out); if (p <= 0 || q >= 1) return;
        let lit = 0; for (const m of mods) if (m.k <= CAP && t >= m.at) lit = m.k;
        const placed = t >= T.mods[12] ? 12 : t >= T.mods[11] ? 11 : lit, cap = t >= T.max;
        const a = px([RX + RW / 2 + 0.05, modY(Math.max(1, lit)), RZ + RD / 2], W, H);
        const x = K.clamp(a[0] + 120, 80, W - 760), y = K.clamp(a[1] - 40, 220, H - 260);
        ctx.save(); ctx.globalAlpha = (1 - q) * K.clamp(p * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(x - 14, y - 30); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(x - 14, y - 30); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(a[0], a[1], 6, 0, 7); ctx.fill();
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.font = '600 40px "IBM Plex Mono"'; halo(ctx, `${placed > lit ? lit + '+' : lit} kWh`, x, y - 40);
        // the last number changed? give it a small kick
        const last = Math.max(...mods.filter((m) => m.k <= CAP && t >= m.at).map((m) => m.at), -9), kick = 1 + 0.12 * (1 - K.seg(t, last, last + 0.25, K.ease.out));
        ctx.save(); ctx.translate(x, y + 60); ctx.scale(kick, kick); ctx.font = '800 96px "Inter"'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 10; ctx.strokeText(fmt(Math.min(lit, CAP) * RS), 0, 0); ctx.fillStyle = ACCENT; ctx.fillText(fmt(Math.min(lit, CAP) * RS), 0, 0); ctx.restore();
        ctx.font = '500 38px "Inter"'; halo(ctx, cap ? 'maximum: 10 kWh or more' : 'Rs 25,000 per kWh', x, y + 120);
        ctx.restore();
      }

      // ================================================================ 6. CAMERA: one continuous crane through the board
      // keys: [time, [azimuth deg, elevation deg, distance, aim x, y, z]]. Times come from BEATS.
      const cam = K.path([
        [0, [-24, 9, 10.5, PC[0] + 0.1, 0.75, PC[1] + 0.6]],
        [B.budget.w.parliament, [-16, 15, 13.5, PC[0], 0.9, PC[1] + 0.2]],
        [B.rooftop.s + 1.5, [-12, 17, 15, PC[0] + 4, 0.8, 1.2]],
        [B.rooftop.w.rooftop + 0.6, [-12, 18, 14.5, -0.6, 1.7, 0.6]],
        [B.battery.w.amount, [10, 15, 12.5, 1.4, 1.4, 0.7]],
        [B.perkwh.w.one, [22, 9, 7.0, RX + 0.35, 0.95, RZ]],
        [B.ten.w.amount, [30, 11, 7.2, RX + 0.35, 0.95, RZ]],
        [B.perhome.w.amount, [12, 17, 13.5, 1.2, 1.4, 0.4]],
        [B.fund.w.fund + 2.6, [2, 36, 34, -2.5, 0.4, -4.5]],
        [B.levy.w.imported + 0.5, [-18, 22, 14, 18.6, 1.0, 1.2]],
        [B.levy.w.remove + 1.5, [-24, 20, 10.5, 17.2, 0.7, 2.0]],
        [B.saving.w.amount + 1.5, [6, 26, 24, 10, 0.6, 2.0]],
        [B.netplus.w.netplus + 1, [6, 13, 12.5, 1.6, 1.6, 1.8]],
        [B.notice.s + 1.4, [-10, 11, 8.5, -3.6, 0.9, 2.4]],
        [B.notice.e - 0.6, [-16, 13, 9.5, -3.4, 0.95, 2.3]],
        [DURATION + 2, [-3, 38, 64, 2.6, 0, -2.0]],
      ]);

      return {
        update(t) {
          bookLight.intensity = 2.5 + 0.25 * Math.sin(t * 2.4); book.material.emissiveIntensity = 0.55 + 0.05 * Math.sin(t * 2.4);
          for (const p of panels) p.set(K.seg(t, p.at, p.at + 0.22, K.ease.out), 0.5 * K.seg(t, p.at, p.at + 0.08) * (1 - K.seg(t, p.at + 0.08, p.at + 0.6, K.ease.out)));
          // conduits fill; up to two beads ride the leading fronts
          const live = [];
          for (const r of runs) { const u = K.seg(t, r.t0, r.t1); r.u.uHead.value = u * 1.001; r.u.uTime.value = t; if (r.bead && t >= r.t0 && t < r.t1) live.push([r, u]); }
          beads.forEach((b, i) => { const L = live[live.length - 1 - i]; b.b.visible = !!L; b.l.intensity = L ? 0.45 : 0; if (L) { b.b.position.copy(L[0].curve.getPointAt(L[1])); b.l.position.copy(b.b.position); b.l.position.y += 0.3; } });
          battSign(K.seg(t, T.branch[1], T.branch[1] + 0.3, K.ease.out));
          // battery modules: 1-10 light on their beat; 11-12 drop in later and stay white
          for (const m of mods) {
            if (m.k <= CAP) m.set(K.seg(t, m.at, m.at + 0.18, K.ease.out), 0.7 * K.seg(t, m.at, m.at + 0.06) * (1 - K.seg(t, m.at + 0.06, m.at + 0.5, K.ease.out)));
            else { const d = K.seg(t, m.at, m.at + 0.45, K.ease.outBounce); m.g.position.y = modY(m.k) + (1 - d) * 1.4; m.g.visible = t >= m.at - 0.01; }
          }
          const mt = K.seg(t, T.max, T.max + 0.5, K.ease.outBack); maxTab.position.set(RX + RW / 2 + 0.02 + (1 - mt) * 0.9, MAX_Y, RZ + RD / 2 - 0.12); maxTab.visible = mt > 0.001;
          // the neighbourhood
          for (const h of homes) { const k = K.seg(t, h.at, h.at + 0.25, K.ease.out), f = 0.6 * K.seg(t, h.at, h.at + 0.06) * (1 - K.seg(t, h.at + 0.06, h.at + 0.5)); h.roof(k, f); h.batt(K.seg(t, h.at + 0.15, h.at + 0.4, K.ease.out), f); }
          // the levy block: sits on the crate, then is lifted off and set down aside
          const lv = K.seg(t, T.levyOff, T.levyOff + 1.1, K.ease.inOut), lift = Math.sin(Math.PI * lv) * 0.9;
          levy.position.set(K.lerp(LEVY_ON[0], LEVY_OFF[0], lv), K.lerp(LEVY_ON[1], LEVY_OFF[1], lv) + lift, K.lerp(LEVY_ON[2], LEVY_OFF[2], lv)); levy.rotation.set(0, -0.5 * lv, 0.25 * Math.sin(Math.PI * lv));
          crateSign(K.seg(t, T.crate, T.crate + 0.3, K.ease.out));
          meterSign(K.seg(t, T.netplus - 0.35, T.netplus, K.ease.out));
          // the notice hinges up from the board
          nCard.rotation.x = -Math.PI / 2 * (1 - K.seg(t, T.notice, T.notice + 0.9, K.ease.outBack)) - 0.14 * K.seg(t, T.notice, T.notice + 0.9);
          notice.visible = t > T.notice - 0.05;
          // camera
          const c = cam(t), az = c[0] * Math.PI / 180, el = c[1] * Math.PI / 180, aim = [c[3], c[4], c[5]];
          K.look(camera, [aim[0] + c[2] * Math.sin(az) * Math.cos(el), aim[1] + c[2] * Math.sin(el), aim[2] + c[2] * Math.cos(az) * Math.cos(el)], aim);
          K.focus(camera, aim, 0.075 * c[2] / 13);
          // the daylight follows the shot, so its shadows stay crisp near and still cover the whole board far away
          const sz = K.clamp(c[2] * 0.62, 7, 34);
          sun.target.position.set(...aim); sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 60);
          if (sun.shadow.camera.right !== sz) { const sc = sun.shadow.camera; sc.left = sc.bottom = -sz; sc.right = sc.top = sz; sc.updateProjectionMatrix(); const kc = sky.shadow.camera; kc.left = kc.bottom = -sz; kc.right = kc.top = sz; kc.updateProjectionMatrix(); }
          sky.target.position.set(aim[0], 0.5, aim[2]);
        },
        overlay(ctx, t, W, H) {
          camera.updateMatrixWorld();
          LABELS.forEach((L, i) => label(ctx, L, i + 1, t, W, H));
          readout(ctx, t, W, H);
        },
      };
    },

    sound(k) {
      k.bed('room', 0, DURATION, { gain: 0.8 });
      k.music('pad', 0, DURATION, { bpm: 60, chords: [['D4', 'F#4', 'A4', 'C#5'], ['B3', 'D4', 'F#4', 'A4']], gain: 0.5 });
      // the book glows from frame one: a soft warm air
      k.noise(0, { dur: 2.2, color: 'pink', filter: 'bandpass', f: [[0, 1600], [2.2, 3200]], q: 1.4, gain: 0.05, a: 0.4, hold: 1.2, pan: -0.4, verb: 0.3 });
      // every label lands with a small pop
      k.withMinor(() => LABELS.forEach((L, i) => k.play('pop', L.at + 0.35, { gain: 0.35, f: 520 + (i % 6) * 40 })));
      // the subsidy leaves the parliament and runs to the house
      k.play('whoosh', T.trunk[0], { gain: 0.35, dur: T.trunk[1] - T.trunk[0], top: 1800, pan: -0.3 });
      const SCALE = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6', 'B6', 'D7', 'E7'];
      k.withMinor(() => panelTimes().forEach((t, i) => { k.play('tick', t, { gain: 0.6, f: 2400 + i * 160, pan: -0.1 }); k.tone(t, { f: SCALE[i % SCALE.length], dur: 0.25, gain: 0.07, pan: -0.1, verb: 0.3 }); }));
      // the branch reaches the battery: a click, and the key number lands
      k.play('click', T.branch[1], { gain: 0.8, pan: 0.2 }); k.play('tock', T.branch[1] + 0.04, { gain: 0.5, f: 520, pan: 0.2 });
      k.play('ding', B.battery.w.amount, { gain: 0.6, f: 'A5', pan: 0.2 });
      // the modules: a card tock and a rising note each; 11 and 12 just land as card, no note
      for (let m = 1; m <= 10; m++) { k.play('tock', T.mods[m], { gain: 0.55, f: 640 + m * 30, pan: 0.25 }); k.tone(T.mods[m], { f: SCALE[m - 1], dur: 0.35, gain: 0.08, pan: 0.25, verb: 0.3 }); }
      k.withMinor(() => [11, 12].forEach((m) => k.play('thud', T.mods[m] + 0.3, { gain: 0.35, f: 180, pan: 0.25 })));
      k.play('stamp', T.max + 0.35, { gain: 0.6, pan: 0.3 });
      k.play('success', B.perhome.w.amount, { gain: 0.35, f: 'D6' });
      // the fund spreads through the neighbourhood: one soft note per home
      k.play('whoosh', T.fund[0], { gain: 0.45, dur: 1.4, top: 2600, pan: -0.2 });
      k.withMinor(() => homeTimes().forEach((t, i) => { k.play('tick', t, { gain: 0.5, f: 2600 + i * 90 }); k.tone(t, { f: SCALE[i % SCALE.length], dur: 0.3, gain: 0.05, verb: 0.35, pan: -0.6 + i * 0.1 }); }));
      k.play('sparkle', T.fund[1], { gain: 0.8 });
      // to the port
      k.play('whoosh', B.levy.s + 0.2, { gain: 0.5, dur: 1.6, top: 2000, pan: 0.6 });
      k.play('swish', T.levyOff, { gain: 0.5, pan: 0.5 }); k.play('slap', T.levyOff + 1.1, { gain: 0.5, pan: 0.4 });
      k.play('ding', T.crate + 0.1, { gain: 0.4, f: 'E6', pan: 0.6 });
      k.play('whoosh', T.saving[0], { gain: 0.4, dur: T.saving[1] - T.saving[0], top: 2400, pan: 0.2 });
      k.play('ding', B.saving.w.amount, { gain: 0.55, f: 'B5' });
      // Net Plus
      k.play('click', T.netplus - 0.35, { gain: 0.6, f: 1500 }); k.play('tock', T.netplus, { gain: 0.5, f: 700 });
      // the notice hinges up
      k.play('paper', T.notice, { gain: 0.8, dur: 0.5 }); k.play('slap', T.notice + 0.55, { gain: 0.3 });
      k.withMinor(() => [B.notice.w.apply, B.notice.w.date].forEach((t) => k.play('stroke', t, { material: 'pencil', dur: 0.3, gain: 0.7 })));
      // the end: the whole board in view
      k.play('riser', B.goal.s - 0.4, { gain: 0.5, dur: 1.6 });
      k.play('success', B.goal.w.homes + 0.2, { gain: 0.4, f: 'D6' });
    },
  });
  // shared timing for the score
  function panelTimes() { const a = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) a.push(T.panels + (c + r * 0.6) * T.panelStep); return a.sort((x, y) => x - y); }
  function homeTimes() { return HOME_TIMES.slice().sort((x, y) => x - y); }
}
