# Button

Atom. Starts an action.

## Props

- `variant` (`primary` or `secondary`, default `secondary`): Chooses the single primary action or a secondary action.
- `children` (text): The label a person reads.
- `disabled` (flag, default `false`): Turns the action off.
- `type` (`button` or `submit` or `reset`, default `button`): Sets the button behavior.

## When to use

Use `primary` for the single main action on a screen. Use `secondary` for every other action.

## When not to use

Do not use two primary buttons on one screen. Do not use a button for navigation that should be a link later. Do not put a raw color on it.
