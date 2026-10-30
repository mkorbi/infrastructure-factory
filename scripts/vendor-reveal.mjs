#!/usr/bin/env node
// Dev-only: vendors the parts of reveal.js that the decks use into presentations/vendor/reveal.js.
// The decks are self-contained pages, so nothing is loaded from a CDN at presentation time.
// Run after changing REVEAL_VERSION, then commit the result: node scripts/vendor-reveal.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REVEAL_VERSION = '5.2.1';
const FILES = [
  'LICENSE',
  'dist/reset.css', 'dist/reveal.css', 'dist/reveal.js',
  'plugin/markdown/markdown.js',
  'plugin/highlight/highlight.js', 'plugin/highlight/monokai.css',
  'plugin/notes/notes.js',
  'plugin/zoom/zoom.js',
];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'presentations', 'vendor', 'reveal.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reveal-'));
execFileSync('npm', ['pack', `reveal.js@${REVEAL_VERSION}`, '--pack-destination', tmp, '--silent'], { stdio: 'inherit' });
const tgz = fs.readdirSync(tmp).find(f => f.endsWith('.tgz'));
if (!tgz) throw new Error('npm pack produced no tarball');
execFileSync('tar', ['-xzf', path.join(tmp, tgz), '-C', tmp]);
fs.rmSync(DEST, { recursive: true, force: true });
for (const f of FILES) {
  const out = path.join(DEST, f);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(path.join(tmp, 'package', f), out);
  console.log('vendored', path.relative(ROOT, out));
}
fs.writeFileSync(path.join(DEST, 'VERSION'), `reveal.js ${REVEAL_VERSION}\nhttps://revealjs.com, MIT license, see LICENSE.\nVendored by scripts/vendor-reveal.mjs; do not edit these files by hand.\n`);
fs.rmSync(tmp, { recursive: true, force: true });
