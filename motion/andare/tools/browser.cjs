// Headless Chromium with the page's CDN and font requests served from local copies (this sandbox blocks the CDN).
// THREE_DIR = folder holding three.module.js / three.core.js; FONT_DIR = folder with fraunces.css and the .ttf files.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
exports.open = async function (file, opts = {}) {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const T = process.env.THREE_DIR, F = process.env.FONT_DIR;
  await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.187\.0\/build\/(.*)$/, (r) => r.fulfill({ path: path.join(T, r.request().url().split('/build/')[1]), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }));
  await page.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ path: path.join(F, 'fraunces.css'), contentType: 'text/css' }));
  await page.route(/fonts\.gstatic\.com\/.*\/(\w+\.ttf)$/, (r) => r.fulfill({ path: path.join(F, path.basename(r.request().url())), contentType: 'font/ttf', headers: { 'access-control-allow-origin': '*' } }));
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); if (opts.log) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(file) + (opts.query || ''));
  return { browser, page, errors };
};
