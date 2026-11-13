# Atomic rules

Read this file before adding a token, a component, or a theme. The repo is the source of truth. Figma mirrors it.

## Tokens

- Components use semantic tokens such as `color.action.primary`. They never use a raw color, a raw size, or a raw font.
- `tokens/schema.json` names every required token and its type. Do not rename a role.
- `tokens/base.json` holds the neutral raw scale.
- `tokens/semantic.json` maps each role to a raw path such as `{color.gray.0}`.
- `tokens/modes/light.json` and `tokens/modes/dark.json` remap color roles. They do not add roles.
- A theme file supplies values only: palette, fonts, radius, spacing, motion, logo, and icon set. It cannot replace a component.
- The gray steps `0` through `900` are part of the contract. A brand fills those steps. It does not add a step.
- Status hues stay success, warning, error, and info. A brand may change their values. It may not change their meaning.
- Tap targets use `size.tap`. Do not invent a second target size.
- `themes/harbor.json` is a test theme. It is not a brand.

## Components

- Every component has a name, a level, a purpose, its props, when to use it, and when not to use it. Those facts live next to the component and in `catalog.json`.
- One primary action per screen. Use `Button` variant `primary` once. Other actions use `secondary`.
- Chunk a screen into small groups. Do not show every option at once.
- Prefer a documented prop over a new component.
- Icons go through `icons/`. Lucide is the default set. A component does not import an icon library itself.

## Checks

- `npm run check` blocks a theme that breaks the schema.
- `npm run check` blocks a hex, rgb, or px value in shipped code outside `tokens/` and `themes/`.
- A review against this file warns until `catalog.json` covers every component. It does not block yet.

## Building

- Run `npm run build:tokens` after a theme or token change. Commit `tokens/build/themes.css`.
- `catalog.json` and `AGENTS.md` are generated. Run `npm run build:catalog` after a token, component doc, or rule change. Do not hand-edit them.
- The first live surface is web. Social, thumbnail, and video templates come later.
- The first export is CSS variables. Tailwind waits.
