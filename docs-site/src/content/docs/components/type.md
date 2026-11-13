---
title: Type
description: Applies a semantic type style.
---

Applies a semantic type style.

## When to use

Use `display` once for the page title, `title` for a section, `body` for reading text, and `label` for a short caption.

## When not to use

Do not set a font size, family, or weight in the caller. Do not use display more than once on a screen.

## Props

| Prop | Values | Default | Required | Job |
| --- | --- | --- | --- | --- |
| `kind` | `display`, `title`, `body`, `label` | `body` | no | Picks the semantic type style. |
| `children` | none | none | no | The text. |

## Tokens it uses

- `--font-family-body`
- `--color-fg-default`
- `--font-size-display`
- `--font-weight-label`
- `--font-line-height-title`
- `--font-size-title`
- `--font-size-body`
- `--font-weight-body`
- `--font-line-height-body`
- `--font-size-label`
- `--color-fg-muted`

See this piece in every theme and mode on the [gallery](/gallery/).
