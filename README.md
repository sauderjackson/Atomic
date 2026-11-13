# Atomic

Brand-agnostic design system. The repo is the source of truth. A brand adds values. It does not change structure.

- [BRIEF.md](BRIEF.md) describes the system.
- [AGENTS.md](AGENTS.md) is what agents read first. [RULES.md](RULES.md) is next. [SKILL.md](SKILL.md) says how to compose a screen.
- `npm run build:tokens` writes `tokens/build/themes.css`.
- `npm run build:catalog` writes `catalog.json` and `AGENTS.md`.
- `npm run build:docs` writes the people-facing docs from that catalog.
- `npm run check` validates themes, blocks raw values in code, and fails if the catalog or the docs are stale.
- `npx atomic audit` names any raw color or size and suggests the token to use.
- `npx atomic sync` fails when the docs, catalog, agent rules, and token source disagree.
- `npx atomic decisions` checks the practice app. `npm run sync:product` rewrites `decisions/`.
- `npm run product` opens the practice app.
- [docs/gate.md](docs/gate.md) lists the checks GitHub runs before a change can merge.
- `npm run catalog` opens the live web catalog.
- `npm run docs` opens the docs site.
- [CHANGELOG.md](CHANGELOG.md) says what changed and how to adopt it.
- `agents/astro` is the lead agent.

## Roadmap

One phase at a time. The kit we have today stays the source until the later phases exist.

1. Agent files. Done. Agents get a rule list, a skill file, and a generated catalog.
2. Docs for people. Done. A docs site, token tables, a gallery, and a changelog.
3. Audit and the gate. Done. `npx atomic audit` suggests a token for a raw value, `npx atomic sync` keeps the readers in agreement, and GitHub runs both before merge.
4. Sample product and the 12-hour sync. Done. The practice app is `examples/product`. Every 12 hours a job writes an adopt, candidate, or leave-out decision. A candidate is adopted on its second use.
5. Engineer agent and release. Not started. A scored build, then a versioned release.
