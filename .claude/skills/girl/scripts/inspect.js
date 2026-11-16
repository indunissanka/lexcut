// Freeze the animation at chosen times and save close-up PNGs of the girl.
// Usage: node inspect.js <animation.html> <outDir> [t1,t2,...]
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const file = path.resolve(process.argv[2]);
  const out = path.resolve(process.argv[3] || '.');
  const times = (process.argv[4] || '0,0.095,0.19,0.285,0.38,0.475').split(',').map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  await p.addInitScript(() => {
    let fake = 0; window.__setT = v => { fake = v; }; performance.now = () => fake;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => raf(() => cb(fake));
  });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file);
  for (const [i, t] of times.entries()) {
    await p.evaluate(v => __setT(v * 1000), t);
    await p.waitForTimeout(150);
    const gx = await p.evaluate(v => gxAt(v), t);
    await p.screenshot({ path: path.join(out, `girl_${i}.png`), clip: { x: Math.round(gx - 170), y: 420, width: 340, height: 460 } });
  }
  if (errs.length) console.log('page errors:', errs);
  await b.close();
})();
