// Renders the piece to MP4 segments in headless Chromium: node render/render.js <worker> <workers> [samples]
// Each 5 s segment is written by its own ffmpeg; finished segments are skipped, so the job can be resumed.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const [worker, workers, samples] = [+process.argv[2] || 0, +process.argv[3] || 1, +process.argv[4] || 6];
const OUT = path.join(__dirname, 'segments'), FPS = 30, CHUNK = 150, URL = process.env.URL || 'http://localhost:8811/frame.html';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  await p.goto(`${URL}?n=${samples}`);
  await p.waitForFunction(() => window.READY, null, { timeout: 300000 });
  const D = await p.evaluate(() => window.DURATION), N = Math.round(D * FPS), chunks = Math.ceil(N / CHUNK);
  for (let c = worker; c < chunks; c += workers) {
    const file = path.join(OUT, `seg_${String(c).padStart(3, '0')}.mp4`);
    if (fs.existsSync(file)) continue;
    const tmp = file.replace('.mp4', '.tmp.mp4');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1080x1920', '-r', String(FPS), '-i', '-', '-vf', 'vflip', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-threads', '2', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((r) => ff.on('close', r));
    const t0 = Date.now();
    for (let i = c * CHUNK; i < Math.min(N, (c + 1) * CHUNK); i++) {
      const b64 = await p.evaluate((t) => {
        seek(t);
        const g = S.renderer.getContext(), px = new Uint8Array(1080 * 1920 * 4);
        g.readPixels(0, 0, 1080, 1920, g.RGBA, g.UNSIGNED_BYTE, px);
        let s = ''; for (let k = 0; k < px.length; k += 0x8000) s += String.fromCharCode.apply(null, px.subarray(k, k + 0x8000));
        return btoa(s);
      }, i / FPS);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 30 === 0) console.log(`w${worker} frame ${i}/${N} ${((Date.now() - t0) / 1000 / (i - c * CHUNK + 1)).toFixed(1)} s/frame`);
    }
    ff.stdin.end(); await done; fs.renameSync(tmp, file);
    console.log(`w${worker} wrote ${path.basename(file)}`);
  }
  await b.close();
  console.log(`w${worker} finished`);
})();
