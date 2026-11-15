// Verify the planted foot never slides against the ground and the legs always reach their targets.
// Usage: node check-gait.js <animation.html>     (expects slip ~0 px and 0 over-stretched samples)
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2]));
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const out = []; let over = 0;
    for (let i = 0; i < 600; i++) {
      const t = i / 200, u = (t * STEP_HZ) % 1, bob = -3 * Math.cos(4 * Math.PI * u), hd = HIP_H - 6 - bob;
      for (const [uu, hx] of [[u, 6], [(u + .5) % 1, -4]]) {
        const [a1, a2] = legIK(uu, hx, hd);
        const lx = hx + Math.sin(a1) * LEG + Math.sin(a1 + a2) * LEG, ly = -4 + Math.cos(a1) * LEG + Math.cos(a1 + a2) * LEG;
        const ux = lx * Math.cos(LEAN) - ly * Math.sin(LEAN), uy = lx * Math.sin(LEAN) + ly * Math.cos(LEAN);
        const [tx, lift] = ankleTarget(uu);
        if (Math.hypot(ux - tx, uy - (hd + lift)) > 0.05) over++;
        if (uu < .5) out.push([hx, Math.floor(t * STEP_HZ * 2), gxAt(t) + GIRL_S * ux + GROUND_V * t]);
      }
    }
    let slip = 0; const g = {};
    for (const [h, k, v] of out) { const key = h + '_' + k; if (!(key in g)) g[key] = v; slip = Math.max(slip, Math.abs(v - g[key])); }
    return { slip, over };
  });
  console.log(`max planted-foot slip: ${r.slip.toFixed(3)} px | over-stretched samples: ${r.over}`);
  if (errs.length) console.log('page errors:', errs);
  await b.close();
})();
