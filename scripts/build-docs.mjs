import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { componentSources } from "./build-catalog.mjs";
import { readJson, root } from "./tokens.mjs";

const docsRoot = "docs-site/src/content/docs";

const groups = [
  ["color", "Color", "The colors a screen may use.", (name) => name.startsWith("color.")],
  ["type", "Type", "The type roles a screen may use.", (name) => name.startsWith("font.")],
  ["space", "Space", "The space roles a screen may use.", (name) => name.startsWith("space.")],
  ["radius", "Radius", "The corner roles a screen may use.", (name) => name.startsWith("radius.")],
  ["motion", "Motion", "The motion roles a screen may use.", (name) => name.startsWith("motion.")],
  ["size", "Size", "The size roles a screen may use.", (name) => name.startsWith("size.")],
];

export function buildDocsPages() {
  const catalog = readJson("catalog.json");
  const pages = {};
  pages[`${docsRoot}/index.md`] = renderIndex();
  for (const [slug, title, description, match] of groups) {
    const tokens = Object.entries(catalog.tokens).filter(([name]) => match(name));
    pages[`${docsRoot}/foundations/${slug}.md`] = renderTokenPage(title, description, tokens);
  }
  for (const [file, name] of componentSources) {
    const component = catalog.components.find((item) => item.name === name);
    if (!component) throw new Error(`catalog.json is missing ${name}`);
    pages[`${docsRoot}/components/${slug(name)}.md`] = renderComponent(component, file);
  }
  pages[`${docsRoot}/gallery.mdx`] = renderGallery();
  return pages;
}

function renderIndex() {
  return `---
title: Start here
description: How to read Atomic and add a brand.
---

Atomic is a shared kit of colors, type, and pieces. A brand adds values. It does not change the pieces.

## Read this first

- Foundations lists every token, what it is for, and its value in Neutral and Okvy.
- Components lists the five pieces and when to use them.
- The gallery shows those pieces in light and dark, for both themes.

## Add a brand

1. Copy \`themes/_template.json\` to \`themes/<brand>.json\`.
2. Fill in the palette, type, space, radius, and motion.
3. Run \`npm run build:tokens\`, then \`npm run build:catalog\`, then \`npm run build:docs\`.
4. Open the gallery. The pieces should restyle without edits.

Agents read \`AGENTS.md\`. People read this site.
`;
}

function renderTokenPage(title, description, tokens) {
  const rows = tokens.map(([name, token]) => {
    const cells = [
      code(name),
      escapeCell(token.job),
      code(token.use),
      code(String(token.values.neutral.light)),
      code(String(token.values.neutral.dark)),
      code(String(token.values.okvy.light)),
      code(String(token.values.okvy.dark)),
    ];
    return `| ${cells.join(" | ")} |`;
  });
  return `---
title: ${title}
description: ${description}
---

${description} Write the "What to write" column in a component. The numbers are the values for the two test themes.

| Token | Job | What to write | Neutral light | Neutral dark | Okvy light | Okvy dark |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}
`;
}

function renderComponent(component, file) {
  const cssPath = file.replace(/\.md$/, ".css");
  const css = readFileSync(join(root, cssPath), "utf8");
  const used = [...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((match) => match[1]);
  const unique = [...new Set(used)];
  const propRows = component.props.map((prop) => {
    const values = prop.values ? prop.values.map(code).join(", ") : "none";
    const fallback = prop.default ? code(prop.default) : "none";
    const required = prop.required ? "yes" : "no";
    return `| ${code(prop.name)} | ${values} | ${fallback} | ${required} | ${escapeCell(prop.job)} |`;
  });
  const tokenList = unique.length
    ? unique.map((cssName) => `- ${code(cssName)}`).join("\n")
    : "This piece adds no tokens of its own.";
  return `---
title: ${titleFromName(component.name)}
description: ${escapeFrontmatter(component.purpose)}
---

${component.purpose}

## When to use

${component.whenToUse}

## When not to use

${component.whenNotToUse}

## Props

| Prop | Values | Default | Required | Job |
| --- | --- | --- | --- | --- |
${propRows.join("\n")}

## Tokens it uses

${tokenList}

See this piece in every theme and mode on the [gallery](/gallery/).
`;
}

function renderGallery() {
  return `---
title: Gallery
description: The five pieces in Neutral and Okvy, light and dark.
tableOfContents: false
---

import Gallery from '../../components/Gallery.tsx';

Each frame uses the same pieces. Only the theme and the mode change.

<Gallery client:load />
`;
}

function titleFromName(name) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function slug(name) {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function code(value) {
  return `\`${String(value).replaceAll("|", "\\|")}\``;
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeFrontmatter(value) {
  return String(value).replaceAll('"', "'");
}

function main() {
  const pages = buildDocsPages();
  for (const [file, text] of Object.entries(pages)) {
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
