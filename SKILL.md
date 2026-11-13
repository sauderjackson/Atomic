# Compose a screen

Use this for any UI, social, thumbnail, or motion task.

## How to compose

1. Read [catalog.json](catalog.json). It is generated. Do not edit it.
2. Pick components that already exist. Read each one's `whenToUse` and `whenNotToUse`.
3. Use only documented props.
4. For color, type, space, radius, motion, and size, write the token's `use` field, such as `var(--color-bg-surface)`.
5. Use one `Button` with `variant` `primary`. Every other action uses `secondary`.
6. Chunk the screen into small groups.

## When to stop and ask a human

Stop and ask before you continue when any of these are true:

- The catalog has no component for the job.
- The request needs a raw color, a raw size, or a raw font.
- A theme would change a component instead of a value.
- The screen would have two primary actions.
- A new pattern has no decision of adopt, candidate, or leave out.

Do not invent a token name. Do not invent a component. Do not hand-edit [catalog.json](catalog.json) or [AGENTS.md](AGENTS.md).
