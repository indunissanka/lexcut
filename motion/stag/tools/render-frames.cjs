// node tools/render-frames.cjs player.html outDir "<query>" [from] [to]
// Renders frames i/30 to outDir/f00000.jpg ..., skipping frames that already exist (so it can resume).
const { open } = require('./browser.cjs');
const fs = require('fs'), path = require('path');
(async () => {
  const [file, dir, query, from, to] = process.argv.slice(2);
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await open(file, { query });
  await page.waitForFunction(() => window.READY, null, { timeout: 600000 });
  const D = await page.evaluate(() => window.DURATION), N = Math.round(D * 30);
  const a = +(from || 0), b = Math.min(N, to == null ? N : +to);
  const t0 = Date.now(); let done = 0;
  for (let i = a; i < b; i++) {
    const f = path.join(dir, `f${String(i).padStart(5, '0')}.jpg`);
    if (fs.existsSync(f)) continue;
    const url = await page.evaluate((t) => { window.seek(t); return document.getElementById('stage').toDataURL('image/jpeg', 0.94); }, i / 30);
    fs.writeFileSync(f + '.tmp', Buffer.from(url.split(',')[1], 'base64')); fs.renameSync(f + '.tmp', f);
    done++;
    if (done % 20 === 0) console.log(`frame ${i + 1}/${N}  ${((Date.now() - t0) / done / 1000).toFixed(2)} s/frame`);
  }
  errors.forEach((e) => console.log(e.slice(0, 300)));
  console.log('finished', a, b, N);
  await browser.close();
})();
