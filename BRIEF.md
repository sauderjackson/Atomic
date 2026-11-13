# Atomic: Agent-Authored Design System Framework, Project Brief

## What this is
Atomic is a brand-agnostic design system framework that lives in code. It defines the structure, rules, and tooling a design system needs, with no brand built in. Any brand can be applied later by adding one brand file of values. Humans and AI agents can both read it, follow it, and build from it across UI and web, social graphics, thumbnails, and video and motion.

It's structured using Brad Frost's Atomic Design: tokens, then atoms, molecules, organisms, templates, and pages.

## Goals
1. Build the framework once, then apply any brand by adding values, not by changing the system.
2. Make every token and component machine-readable, with a clear name, purpose, and usage rules, so an agent knows what to use and when.
3. Keep design tools (such as Figma) and code in sync, with the repo as the source of truth.
4. Catch output that breaks the system's rules automatically.
5. Keep it simple enough that a person understands it in one read.

## Scope
- **Brands:** none built in. A neutral default theme ships with the framework, and brands plug in as themes.
- **Surfaces:** UI and web, social graphics, thumbnails, video and motion.
- **Modes:** light and dark.
- **Icons:** one swappable icon library, with Lucide as the default.

## Design principles
- Apply Laws of UX (Fitts's, Hick's, and Miller's laws, and cognitive-load reduction):
  - tap targets of at least 44px
  - one primary action per screen
  - chunk forms and content into small groups
- Brand-agnostic by design:
  - Components only ever use semantic tokens (such as `color.action.primary`), never raw values.
  - A brand only supplies values; it never changes structure.
- Every token and component carries a description written for both humans and agents.
- Prefer fewer, well-documented options over many loose ones.

## How a brand plugs in
1. Copy `themes/_template.json` to `themes/<brand>.json`.
2. Fill in the brand's values: palette, fonts, radius, spacing scale, motion feel, logo, and icon set.
3. Optionally add `themes/<brand>.rules.md` for brand-specific voice and dos and don'ts.
4. Run the build and checks. Every component and template now renders in that brand.

## Repo structure (proposed)
```
atomic/
  BRIEF.md              # this file
  RULES.md              # system-wide usage rules agents read first
  tokens/
    schema.json         # required token names + types (the contract)
    base.json           # neutral default raw values
    semantic.json       # role-based tokens mapped to base
    modes/
      light.json
      dark.json
  themes/
    _template.json      # blank brand file following schema.json
    neutral.json        # default no-name theme for building + testing
  components/           # atoms → molecules → organisms, each with docs
  templates/            # social post, thumbnail, web page, video frame
  catalog.json          # index of every component: name, level, purpose, props, when to use
  icons/                # icon library adapter (Lucide default)
  checks/               # token linting + rule review
  docs/                 # "start here" guide + "add a brand" guide
```

## Default theme
Build and test everything against a neutral, no-name theme: grayscale, plus one placeholder accent and standard status colors (success, warning, error, info). This proves the framework works before any real brand is applied.

## Build phases
1. **Contract.** Write `RULES.md` and `tokens/schema.json`, which define every required token name and type.
2. **Foundations.** Base tokens, semantic tokens, and light and dark modes, using the neutral theme.
3. **Atoms.** Buttons, inputs, type styles, icons, badges, and color swatches.
4. **Molecules and organisms.** Form groups, cards, nav, headers, post layouts, and thumbnail layouts.
5. **Templates.** Social (feed, carousel, story), thumbnail, web page, and video title and lower-third.
6. **Catalog.** Generate `catalog.json` from the components so agents can discover them.
7. **Theming.** Add `_template.json`, then prove it by applying a second test theme and confirming everything restyles with no component changes.
8. **Design-tool sync.** Connect Figma through its MCP connector so variables and components mirror the repo.
9. **Checks.** Token linting (no raw values outside `tokens/` and `themes/`), schema validation for theme files, and an automated review against `RULES.md`.
10. **Handoff.** "Start here" and "add a brand" docs, ready-for-dev markers, token exports (CSS variables, JSON), and icon exports.

## Success looks like
- Adding a new brand takes one theme file and no component edits.
- Swapping the theme restyles every component and template correctly.
- An agent given only this repo and a theme file can make an on-brand social post, thumbnail, or web section.
- Nothing ships with a hard-coded value or an undocumented component.
- A new person understands the system from `docs/` in under 10 minutes.

## Open questions
- Which output formats come first: CSS variables, Tailwind config, or JSON only?
- Which surface should be built end to end first: social, thumbnails, or web?
- How strict should the checks be: warn only, or block?
- Should themes be able to override components, or only token values?

## Decisions for the live base
- CSS variables are the first export. JSON remains the source. Tailwind waits.
- Web is the first surface, proven by the catalog.
- Schema validation and the raw-value check block. A written review against this file warns until the catalog covers every component.
- A theme supplies values only. It cannot override a component.
