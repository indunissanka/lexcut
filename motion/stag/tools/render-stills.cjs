// node tools/render-stills.cjs storyboard.html stills.json [jpgDir]
const { open } = require('./browser.cjs');
const fs = require('fs'), path = require('path');
(async () => {
  const [file, out, jpgDir] = process.argv.slice(2);
  const { browser, page, errors } = await open(file, { query: process.env.Q || '?manual' });
  const t0 = Date.now();
  await page.waitForFunction(() => window.renderAll, null, { timeout: 120000 });
  await page.evaluate(() => window.renderAll());
  const stills = await page.evaluate(() => window.STILLS || null);
  console.log('seconds', ((Date.now() - t0) / 1000).toFixed(0), 'status:', await page.textContent('#status'));
  errors.forEach((e) => console.log(e.slice(0, 300)));
  if (stills) {
    fs.writeFileSync(out, JSON.stringify(stills));
    if (jpgDir) { fs.mkdirSync(jpgDir, { recursive: true }); stills.forEach((s, i) => fs.writeFileSync(path.join(jpgDir, `panel-${String(i + 1).padStart(2, '0')}.jpg`), Buffer.from(s.split(',')[1], 'base64'))); }
  }
  await browser.close();
})();
