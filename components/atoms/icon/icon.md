# Icon

Atom. Draws one icon from the active icon set.

## Props

- `name` (`plus` or `search` or `check` or `info`): Which icon to draw.
- `iconSetId` (default `lucide`): The icon set. Any other set fails.

## When to use

Use it inside a control or next to a short label. The size comes from `size.icon`.

## When not to use

Do not import an icon library from a component. Do not use an icon as the only primary action.
