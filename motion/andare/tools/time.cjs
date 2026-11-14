const { open } = require('./browser.cjs');
(async () => {
  for (const [w, h, n] of [[1920, 1080, 4], [1280, 720, 4], [1280, 720, 8]]) {
    const { browser, page, errors } = await open(process.argv[2], { query: `?render&samples=${n}&w=${w}&h=${h}` });
    await page.waitForFunction(() => window.READY, null, { timeout: 300000 });
    const ms = await page.evaluate(() => { const r = []; for (const t of [30, 30.033, 60]) { const a = performance.now(); window.seek(t); document.getElementById("stage").toDataURL("image/jpeg", 0.9); r.push(performance.now() - a); } return r; });
    const g = await page.evaluate(() => { const c = document.getElementById('stage').getContext('webgl2'); return 1; }).catch(() => 0);
    console.log(w, h, n, ms.map((x) => (x / 1000).toFixed(2)).join(' '), errors.slice(0, 3));
    await browser.close();
  }
})();
