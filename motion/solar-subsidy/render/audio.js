// Renders the sound score offline (voiceover mode) to render/effects_raw.wav
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  await p.goto((process.env.URL || 'http://localhost:8811/frame.html') + '?n=1');
  await p.waitForFunction(() => window.READY, null, { timeout: 300000 });
  const { b64, frames, peak } = await p.evaluate(async () => {
    const r = await SOUND.renderOffline((k) => style.sound(k), DURATION, 48000, { voiceover: true });
    const pcm = new Int16Array(r.inter.length);
    for (let i = 0; i < pcm.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(r.inter[i] * 32767)));
    const u8 = new Uint8Array(pcm.buffer); let s = '';
    for (let k = 0; k < u8.length; k += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000));
    return { b64: btoa(s), frames: r.frames, peak: r.peak };
  });
  const data = Buffer.from(b64, 'base64'), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(48000, 24); h.writeUInt32LE(48000 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(__dirname, 'effects_raw.wav'), Buffer.concat([h, data]));
  console.log('frames', frames, 'peak', peak.toFixed(3));
  await b.close();
})();
