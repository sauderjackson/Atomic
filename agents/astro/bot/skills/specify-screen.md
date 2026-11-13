---
description: Use when asked to specify a web section, hero, or screen from a theme file.
---

# Specify a screen

1. Call `validate_theme` for the theme name.
2. Call `lookup_component` for each component you expect to use.
3. If the theme is invalid, stop and report the errors.
4. Specify one primary Button. Other actions are secondary.
5. Name semantic tokens only. Refuse a raw color.
6. Chunk the screen into type, action, and content.
