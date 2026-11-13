---
title: Icon
description: Draws one icon from the active icon set.
---

Draws one icon from the active icon set.

## When to use

Use it inside a control or next to a short label. The size comes from `size.icon`.

## When not to use

Do not import an icon library from a component. Do not use an icon as the only primary action.

## Props

| Prop | Values | Default | Required | Job |
| --- | --- | --- | --- | --- |
| `name` | `plus`, `search`, `check`, `info` | none | no | Which icon to draw. |
| `iconSetId` | `lucide` | none | no | The icon set. Any other set fails. |

## Tokens it uses

- `--size-icon`
- `--color-fg-default`

See this piece in every theme and mode on the [gallery](/gallery/).
