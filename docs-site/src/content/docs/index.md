---
title: Start here
description: How to read Atomic and add a brand.
---

Atomic is a shared kit of colors, type, and pieces. A brand adds values. It does not change the pieces.

## Read this first

- Foundations lists every token, what it is for, and its value in Neutral and Harbor.
- Components lists the five pieces and when to use them.
- The gallery shows those pieces in light and dark, for both themes.

## Add a brand

1. Copy `themes/_template.json` to `themes/<brand>.json`.
2. Fill in the palette, type, space, radius, and motion.
3. Run `npm run build:tokens`, then `npm run build:catalog`, then `npm run build:docs`.
4. Open the gallery. The pieces should restyle without edits.

Agents read `AGENTS.md`. People read this site.
