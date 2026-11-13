# atomic

## 0.4.0

### Minor Changes

- Add the engineer score and the release bump. An adopted piece ships at 10 out of 10, with a minor bump for a new piece and a patch bump for an original piece. Anything less is parked for a person. Read docs/release.md.

## 0.3.0

### Minor Changes

- Add a practice app and a 12-hour decision job. Every new piece is marked adopt, candidate, or leave out. A candidate joins the kit the second time it is used. Run `npx atomic decisions` to see the current calls, and read docs/product.md.

## 0.2.0

### Minor Changes

- Add an audit command and a layer-sync check. GitHub runs both, plus the schema check and tests, before a change can merge. Run `npx atomic audit` to see raw colors and sizes, and read docs/gate.md for the full list.

## 0.1.0

### Minor Changes

- The first kit is ready to read and build from.
  
  How to adopt it:
  
  - Use the pieces in the docs gallery. Do not copy their colors into a new file.
  - Write a token's "what to write" value, such as var(--color-action-primary).
  - To add a brand, copy themes/_template.json to themes/your-brand.json and fill the values.
  - Run npm run build:tokens, npm run build:catalog, and npm run build:docs.
