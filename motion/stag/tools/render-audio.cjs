// node tools/render-audio.cjs player.html effects.wav : renders the style's score (voiceover mode) to a 48 kHz WAV
const { open } = require('./browser.cjs');
const fs = require('fs');
(async () => {
  const [file, out] = process.argv.slice(2);
  const { browser, page, errors } = await open(file, { query: '?render&samples=1&w=320&h=180' });
  await page.waitForFunction(() => window.READY, null, { timeout: 600000 });
  const r = await page.evaluate(() => window.renderSound(48000));
  const pcm = Buffer.from(r.b64, 'base64'), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(r.sr, 24); h.writeUInt32LE(r.sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(out, Buffer.concat([h, pcm]));
  console.log('peak', r.peak.toFixed(3), errors.slice(0, 5));
  await browser.close();
})();
