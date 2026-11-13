# The practice app

`examples/product` is a small app built only from Atomic. It is the stand-in product the kit watches.

Every new piece in `examples/product/src/pieces` gets a decision in `decisions/`:

- **Adopt.** The piece shows up in two places. It joins the kit.
- **Candidate.** The piece shows up once. It joins the kit the second time it shows up.
- **Leave out.** The piece is marked product-only, or it is not used on a screen. A product-only piece needs a written reason. It stays out even if the app uses it twice.

Nothing without one of those decisions ships. `npx atomic decisions` fails when a decision is missing or out of date. `npm run sync:product` rewrites the decision files from the app.

GitHub runs that rewrite every 12 hours, at 7:00 AM and 7:00 PM Eastern time. If a decision changed, it opens a pull request. The change still has to pass the gate before it merges.

The three pieces in the app today show the rule:

- `FieldGroup` is used on both screens, so it is adopted.
- `NoteCard` is used once, so it is a candidate.
- `PracticeBanner` is product-only, so it is left out.
