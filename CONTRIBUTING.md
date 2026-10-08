# Contributing to the Infrastructure Factory

This site is a working concept, not a finished one. The argument gets better every time
someone pushes back on it, adds a number, names a building block, or describes a terrain
the page has not seen. If you run a platform team, build one of the projects named on the
page, or have the figures from your own environment queue, your experience is exactly what
is missing here.

## Start a discussion

Most contributions begin as a conversation, not a pull request. Use
[GitHub Discussions](https://github.com/mkorbi/infrastructure-factory/discussions) for:

- **Disagreement.** The definition, the twelve factors, the metrics and the "what it is not"
  table are all open to challenge. A good counter-example is worth more than agreement.
- **Your numbers.** Lead time from intent to environment, zero-touch rate, time to owner,
  orphan rate, how many environments a day your team ships. Anonymized is fine. Real numbers
  from real factories are the most valuable thing anyone can add.
- **Your terrain.** How the line looks on bare metal, at the edge, in a sovereign cloud, in a
  regulated industry, on a virtualization estate that is being migrated. Which stations split,
  which ones disappear, what the lead-time floor is.
- **Building blocks.** A project that implements a station better than the one named, or a
  gap where no open source project exists yet.
- **Questions.** If something on the page is unclear, that is a defect in the page.

## Open a pull request

Pull requests are welcome for anything concrete:

- Corrections, including to figures, dates and attributions.
- New sources, with a title, publisher and date. Vendor or self-reported figures must be
  marked as such, the way the page already does.
- Additional building blocks for a station, with one line on what the project does there.
- Copy fixes and clearer wording.
- Layout and accessibility fixes. The page must work at phone width, in light and dark
  themes, and with keyboard navigation.

For a larger change, such as a new section, a new factor, or a different metric set, open a
discussion first so the idea can be shaped before the writing is done.

### How to work on the page

The site is static: `index.html`, `assets/site.css` and `assets/site.js`, no build step.

```sh
git clone https://github.com/mkorbi/infrastructure-factory.git
cd infrastructure-factory
python3 -m http.server 8000
```

Open <http://localhost:8000>. Before you push, check the page at about 400px width and in
both themes; the theme switch is in the top right. Colors and fonts are tokens on `:root`
at the top of the stylesheet, so a visual change usually touches one line.

## Ground rules

- **Every figure carries a source and a date.** If it comes from a vendor, a sponsored
  study or an executive statement, say so next to the number.
- **Projects over products.** Name open source projects and cloud primitives. A product may
  appear where it is itself the evidence, never as a recommendation.
- **No pitches.** The page is vendor-neutral and stays that way.
- **Plain language.** Short sentences, concrete nouns, one idea per sentence. Write the way
  the page already reads.
- **Claim the frame, not the discovery.** Others have said that the bottleneck moved. The
  page is honest about that, and contributions should be too.
- **Be kind.** Argue with the idea, not the person.

By contributing you agree that your contribution is published under the
[Apache License 2.0](LICENSE), like the rest of this repository. Substantial contributions
are credited on the page.
