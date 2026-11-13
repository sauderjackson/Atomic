# Type

Atom. Applies a semantic type style.

## Props

- `kind` (`display` or `title` or `body` or `label`, default `body`): Picks the semantic type style.
- `children` (text): The text.

## When to use

Use `display` once for the page title, `title` for a section, `body` for reading text, and `label` for a short caption.

## When not to use

Do not set a font size, family, or weight in the caller. Do not use display more than once on a screen.
