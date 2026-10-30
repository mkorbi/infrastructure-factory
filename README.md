# Infrastructure Factory

Software factories need infrastructure factories. This repository holds the website that makes the case:
coding agents made code cheap, the environments that code needs still wait for a ticket, and the platform
that closes that gap deserves a name, a production line and its own metrics.

It is a working concept, and it is meant to be argued with. See [Contributing](#contributing).

## What is an Infrastructure Factory

> An Infrastructure Factory is a platform that turns intents, from humans or agents, into compliant,
> owned, observable, cost-attributed environments, with no ticket in the path.

The software factory of 2025 and 2026 is a production system: agents write most new code around the
clock, and engineers build the factories that build the software. Every change that leaves it needs an
environment, and that request still stops at a gate a human opens a few times a day. The Infrastructure
Factory is the second production line, the one the software factory runs on. Its input is an intent
(what the environment is for, who owns it, what data it touches, how long it lives). Its output is an
environment that arrives already owned, already compliant, already observable and already attributed to
a cost center. The human decisions that used to live in tickets, such as cost center, compliance owner,
data classification and on-call owner, are encoded once as defaults, delegations and policies, so a
request from an agent at any hour is served without a person in the path.

It is not an AI factory in NVIDIA's sense, not an account vending machine on its own, not a developer
portal and not an IaC generator. Each of those is at most one part of it.

The page covers the definition in detail, the evidence that the bottleneck moved from code to delivery,
the symmetry with the software factory, why the hard part is ownership rather than Terraform, the
lineage from Kessel Run to Platform One, one production line built from open source building blocks,
why a cloud factory is the easy case, six metrics, and twelve factors.

The site is static: nine pages, one stylesheet, one script. Together they cover:

- the working definition and what the term does not mean
- what a software factory is, from thirteen of its own sources, and why it needs an infrastructure factory
- what an infrastructure factory is: the definition taken apart, the parts it is made of, what it is not, the line and its loop, a ladder from ticket desk to factory, and a test for whether you have one
- how the software, AI and infrastructure factories share a floor without sharing a product
- a live two-lane queue model of the thesis
- the evidence that the bottleneck moved from code to delivery (Google, Uber, Faros AI, CircleCI, GKE)
- the symmetry between the software factory and the infrastructure factory
- why the hard part is ownership rather than Terraform, and why it is hard right now
- the lineage from the 1968 software factory to Kessel Run and Platform One
- one production line, end to end, built from open source building blocks
- why a cloud Infrastructure Factory is the easy case: NIST's five cloud characteristics as the yardstick, what changes on the line off the cloud, and four terrains (hyperscaler, virtualization estates, bare metal and edge, sovereign and regulated)
- six metrics, the DORA equivalents for environments, with a Little's law calculator
- a short manifesto and the twelve factors of an Infrastructure Factory
- prior art, the lineage, and the caveats on every figure
- three diagrams, with PNG exports for slides and articles

## Pages

| Route | Job |
|---|---|
| `/` | The pitch: definition, the shift in three numbers, the live-model teaser, the three roles of infrastructure, the overlap with NVIDIA's AI factory, the five-line test, where to start |
| `/software-factory/` | What a software factory is (a consensus definition from thirteen sources), its loop, the floor it runs on, the gap, and why it needs an infrastructure factory |
| `/infrastructure-factory/` | The definition taken apart, components, what it is not, the seven-station line, the loop, the workers, the twelve factors, the checklist, the maturity ladder, where to start |
| `/three-factories/` | Software, AI and infrastructure factories: three products, the shared floor, seams and owners, the glue |
| `/evidence/` | The full live model, the figures and charts, the four pressures, the terrain analysis |
| `/metrics/` | Six metrics with their software-side counterparts, Little's law, outcomes not tokens |
| `/lineage/` | The timeline from 1968 to Platform One, and who already uses the words |
| `/sources/` | Every figure, numbered; caveats |
| `/presentations/` | Talks as reveal.js decks, presentable from the browser with speaker notes and a timer, each also as a PDF; the keys; how to add a deck |
| `/about/` | Status and changelog, contribute, cite, diagrams |

Old single-page anchors such as `/#factors` redirect to the new pages.

## Files

| Path | Purpose |
|---|---|
| `index.html`, `<slug>/index.html` | The nine pages. The header, footer and head block are duplicated on every page and must stay identical |
| `assets/site.css` | Styles, light and dark, driven by design tokens on `:root` |
| `assets/site.js` | Old-anchor redirects, theme switch, menu, tooltips, the calculator and the queue model |
| `assets/img/*.png` | 2x PNG exports of every diagram, linked from each figure and from `/about/#diagrams` |
| `assets/img/og/*.png` | 1200x630 title cards used as `og:image` |
| `assets/img/logo.svg`, `assets/img/logo-mono.svg`, `assets/img/logo.png` | The mark: a loop carrying two units of work, standing on a three-step floor. Used in the header, the favicon and the title cards |
| `sitemap.xml`, `robots.txt`, `CNAME`, `.nojekyll` | Deployment files for GitHub Pages at infrastructure-factory.com |
| `llms.txt` | What the site is about, in plain text for AI agents and crawlers, following the llms.txt convention |
| `scripts/check-nav.sh` | Dev-only: fails if the header block differs between pages |
| `scripts/check-site.mjs` | Dev-only: the acceptance checks (headings, links, sources, figures, dashes, overflow, redirects, theme, no-JS) |
| `scripts/export-png.mjs`, `scripts/og-template.html` | Dev-only: renders the diagram PNGs and the title cards |
| `presentations/<slug>/slides.md` | A presentation: a front matter block, then Markdown slides. The source of truth for a deck |
| `presentations/<slug>/index.html`, `presentations/<slug>/<slug>.pdf`, `presentations/index.html`, `presentations/decks.json` | Generated from the slides by `scripts/build-decks.mjs` and committed, so the site still deploys as is |
| `presentations/theme/infra.css`, `presentations/vendor/reveal.js/` | The deck theme on the site's tokens, and the pinned reveal.js files the decks load (MIT, vendored by `scripts/vendor-reveal.mjs`) |
| `scripts/build-decks.mjs`, `scripts/deck-template.html` | Builds the deck pages, the list, the sitemap entries and `decks.json`; `--pdf` exports the PDFs, `--check` verifies that everything generated is current |
| `.github/workflows/presentations.yml` | The pipeline: checks the decks on pull requests, builds and publishes them after a merge to `main` |
| `docs/screenshots/` | Screenshots used in pull requests |

The scripts need Node and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`). The deploy does not depend on them; their output is committed.

## Run it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Links are root-relative, so serve the repository root, not a subfolder. The pages have no build step; the presentations are the one generated part, see below. The only third parties are Google Fonts and GoatCounter, which counts page views without cookies and skips localhost, so local runs are not counted.

Before opening a pull request, run the checks:

```sh
sh scripts/check-nav.sh
node scripts/check-site.mjs
```

If you changed a diagram, regenerate the PNGs with `node scripts/export-png.mjs` and commit them.

## Presentations

`/presentations/` lists the talks and presents them from the browser with [reveal.js](https://revealjs.com): F for full screen, S for the speaker view with notes and a timer. Each deck is one folder under `presentations/` with a `slides.md`:

~~~md
---
title: No ticket in the path
subtitle: Why software factories need infrastructure factories, in ten minutes
date: 2026-10-30
author: Max Körbächer
duration: 10 min
description: One sentence for the card on the list and the page description.
theme: dark
---

<!-- .slide: class="title" -->
# First slide

The subtitle line

---

## Second slide

- Markdown, with `--` between vertical slides

Note:
Speaker notes, shown in the speaker view.
~~~

Slides are separated by a line with `---`, vertical slides by a line with `--`, each surrounded by blank lines. Images live in the deck's folder and are referenced relatively; the site's diagrams are at `../../assets/img/`. `title`, `date` and `author` are required. `subtitle`, `event`, `duration`, `description`, `theme` (`light` or `dark`), `pdf: false`, `draft: true` (built, not listed) and `order` (sorts decks that share a date) are optional. The theme adds `class="title"` and `class="statement"` slides and the helpers `.eyebrow`, `.src`, `.stats`, `.cols`, `.steps` and `.ladder`; the two decks in the repository use all of them. Site rules apply: every figure names its source, no em dashes.

Build locally and commit the result:

```sh
node scripts/build-decks.mjs          # the deck pages, the list, the sitemap entries and decks.json
node scripts/build-decks.mjs --pdf    # also the PDFs (needs Playwright with Chromium)
node scripts/build-decks.mjs --check  # exit 1 if anything generated is out of date
```

The pipeline in `.github/workflows/presentations.yml` runs the check on every pull request that touches a deck and uploads the built decks with their PDFs as an artifact. After a merge to `main` it builds the pages, exports the PDFs with Chromium and commits the result back to `main`, which GitHub Pages deploys as usual. The workflow asks for write access to the repository contents; if `main` is protected, allow the push from GitHub Actions or run the build locally and commit it yourself.

The reveal.js files under `presentations/vendor/` are pinned to one version; `node scripts/vendor-reveal.mjs` refreshes them after the version in that script changes.

## Deploy

GitHub Pages serves it as is: Settings, Pages, deploy from a branch, pick `main` and the root folder.
`CNAME` points the site at infrastructure-factory.com, and `.nojekyll` keeps Pages from running Jekyll over the assets.

## Content

Every figure and quote on the page is attributed in its Sources section, together with the caveats that
apply to self-reported numbers. Links are deliberately omitted until each source has been re-verified.

## Contributing

Disagree with a factor, have numbers from your own environment queue, run a factory on a terrain the page
does not cover, or know a building block that fits a station better? Please contribute.

- Start in [GitHub Discussions](https://github.com/mkorbi/infrastructure-factory/discussions) for ideas,
  counter-examples, your own metrics and questions.
- Open a pull request for corrections, sources, building blocks and copy fixes.

[CONTRIBUTING.md](CONTRIBUTING.md) has the details and the ground rules: every figure carries a source and
a date, projects over products, no pitches, plain language.

## License

[Apache License 2.0](LICENSE). Copyright 2026 Max Körbächer.
