import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { cssName, rawValues, readJson, resolveRef, root, withoutMeta } from "./tokens.mjs";

export const componentSources = [
  ["components/atoms/button/button.md", "Button"],
  ["components/atoms/input/input.md", "TextInput"],
  ["components/atoms/type/type.md", "Type"],
  ["components/atoms/badge/badge.md", "Badge"],
  ["components/atoms/icon/icon.md", "Icon"],
];

const themeNames = ["neutral", "okvy"];
const modeNames = ["light", "dark"];

export function buildCatalog() {
  const manifest = readJson("rules/manifest.json");
  const rules = normalizeRules(manifest.rules);
  return {
    catalog: {
      generatedBy: "scripts/build-catalog.mjs",
      tokens: buildTokens(),
      components: buildComponents(),
      rules,
    },
    agents: renderAgents(rules),
  };
}

function normalizeRules(rules) {
  if (!Array.isArray(rules) || rules.length < 15 || rules.length > 20) {
    throw new Error("rules/manifest.json must list 15 to 20 rules");
  }
  return rules.map((rule, index) => {
    const id = index + 1;
    if (rule.id !== id) throw new Error(`Rule ids must be 1 through ${rules.length} in order`);
    for (const key of ["rule", "why", "doc"]) {
      if (typeof rule[key] !== "string" || rule[key].trim() === "") {
        throw new Error(`Rule ${id} is missing ${key}`);
      }
    }
    return { id, rule: rule.rule, why: rule.why, doc: rule.doc };
  });
}

function buildTokens() {
  const semantic = withoutMeta(readJson("tokens/semantic.json"));
  const themes = Object.fromEntries(
    themeNames.map((name) => [name, rawValues(withoutMeta(readJson(`themes/${name}.json`)))]),
  );
  const modes = Object.fromEntries(
    modeNames.map((name) => [name, withoutMeta(readJson(`tokens/modes/${name}.json`))]),
  );
  const tokens = {};
  for (const [name, spec] of Object.entries(semantic)) {
    const css = cssName(name);
    const values = {};
    for (const themeName of themeNames) {
      values[themeName] = {};
      for (const modeName of modeNames) {
        const ref = modes[modeName][name] ?? spec.value;
        values[themeName][modeName] = resolveRef(ref, themes[themeName]);
      }
    }
    tokens[name] = {
      css,
      use: `var(${css})`,
      job: spec.description,
      type: spec.type,
      values,
    };
  }
  return tokens;
}

function buildComponents() {
  const expected = new Set(componentSources.map(([file]) => file));
  const found = new Set(markdownFiles(join(root, "components")).map((file) => file.slice(root.length + 1)));
  for (const file of expected) {
    if (!found.has(file)) throw new Error(`Missing component doc ${file}`);
  }
  for (const file of found) {
    if (!expected.has(file)) throw new Error(`Unlisted component doc ${file}`);
  }
  return componentSources.map(([file, name]) => parseComponent(file, name));
}

function markdownFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) markdownFiles(path, out);
    else if (entry.endsWith(".md") && !entry.endsWith(".figma-proposed.md")) out.push(path);
  }
  return out;
}

function parseComponent(file, name) {
  const text = readFileSync(join(root, file), "utf8");
  const purpose = text.match(/^#[^\n]+\n\nAtom\. (.+)$/m);
  if (!purpose) throw new Error(`${file} must start with a title and "Atom. <purpose>"`);
  return {
    name,
    level: "atom",
    purpose: purpose[1].replace(/\.$/, "") + ".",
    props: parseProps(section(text, "Props"), file),
    whenToUse: prose(section(text, "When to use")),
    whenNotToUse: prose(section(text, "When not to use")),
  };
}

function section(text, heading) {
  const match = text.match(new RegExp(`## ${heading}\\n\\n([\\s\\S]*?)(?:\\n## |$)`));
  if (!match) throw new Error(`Missing section ${heading}`);
  return match[1].trim();
}

function prose(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).join(" ");
}

function parseProps(body, file) {
  const props = [];
  for (const line of body.split("\n")) {
    const match = line.match(/^- `([^`]+)` \(([^)]*)\): (.+)$/);
    if (!match) throw new Error(`${file} has an unreadable prop line: ${line}`);
    const [, name, meta, job] = match;
    props.push(shapeProp(name, parseMeta(meta), job));
  }
  if (props.length === 0) throw new Error(`${file} has no props`);
  return props;
}

function shapeProp(name, meta, job) {
  const prop = { name };
  if (meta.values) prop.values = meta.values;
  if (meta.default) prop.default = meta.default;
  if (meta.required) prop.required = meta.required;
  prop.job = job;
  return prop;
}

function parseMeta(meta) {
  if (meta === "required") return { required: true };
  if (meta === "text") return {};
  const result = {};
  let body = meta;
  const defaultMatch = body.match(/, default `([^`]+)`$/);
  if (defaultMatch) {
    result.default = defaultMatch[1];
    body = body.slice(0, defaultMatch.index);
  }
  if (body === "flag") return result;
  const values = [...body.matchAll(/`([^`]+)`/g)].map((item) => item[1]);
  if (values.length > 0) result.values = values;
  return result;
}

export function renderCatalog(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

export function renderAgents(rules) {
  const lines = [
    "<!-- Generated by scripts/build-catalog.mjs. Do not edit. -->",
    "",
    "# Agents",
    "",
    "Read in this order:",
    "",
    "1. [AGENTS.md](AGENTS.md)",
    "2. [RULES.md](RULES.md)",
    "3. [catalog.json](catalog.json)",
    "4. The component markdown for the piece you change. For a theme change, read [tokens/schema.json](tokens/schema.json).",
    "",
    "For any UI, social, thumbnail, or motion task, follow [SKILL.md](SKILL.md).",
    "",
    "## Rules",
    "",
  ];
  for (const rule of rules) {
    lines.push(`${rule.id}. ${rule.rule}`);
    lines.push(`   Why: ${rule.why}`);
    lines.push(`   Doc: [${rule.doc}](${rule.doc})`);
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const { catalog, agents } = buildCatalog();
  writeFileSync(join(root, "catalog.json"), renderCatalog(catalog));
  writeFileSync(join(root, "AGENTS.md"), renderAgents(catalog.rules));
  if (agents !== renderAgents(catalog.rules)) {
    throw new Error("AGENTS.md renderer drifted");
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
