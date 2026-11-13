# Atomic

Brand-agnostic design system. The repo is the source of truth. A brand adds values. It does not change structure.

- [BRIEF.md](BRIEF.md) describes the system.
- [AGENTS.md](AGENTS.md) is what agents read first. [RULES.md](RULES.md) is next. [SKILL.md](SKILL.md) says how to compose a screen.
- `npm run build:tokens` writes `tokens/build/themes.css`.
- `npm run build:catalog` writes `catalog.json` and `AGENTS.md`.
- `npm run check` validates themes, blocks raw values in code, and fails if the catalog is stale.
- `npm run catalog` opens the live web catalog.
- `agents/astro` is the lead agent.

## Roadmap

One phase at a time. The kit we have today stays the source until the later phases exist.

1. Agent files. Done. Agents get a rule list, a skill file, and a generated catalog.
2. Docs for people. Not started. A docs site, token tables, and a gallery.
3. Audit and the gate. Not started. A check command, and GitHub checks on every pull request.
4. Sample product and the 12-hour sync. Not started. A practice app becomes the source the kit copies.
5. Engineer agent and release. Not started. A scored build, then a versioned release.
