# The engineer and the release

The engineer looks only at pieces marked **adopt**. It scores each one out of 10. The key, if there is one, lives in the GitHub secret `ENGINEER_API_KEY`. It is never written into the repo, and the score does not change when the key is missing.

A 10 means the piece is already in the kit and the release can take a version number:

- **Minor** for a new piece.
- **Patch** for one of the original five pieces: button, text input, type, badge, and icon.

Changesets turns that bump into the version and the changelog. Run `npx atomic engineer` to see the scores. `npm run sync:engineer` rewrites `engineer/`.

Anything under 10 is parked. The failed checks are written down, and the 12-hour job opens a GitHub note labeled `needs-human`. A person builds that piece into the kit, or drops it.

The field group is the parked piece today. It is adopted, and it is not in the kit yet.
