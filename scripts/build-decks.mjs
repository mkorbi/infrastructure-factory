#!/usr/bin/env node
// Builds the presentations.
//
//   presentations/<slug>/slides.md     the source: a front matter block, then Markdown slides
//   presentations/<slug>/index.html    generated: a self-contained reveal.js deck
//   presentations/<slug>/<slug>.pdf    generated with --pdf (needs Playwright with Chromium)
//   presentations/index.html           the list, between <!-- decks:start --> and <!-- decks:end -->
//   presentations/decks.json           machine-readable index of the decks
//   sitemap.xml                        deck URLs, between the same two markers
//
// Usage: node scripts/build-decks.mjs [--pdf] [--force] [--check]
//   --pdf    also export the PDF of every deck whose page changed since its last export, or has none
//   --force  with --pdf: export every PDF again (after a theme change, for example)
//   --check  write nothing; exit 1 when a deck fails validation or a generated file is out of date.
//            The pipeline runs this on pull requests.
//
// Front matter keys: title, date (YYYY-MM-DD) and author are required; subtitle, event, duration,
// description, theme (light or dark), pdf (true or false), draft (true or false), order (sorts decks
// with the same date, lowest first) and lang are optional. Slides are separated by a line with ---
// (horizontal) or -- (vertical), each surrounded by blank lines. Speaker notes follow a line "Note:".
// Site rules apply: no em dashes, no spaced en dashes.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'presentations');
const SITE = 'https://infrastructure-factory.com';
const REPO = 'https://github.com/mkorbi/infrastructure-factory';
const START = '<!-- decks:start -->', END = '<!-- decks:end -->';
const KNOWN = ['title', 'date', 'author', 'subtitle', 'event', 'duration', 'description', 'theme', 'pdf', 'draft', 'order', 'lang'];
const ORIGIN = 'http://infrastructure-factory.local';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm' };

const args = process.argv.slice(2);
for (const a of args) if (!['--pdf', '--force', '--check'].includes(a)) { console.error(`unknown option ${a}; see the comment at the top of scripts/build-decks.mjs`); process.exit(2); }
const CHECK = args.includes('--check'), PDF = args.includes('--pdf'), FORCE = args.includes('--force');

const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sha = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const pdfFile = d => path.join(DIR, d.slug, `${d.slug}.pdf`);
const errors = [];
const fail = (file, msg) => errors.push(`${rel(file)}: ${msg}`);

// ---------- read and validate ----------
function parse(src, file) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) { fail(file, 'must start with a front matter block between two lines of ---'); return null; }
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!kv) { fail(file, `cannot read front matter line "${line}"`); continue; }
    let v = kv[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    meta[kv[1].toLowerCase()] = v;
  }
  const body = m[2].replace(/^(?:[ \t]*\r?\n)+/, '').replace(/\s+$/, '') + '\n';
  return { meta, body };
}

function validate(meta, body, file) {
  for (const k of Object.keys(meta)) if (!KNOWN.includes(k)) fail(file, `unknown front matter key "${k}" (known keys: ${KNOWN.join(', ')})`);
  for (const k of ['title', 'date', 'author']) if (!meta[k]) fail(file, `front matter needs "${k}"`);
  if (meta.date && (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || Number.isNaN(Date.parse(meta.date + 'T00:00:00Z')))) fail(file, `date must be a real date written YYYY-MM-DD, got "${meta.date}"`);
  if (meta.theme && !['light', 'dark'].includes(meta.theme)) fail(file, 'theme must be light or dark');
  for (const k of ['pdf', 'draft']) if (meta[k] && !['true', 'false'].includes(meta[k])) fail(file, `${k} must be true or false`);
  if (meta.order && !/^-?\d+$/.test(meta.order)) fail(file, 'order must be a whole number');
  if (!meta.description) console.warn(`warning: ${rel(file)} has no description, so its card and its page description will be empty`);
  if (!body.trim()) fail(file, 'no slides after the front matter');
  const all = body + '\n' + Object.values(meta).join('\n');
  if (/—/.test(all)) fail(file, 'contains an em dash; the site writes a sentence, a comma or a colon instead');
  if (/\s–\s/.test(all)) fail(file, 'contains a spaced en dash; the site writes a sentence, a comma or a colon instead');
}

const slugs = fs.readdirSync(DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && fs.existsSync(path.join(DIR, e.name, 'slides.md')))
  .map(e => e.name).sort();
const decks = [];
for (const slug of slugs) {
  const file = path.join(DIR, slug, 'slides.md');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) fail(file, 'the folder name must be lower-case letters, digits and hyphens');
  const parsed = parse(fs.readFileSync(file, 'utf8'), file);
  if (!parsed) continue;
  validate(parsed.meta, parsed.body, file);
  const slides = 1 + (parsed.body.match(/^---\r?$/gm) || []).length + (parsed.body.match(/^--\r?$/gm) || []).length;
  decks.push({ slug, file, meta: parsed.meta, body: parsed.body, slides });
}
if (errors.length) { console.error(errors.map(e => 'error: ' + e).join('\n')); process.exit(1); }

// ---------- generate ----------
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'scripts', 'deck-template.html'), 'utf8');
const THEME_VERSION = sha(fs.readFileSync(path.join(DIR, 'theme', 'infra.css'), 'utf8'));

function deckPage(d) {
  const m = d.meta, dark = m.theme === 'dark';
  const vars = {
    lang: m.lang || 'en',
    themeAttr: dark ? ' data-theme="dark"' : '',
    themeColor: dark ? '#0f161c' : '#eef1f4',
    title: esc(m.title), description: esc(m.description || ''), author: esc(m.author),
    url: `${SITE}/presentations/${d.slug}/`,
    themeVersion: THEME_VERSION,
    // the Markdown plugin reads the template's text and restores this placeholder as </script>
    markdown: d.body.replace(/<\/script/gi, '__SCRIPT_END__'),
  };
  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in vars)) throw new Error(`template placeholder {{${k}}} has no value`); return vars[k]; });
}

const fmtDate = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const listed = () => decks.filter(d => d.meta.draft !== 'true').sort((a, b) =>
  b.meta.date.localeCompare(a.meta.date) || (Number(a.meta.order || 0) - Number(b.meta.order || 0)) || a.meta.title.localeCompare(b.meta.title));
const hasPdf = d => d.meta.pdf !== 'false' && fs.existsSync(pdfFile(d));

function card(d) {
  const m = d.meta;
  const meta = [fmtDate(m.date), m.event, m.duration, `${d.slides} slides`].filter(Boolean).map(esc).join(' · ');
  return [
    '<article class="deck">',
    `  <p class="deck-meta">${meta}</p>`,
    `  <h3><a href="/presentations/${d.slug}/">${esc(m.title)}</a></h3>`,
    m.subtitle ? `  <p class="deck-sub">${esc(m.subtitle)}</p>` : null,
    m.description ? `  <p class="deck-desc">${esc(m.description)}</p>` : null,
    `  <p class="deck-by">${esc(m.author)}</p>`,
    '  <div class="btn-row">',
    `    <a class="btn primary" href="/presentations/${d.slug}/">Present</a>`,
    hasPdf(d) ? `    <a class="btn" href="/presentations/${d.slug}/${d.slug}.pdf">PDF</a>` : null,
    `    <a class="btn" href="${REPO}/blob/main/presentations/${d.slug}/slides.md">Source</a>`,
    '  </div>',
    '</article>',
  ].filter(l => l !== null).join('\n');
}
const listing = () => { const shown = listed(); return shown.length ? `<div class="decks">\n${shown.map(card).join('\n')}\n</div>` : '<p class="measure">No presentations yet.</p>'; };
const sitemapEntries = () => listed().map(d => `  <url><loc>${SITE}/presentations/${d.slug}/</loc></url>`).join('\n');

function between(text, replacement, file) {
  const a = text.indexOf(START), b = text.indexOf(END);
  if (a < 0 || b < 0 || b < a) throw new Error(`${rel(file)} needs the markers ${START} and ${END}, in that order`);
  const endLine = text.lastIndexOf('\n', b) + 1;
  return text.slice(0, a + START.length) + '\n' + (replacement ? replacement + '\n' : '') + text.slice(endLine);
}

function manifest(previous) {
  const old = Object.fromEntries((previous.decks || []).map(d => [d.slug, d]));
  return JSON.stringify({
    generated: 'by scripts/build-decks.mjs; do not edit',
    site: SITE,
    decks: listed().concat(decks.filter(d => d.meta.draft === 'true')).map(d => ({
      slug: d.slug, title: d.meta.title, subtitle: d.meta.subtitle || null, event: d.meta.event || null, date: d.meta.date,
      author: d.meta.author, duration: d.meta.duration || null, description: d.meta.description || null,
      theme: d.meta.theme || 'light', draft: d.meta.draft === 'true', slides: d.slides,
      url: `${SITE}/presentations/${d.slug}/`, source: `${REPO}/blob/main/presentations/${d.slug}/slides.md`,
      pdf: hasPdf(d) ? `${SITE}/presentations/${d.slug}/${d.slug}.pdf` : null,
      pageHash: d.pageHash, pdfHash: d.pdfHash !== undefined ? d.pdfHash : (old[d.slug] ? old[d.slug].pdfHash || null : null),
    })),
  }, null, 2) + '\n';
}

// ---------- write (or compare) ----------
const changed = [];
function emit(relPath, content) {
  const abs = path.join(ROOT, relPath);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (current === content) return;
  changed.push(relPath);
  if (CHECK) return;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  console.log('wrote', relPath);
}

const manifestFile = path.join(DIR, 'decks.json');
const previous = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const previousBySlug = Object.fromEntries((previous.decks || []).map(d => [d.slug, d]));

// 1. deck pages
for (const d of decks) { const page = deckPage(d); d.pageHash = sha(page); emit(`presentations/${d.slug}/index.html`, page); }

// 2. PDFs, for decks whose page changed since the last export or that have none
if (PDF && !CHECK) {
  const todo = decks.filter(d => d.meta.pdf !== 'false').filter(d => FORCE || !fs.existsSync(pdfFile(d)) || (previousBySlug[d.slug] || {}).pdfHash !== d.pageHash);
  if (todo.length) await exportPdfs(todo); else console.log('PDFs are current');
}

// 3. the list, the sitemap and the index
const listFile = path.join(DIR, 'index.html'), mapFile = path.join(ROOT, 'sitemap.xml');
emit('presentations/index.html', between(fs.readFileSync(listFile, 'utf8'), listing(), listFile));
emit('sitemap.xml', between(fs.readFileSync(mapFile, 'utf8'), sitemapEntries(), mapFile));
emit('presentations/decks.json', manifest(previous));

if (CHECK) {
  if (changed.length) { console.error(`generated files are out of date, run "node scripts/build-decks.mjs" and commit the result:\n  ${changed.join('\n  ')}`); process.exit(1); }
  console.log(`${decks.length} deck(s) checked, generated files are current`);
} else if (!changed.length) {
  console.log(`${decks.length} deck(s), everything already current`);
}

// ---------- PDF export ----------
// The deck is served to Chromium from disk through request interception (no local server, no proxy in the way),
// opened with ?print-pdf, and printed once reveal.js has laid the slides out as .pdf-page blocks.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', '/usr/lib/node_modules/playwright', '/usr/local/lib/node_modules/playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found: npm install --no-save playwright && npx playwright install chromium');
}
async function serveFromDisk(ctx) {
  // the analytics script is stubbed so exports never count as visits and never need the network
  await ctx.route(/^https?:\/\/(gc\.zgo\.at|[^/]*goatcounter\.com)\//, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await ctx.route(ORIGIN + '/**', route => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found: ' + p });
    return route.fulfill({ status: 200, contentType: TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
}
async function exportPdfs(todo) {
  const { chromium } = loadPlaywright();
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'], proxy: proxy ? { server: proxy } : undefined });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
    await serveFromDisk(ctx);
    const page = await ctx.newPage();
    for (const d of todo) {
      await page.goto(`${ORIGIN}/presentations/${d.slug}/?print-pdf`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.Reveal && Reveal.isReady() && document.querySelector('.reveal .pdf-page') !== null, null, { timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => Array.from(document.images).every(i => i.complete), null, { timeout: 30000 });
      await page.waitForTimeout(400);
      await page.pdf({ path: pdfFile(d), preferCSSPageSize: true, printBackground: true });
      d.pdfHash = d.pageHash;
      console.log('exported', rel(pdfFile(d)));
    }
  } finally {
    await browser.close();
  }
}
