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

The site is a single static page. It covers:

- the working definition and what the term does not mean
- a detailed section on what an Infrastructure Factory is: the definition taken apart, the eight parts it is made of, what it is not, a ladder from ticket desk to factory, and a test for whether you have one
- a live two-lane queue model of the thesis
- the evidence that the bottleneck moved from code to delivery (Google, Uber, Faros AI, CircleCI, GKE)
- the symmetry between the software factory and the infrastructure factory
- why the hard part is ownership rather than Terraform, and why it is hard right now
- the lineage from the 1968 software factory to Kessel Run and Platform One
- one production line, end to end, built from open source building blocks
- why a cloud Infrastructure Factory is the easy case: NIST's five cloud characteristics as the yardstick, what changes on the line off the cloud, and four terrains (hyperscaler, virtualization estates, bare metal and edge, sovereign and regulated)
- six metrics, the DORA equivalents for environments, with a Little's law calculator
- a short manifesto and the twelve factors of an Infrastructure Factory
- prior art and the caveats on every figure

## Files

| Path | Purpose |
|---|---|
| `index.html` | The page |
| `assets/site.css` | Styles, light and dark, driven by design tokens on `:root` |
| `assets/site.js` | Theme switch, section nav, tooltips, the calculator and the queue model |

## Run it locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. There is no build step and no dependency besides Google Fonts.

## Deploy

GitHub Pages serves it as is: Settings, Pages, deploy from a branch, pick `main` and the root folder.
The `.nojekyll` file keeps Pages from running Jekyll over the assets.

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
