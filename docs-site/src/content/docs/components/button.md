---
title: Button
description: Starts an action.
---

Starts an action.

## When to use

Use `primary` for the single main action on a screen. Use `secondary` for every other action.

## When not to use

Do not use two primary buttons on one screen. Do not use a button for navigation that should be a link later. Do not put a raw color on it.

## Props

| Prop | Values | Default | Required | Job |
| --- | --- | --- | --- | --- |
| `variant` | `primary`, `secondary` | `secondary` | no | Chooses the single primary action or a secondary action. |
| `children` | none | none | no | The label a person reads. |
| `disabled` | none | `false` | no | Turns the action off. |
| `type` | `button`, `submit`, `reset` | `button` | no | Sets the button behavior. |

## Tokens it uses

- `--size-tap`
- `--space-gap`
- `--space-inset`
- `--size-border`
- `--radius-control`
- `--font-family-body`
- `--font-size-label`
- `--font-weight-label`
- `--font-line-height-body`
- `--motion-duration-control`
- `--motion-easing-standard`
- `--size-outline`
- `--color-border-focus`
- `--color-bg-subtle`
- `--color-fg-muted`
- `--color-border-default`
- `--color-action-primary`
- `--color-fg-on-primary`
- `--color-action-secondary`
- `--color-fg-default`

See this piece in every theme and mode on the [gallery](/gallery/).
