---
title: Figma source
description: How Figma owns values and the repo owns the contract.
---

Figma is the source of truth for token **values** and visual design. The repo is the source of truth for the token **contract**, the rules, and component behavior.

## Page roles

| Role | Pages |
|---|---|
| Foundations | Color, Typography, Radius, Elevation and layers, Motion, Icons |
| Library | Button, IconButton, Checkbox, Input and Textarea, Toggle, Slider, Avatar and FacePile, Tooltip, Menu and ContextMenu, Select, Popover and PreviewCard, Modal, ScrollContainer, IconSwap, ShimmerText, ProgressRing, GlowingButton, Paper shaders, Upload deck, Status, List rows, Tabs |
| Templates | Post layouts, Recipes, Social motion, Feed post, Square post, Story, Carousel, Thumbnail, Slide layouts, Google Display, Responsive display, Social ads |
| Private | `_Playground`, `_Specs` |

Section dividers (`Foundations`, `Components`, and the rest) and `---` spacers are ignored. Every page starts with a `Page info` instance; ignore those too. The live map lives in `figma/structure.json`.

## Collections and themes

- **Primitive** has modes `Neutral` and `Okvy`. One mode becomes one theme file: `themes/neutral.json` and `themes/okvy.json`. `tokens/base.json` is regenerated from Neutral.
- **Semantic** has modes `Light` and `Dark`. Contract roles land in `tokens/semantic.json` and the mode remap files.
- **Lead** is proposed. The pull skips it.

## Contract vs PROPOSED

A Semantic variable whose description ends with `Contract role in tokens/schema.json` is a contract role. A variable whose description starts with `PROPOSED.` is skipped. Known proposed primitives (extra radii, serif/mono, okvy palette, expressive motion) are also skipped. Anything else refuses the pull until it is marked PROPOSED or added to the contract in a separate PR.

## Description format

Library components use:

```
Purpose: …
Use when: …
Don't use when: …
Props: …
Catalog: <catalog name> | candidate (…) | FieldGroup (parked …)
Spec: …
```

`npm run figma:components` parses those lines into doc proposals or `decisions/*.json` candidates.

## Publish loop

1. Design on `_Playground`.
2. Move the piece to a library page and fill the description.
3. Publish the library.
4. A relay turns Figma's `LIBRARY_PUBLISH` webhook into a GitHub `repository_dispatch` of type `figma-library-publish`.
5. `.github/workflows/figma-sync.yml` runs `figma:pull`, `build:tokens`, `figma:components`, and `build:catalog`, then opens or updates a PR on `figma-sync/auto`.
6. A person reviews. Gate must pass. Nothing merges itself to `main`.

Private components need a `_` or `.` prefix so they stay out of the publish dialog.

## Plans and secrets

| Need | Plan |
|---|---|
| Variables REST API | Enterprise |
| Code Connect publish | Organization or Enterprise |
| Committed exports under `figma/export/` | Professional fallback |

Secrets: `FIGMA_TOKEN`, `FIGMA_FILE_KEY`. Without a token, pull and drift use the committed export.

## Refused pulls and drift

A refused pull prints a plain-words reason and writes nothing. Common cases: an unknown variable, a missing contract role, a gray step change, or a Semantic value that is a raw color instead of an alias.

Drift (`checks/figma-drift.mjs`, part of Gate) fails when token files or `tokens/build/themes.css` do not match a fresh pull, when a catalog component other than Type is missing a Code Connect template, or when a generated file's hash does not match its content. Run `npm run figma:pull` to repair.
