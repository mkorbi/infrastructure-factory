#!/usr/bin/env node
// Dev-only. Renders every <figure data-png="name"> SVG on the site to assets/img/<name>.png at 2x on a white
// background, and renders a 1200x630 title card per page to assets/img/og/<slug>.png.
// Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`, then `node scripts/export-png.mjs`.
// The deploy does not depend on this script; its output is committed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'http://infrastructure-factory.local';
const PAGES = ['/', '/software-factory/', '/infrastructure-factory/', '/three-factories/', '/evidence/', '/metrics/', '/lineage/', '/sources/', '/presentations/', '/about/'];
// node scripts/export-png.mjs                   everything
// node scripts/export-png.mjs --og-only /about/ only the title card(s) of the named page(s)
const ARGS = process.argv.slice(2);
const FIG_PAGES = ARGS.includes('--og-only') ? [] : PAGES;
const OG_PAGES = ARGS.some(a => !a.startsWith('--')) ? PAGES.filter(p => ARGS.includes(p)) : PAGES;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* fall through */ }
  for (const p of ['/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found: npm i -D playwright');
}

async function serveFromDisk(context) {
  await context.route(ORIGIN + '/**', route => {
    const u = new URL(route.request().url());
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({ status: 200, contentType: TYPES[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
}

const { chromium } = loadPlaywright();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'], proxy: proxy ? { server: proxy } : undefined });
fs.mkdirSync(path.join(ROOT, 'assets/img/og'), { recursive: true });

// 1. figures
const done = new Set();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', ignoreHTTPSErrors: true });
await serveFromDisk(ctx);
const page = await ctx.newPage();
for (const p of FIG_PAGES) {
  await page.goto(ORIGIN + p, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const names = await page.$$eval('figure[data-png]', els => els.map(e => e.getAttribute('data-png')));
  for (const name of names) {
    if (done.has(name)) continue;
    const fig = page.locator(`figure[data-png="${name}"]`).first();
    const svg = fig.locator('svg').first();
    if (await svg.count() === 0) { console.log('skip (no svg):', name); continue; }
    await fig.scrollIntoViewIfNeeded();
    await page.evaluate(n => {
      const nav = document.querySelector('.site-nav'); if (nav) nav.style.visibility = 'hidden';
      const f = document.querySelector(`figure[data-png="${n}"]`);
      const s = f.querySelector('svg');
      const wrap = s.parentElement;
      wrap.style.overflow = 'visible';
      s.style.background = '#ffffff'; s.style.padding = '18px'; s.style.boxSizing = 'border-box'; s.style.minWidth = '0';
      s.style.width = '1120px'; s.style.height = 'auto';
    }, name);
    await page.waitForTimeout(100);
    const out = path.join(ROOT, 'assets/img', name + '.png');
    await svg.screenshot({ path: out, omitBackground: false });
    done.add(name);
    console.log('wrote', path.relative(ROOT, out));
  }
}
await ctx.close();

// 2. title cards
const tpl = fs.readFileSync(path.join(ROOT, 'scripts/og-template.html'), 'utf8');
const og = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light', ignoreHTTPSErrors: true });
await serveFromDisk(og);
const card = await og.newPage();
for (const p of OG_PAGES) {
  const file = path.join(ROOT, p === '/' ? 'index.html' : p.slice(1) + 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const slug = p === '/' ? 'home' : p.replace(/\//g, '');
  const title = (html.match(/<title>(.*?)<\/title>/) || [, slug])[1];
  const desc = (html.match(/<meta name="description" content="(.*?)">/) || [, ''])[1];
  const esc = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const body = tpl.replace('{{TITLE}}', esc(title).replace(/&/g, '&amp;').replace(/</g, '&lt;')).replace('{{DESC}}', esc(desc).replace(/&/g, '&amp;').replace(/</g, '&lt;')).replace('{{PATH}}', p === '/' ? 'infrastructure-factory.com' : 'infrastructure-factory.com' + p);
  await card.goto(ORIGIN + '/scripts/og-template.html', { waitUntil: 'load' });
  await card.setContent(body, { waitUntil: 'load' });
  await card.evaluate(() => document.fonts.ready);
  await card.waitForTimeout(300);
  const out = path.join(ROOT, 'assets/img/og', slug + '.png');
  await card.screenshot({ path: out });
  console.log('wrote', path.relative(ROOT, out));
}
await og.close();
await browser.close();
