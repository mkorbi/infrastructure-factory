#!/usr/bin/env node
// Dev-only acceptance checks for the site. Needs Playwright with Chromium (see scripts/export-png.mjs).
// Run: node scripts/check-site.mjs   (exit code 1 on any failure)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'http://infrastructure-factory.local';
const PAGES = ['/', '/software-factory/', '/infrastructure-factory/', '/three-factories/', '/evidence/', '/metrics/', '/lineage/', '/sources/', '/presentations/', '/about/'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const results = [];
const ok = (name, pass, detail) => { results.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ': ' + detail : '')); };

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* fall through */ }
  for (const p of ['/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright']) { try { return require(p); } catch (e) { /* next */ } }
  throw new Error('playwright not found: npm i -D playwright');
}
const read = p => fs.readFileSync(path.join(ROOT, p === '/' ? 'index.html' : p.slice(1) + 'index.html'), 'utf8');
const fileFor = p => path.join(ROOT, p === '/' ? 'index.html' : p.slice(1) + 'index.html');

// ---------- static checks ----------
const html = Object.fromEntries(PAGES.map(p => [p, read(p)]));
const ids = Object.fromEntries(PAGES.map(p => [p, new Set([...html[p].matchAll(/\sid="([^"]+)"/g)].map(m => m[1]))]));

// one h1 per page
for (const p of PAGES) ok(`one h1 on ${p}`, (html[p].match(/<h1[\s>]/g) || []).length === 1);
// lead sentence: hero tagline or page-head lede
for (const p of PAGES) ok(`lead on ${p}`, /class="(tagline|lede)"/.test(html[p]));
// prev/next on subpages, none on home
for (const p of PAGES) ok(`prev/next on ${p}`, (p === '/') ? !html[p].includes('class="prevnext"') : html[p].includes('class="prevnext"'));
// header identical modulo aria-current, aria-current present
const hdr = p => (html[p].match(/<header class="site-nav">[\s\S]*?<\/header>/) || [''])[0].replace(/ aria-current="page"/g, '');
ok('header identical on all pages', PAGES.every(p => hdr(p) === hdr('/')));
for (const p of PAGES.filter(p => p !== '/')) ok(`aria-current on ${p}`, new RegExp(`href="${p}" aria-current="page"`).test(html[p]));
// internal links resolve
let broken = [];
for (const p of PAGES) {
  for (const m of html[p].matchAll(/href="(\/[^"#]*)?(#[^"]+)?"/g)) {
    const [, target, hash] = m; if (!target && !hash) continue;
    const page = target || p;
    if (target && !target.startsWith('/assets/') && !target.startsWith('/scripts/')) {
      if (!PAGES.includes(page)) { const f = target.split('?')[0]; if (!fs.existsSync(path.join(ROOT, f.endsWith('/') ? f + 'index.html' : f))) broken.push(`${p} -> ${target}`); continue; }
      if (hash && !ids[page].has(hash.slice(1))) broken.push(`${p} -> ${target}${hash}`);
    } else if (!target && hash && hash !== '#' && !ids[p].has(hash.slice(1))) broken.push(`${p} -> ${hash}`);
    if (target && target.startsWith('/assets/') && !fs.existsSync(path.join(ROOT, target.split('?')[0]))) broken.push(`${p} -> ${target} (missing file)`);
  }
}
ok('internal links and anchors resolve', broken.length === 0, broken.slice(0, 8).join('; '));
// sources: every cited number exists, every source cited at least once
const sourceIds = new Set([...html['/sources/'].matchAll(/id="s(\d+)"/g)].map(m => +m[1]));
const cited = new Set(); for (const p of PAGES) for (const m of html[p].matchAll(/sources\/#s(\d+)/g)) cited.add(+m[1]);
ok(`sources numbered 1 to ${Math.max(...sourceIds)} without gaps`, [...Array(Math.max(...sourceIds)).keys()].every(i => sourceIds.has(i + 1)));
ok('every source cited at least once', [...sourceIds].every(n => cited.has(n)), [...sourceIds].filter(n => !cited.has(n)).join(','));
ok('no citation to an undefined source', [...cited].every(n => sourceIds.has(n)));
// figures: every figure[data-png] has an svg with role and aria-label, a caption, a PNG link and the file
let figProblems = [];
for (const p of PAGES) for (const m of html[p].matchAll(/<figure[^>]*data-png="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g)) {
  const [, name, body] = m;
  if (!/<svg[^>]*role="img"[^>]*aria-label="[^"]+"/.test(body)) figProblems.push(`${name}: svg role/aria-label`);
  if (!/<figcaption>/.test(body)) figProblems.push(`${name}: caption`);
  if (!body.includes(`/assets/img/${name}.png`)) figProblems.push(`${name}: png link`);
  if (!fs.existsSync(path.join(ROOT, 'assets/img', name + '.png'))) figProblems.push(`${name}: png file`);
}
ok('diagram figures have role, label, caption, PNG link and file', figProblems.length === 0, figProblems.join('; '));
// charts keep table views
ok('charts keep "View as table"', (html['/evidence/'].match(/<figure class="chart"[^>]*>[\s\S]*?<details>/g) || []).length === 3);
// home contains none of the migrated sections
const migrated = ['what', 'numbers', 'symmetry', 'challenge', 'lineage', 'line', 'terrain', 'metrics', 'factors', 'prior-art', 'sources'];
ok('home has none of the migrated section ids', migrated.every(id => !ids['/'].has(id)), migrated.filter(id => ids['/'].has(id)).join(','));
// home prose word count
{
  let main = html['/'].slice(html['/'].indexOf('<main id="main">'), html['/'].indexOf('</main>'));
  for (const pat of [/<div class="stats">[\s\S]*?<\/div>\s*<\/div>/g, /<figure[\s\S]*?<\/figure>/g, /<svg[\s\S]*?<\/svg>/g, /<div class="demo-counters[\s\S]*?<\/div>\s*<\/div>/g, /<ol class="ladder-strip">[\s\S]*?<\/ol>/g, /<div class="btn-row">[\s\S]*?<\/div>/g, /<div class="closing-row">[\s\S]*?<\/div>\s*<\/div>/g]) main = main.replace(pat, ' ');
  const words = main.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length;
  ok('home prose between 600 and 900 words', words >= 600 && words <= 900, String(words));
}
// theme script before the stylesheet
for (const p of PAGES) ok(`theme script precedes stylesheet on ${p}`, html[p].indexOf('localStorage.getItem("infra-factory-theme")') < html[p].indexOf('/assets/site.css'));
// sitemap and robots
ok('sitemap lists every page', PAGES.every(p => fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').includes(`https://infrastructure-factory.com${p}</loc>`)));
ok('robots.txt present', fs.existsSync(path.join(ROOT, 'robots.txt')));
ok('llms.txt present and names the site', fs.existsSync(path.join(ROOT, 'llms.txt')) && fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8').startsWith('# Infrastructure Factory'));
ok('GoatCounter script on every page', PAGES.every(p => html[p].includes('data-goatcounter="https://korbi.goatcounter.com/count"')));
// decks: every slides.md validates and the generated deck pages, list, sitemap entries and index are current
try { execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-decks.mjs'), '--check'], { stdio: 'pipe' }); ok('decks built from their sources', true); }
catch (e) { ok('decks built from their sources', false, String(e.stderr || e.stdout || e.message).trim().split('\n').slice(0, 3).join(' | ')); }
// og images exist
ok('og:image files exist', PAGES.every(p => { const m = html[p].match(/og:image" content="https:\/\/infrastructure-factory\.com([^"]+)"/); return m && fs.existsSync(path.join(ROOT, m[1])); }));

// ---------- browser checks ----------
const { chromium } = loadPlaywright();
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'], proxy: proxy ? { server: proxy } : undefined });
async function serve(ctx) {
  // GoatCounter is the one third-party script. Stub it so checks never register as visits and never depend on the network.
  await ctx.route(/^https?:\/\/(gc\.zgo\.at|[^/]*goatcounter\.com)\//, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await ctx.route(ORIGIN + '/**', route => {
    const u = new URL(route.request().url()); let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
}
// dashes in rendered text, overflow, console errors at five widths
for (const w of [360, 400, 760, 1100, 1280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, ignoreHTTPSErrors: true, isMobile: w < 500 });
  await serve(ctx);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  let over = [], dash = [];
  for (const p of PAGES) {
    await page.goto(ORIGIN + p, { waitUntil: 'load' }); await page.waitForTimeout(250);
    const r = await page.evaluate(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth, text: document.body.innerText }));
    if (r.over > 0) over.push(`${p}:${r.over}px`);
    if (r.text.includes('—') || r.text.includes(' – ')) dash.push(p);
  }
  ok(`no horizontal overflow at ${w}px`, over.length === 0, over.join(' '));
  ok(`no console errors at ${w}px`, errs.length === 0, errs.slice(0, 3).join(' | '));
  if (w === 1280) ok('no em dash or spaced en dash in rendered text', dash.length === 0, dash.join(' '));
  await ctx.close();
}
// redirects from old anchors
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true }); await serve(ctx);
  const page = await ctx.newPage();
  const map = { what: '/infrastructure-factory/#definition', 'what-it-is': '/infrastructure-factory/#definition', numbers: '/evidence/#evidence', evidence: '/evidence/#evidence', symmetry: '/software-factory/#symmetry', challenge: '/evidence/#why-now', 'why-now': '/evidence/#why-now', lineage: '/lineage/', line: '/infrastructure-factory/#the-line', 'the-line': '/infrastructure-factory/#the-line', terrain: '/evidence/#terrain', metrics: '/metrics/', factors: '/infrastructure-factory/#factors', 'prior-art': '/lineage/#prior-art', sources: '/sources/' };
  const bad = [];
  for (const [h, target] of Object.entries(map)) {
    await page.goto(ORIGIN + '/#' + h, { waitUntil: 'load' }); await page.waitForTimeout(200);
    const u = page.url().replace(ORIGIN, '');
    const anchorOk = await page.evaluate(() => location.hash ? !!document.querySelector(location.hash) : true);
    if (u !== target || !anchorOk) bad.push(`#${h} -> ${u}`);
  }
  ok('old anchors redirect to the new pages', bad.length === 0, bad.join('; '));
  // theme persists with no flash: data-theme is present at DOMContentLoaded on the next page
  await page.goto(ORIGIN + '/metrics/'); await page.click('#theme-btn'); await page.click('#theme-btn');
  await page.goto(ORIGIN + '/about/', { waitUntil: 'domcontentloaded' });
  const early = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  ok('theme choice persists across pages before first paint', early === 'dark', String(early));
  // counters tick on home, model runs on evidence
  await page.goto(ORIGIN + '/'); await page.evaluate(() => document.getElementById('model').scrollIntoView()); await page.waitForTimeout(1200);
  const c1 = await page.evaluate(() => +document.getElementById('c-prs').textContent); await page.waitForTimeout(1500);
  const c2 = await page.evaluate(() => +document.getElementById('c-prs').textContent);
  ok('home counters are live', c2 > c1, `${c1} -> ${c2}`);
  await page.goto(ORIGIN + '/evidence/'); await page.waitForTimeout(500);
  ok('full model with canvas on /evidence/', await page.evaluate(() => !!document.getElementById('demo-canvas') && !!document.getElementById('mode-factory')));
  await ctx.close();
}
// JavaScript disabled: pages render, menu opens, details toggle
{
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, javaScriptEnabled: false, isMobile: true, ignoreHTTPSErrors: true }); await serve(ctx);
  const page = await ctx.newPage();
  let fine = true, detail = [];
  for (const p of PAGES) {
    await page.goto(ORIGIN + p, { waitUntil: 'load' });
    const r = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, menu: !!document.querySelector('label.menu-btn') }));
    if (r.h1 !== 1 || !r.menu) { fine = false; detail.push(p); }
  }
  await page.goto(ORIGIN + '/lineage/', { waitUntil: 'load' });
  const before = await page.evaluate(() => getComputedStyle(document.querySelector('.nav-links')).display);
  await page.click('label.menu-btn');
  const after = await page.evaluate(() => getComputedStyle(document.querySelector('.nav-links')).display);
  ok('pages render and the menu opens with JavaScript disabled', fine && before === 'none' && after === 'block', detail.join(' '));
  await page.goto(ORIGIN + '/evidence/', { waitUntil: 'load' });
  await page.click('figure.chart details summary');
  ok('chart table view toggles with JavaScript disabled', await page.evaluate(() => document.querySelector('figure.chart details').open));
  await ctx.close();
}
await browser.close();
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
