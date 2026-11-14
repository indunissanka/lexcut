const { open } = require('./browser.cjs');
(async () => {
  const [file, query] = process.argv.slice(2);
  const { browser, page } = await open(file, { query });
  await page.waitForFunction(() => window.READY, null, { timeout: 300000 });
  const ms = await page.evaluate(() => { const r = []; for (const t of [30, 30.033, 60, 90]) { const a = performance.now(); window.seek(t); document.getElementById('stage').toDataURL('image/jpeg', 0.9); r.push(performance.now() - a); } return r; });
  console.log(query, ms.map((x) => (x / 1000).toFixed(2)).join(' '));
  await browser.close();
})();
