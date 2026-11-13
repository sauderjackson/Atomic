# The gate

A change does not merge unless every check below passes. GitHub runs them on every pull request.

| Check | Command | What it guards |
| --- | --- | --- |
| Token build | `npm run build:tokens` | CSS variables match the theme files. |
| Catalog build | `npm run build:catalog` | The agent catalog and the rule list match the source. |
| Docs build | `npm run build:docs` | The people-facing pages match the catalog. |
| Docs site build | `npm run build --prefix docs-site` | The showroom still builds. |
| Schema validation | `npm run check` | A theme file matches the contract. |
| Audit | `npx atomic audit` | A raw color or size outside the token files is named, and the closest token is suggested. |
| Layer sync | `npx atomic sync` | The docs, catalog.json, AGENTS.md, and the token source agree. |
| Tests | `npm test` | The audit suggestion and the layer sync stay true on this repo. |

The audit prints a findings count and how long it took. A clean run says `0 findings`. The layer sync prints `layer-sync ok` when the four readers still match.
