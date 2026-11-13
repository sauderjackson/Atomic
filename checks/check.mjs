import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildCatalog, renderAgents, renderCatalog } from "../scripts/build-catalog.mjs";
import { rawValues, readJson, renderThemes, root } from "../scripts/tokens.mjs";

const errors = [];

function fail(message) {
  errors.push(message);
}

function deref(schema, rootSchema) {
  if (!schema.$ref) return schema;
  const name = schema.$ref.slice("#/$defs/".length);
  const target = rootSchema.$defs?.[name];
  if (!target) {
    throw new Error(`Missing schema def ${schema.$ref}`);
  }
  return target;
}

function validate(instance, schema, rootSchema, path) {
  const rule = deref(schema, rootSchema);
  if (Object.prototype.hasOwnProperty.call(rule, "const") && instance !== rule.const) {
    fail(`${path} must be ${JSON.stringify(rule.const)}`);
  }
  if (rule.type === "object") {
    if (instance === null || typeof instance !== "object" || Array.isArray(instance)) {
      fail(`${path} must be an object`);
      return;
    }
    for (const key of rule.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(instance, key)) {
        fail(`${path}.${key} is required`);
      }
    }
    if (rule.additionalProperties === false) {
      const allowed = new Set(Object.keys(rule.properties ?? {}));
      for (const key of Object.keys(instance)) {
        if (!allowed.has(key)) fail(`${path}.${key} is not in the contract`);
      }
    }
    for (const [key, prop] of Object.entries(rule.properties ?? {})) {
      if (Object.prototype.hasOwnProperty.call(instance, key)) {
        validate(instance[key], prop, rootSchema, `${path}.${key}`);
      }
    }
    return;
  }
  if (rule.type === "string") {
    if (typeof instance !== "string") {
      fail(`${path} must be a string`);
      return;
    }
    if ((rule.minLength ?? 0) > instance.length) fail(`${path} is empty`);
    if (rule.pattern && !new RegExp(rule.pattern).test(instance)) {
      fail(`${path} does not match ${rule.pattern}`);
    }
    return;
  }
  if (rule.type === "integer") {
    if (!Number.isInteger(instance)) {
      fail(`${path} must be an integer`);
      return;
    }
    if (rule.minimum !== undefined && instance < rule.minimum) fail(`${path} is too small`);
    if (rule.maximum !== undefined && instance > rule.maximum) fail(`${path} is too large`);
    return;
  }
  if (rule.type === "number") {
    if (typeof instance !== "number" || Number.isNaN(instance)) {
      fail(`${path} must be a number`);
      return;
    }
    if (rule.exclusiveMinimum !== undefined && instance <= rule.exclusiveMinimum) {
      fail(`${path} must be greater than ${rule.exclusiveMinimum}`);
    }
  }
}

function leaves(value, prefix = "", out = []) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      leaves(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out.push([prefix, value]);
  return out;
}

function same(left, right, path) {
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    fail(`${path} does not match the neutral base`);
  }
}

const schema = readJson("tokens/schema.json");
const semantic = readJson("tokens/semantic.json");
const base = readJson("tokens/base.json");
const neutral = readJson("themes/neutral.json");
const harbor = readJson("themes/harbor.json");
const template = readJson("themes/_template.json");
const light = readJson("tokens/modes/light.json");
const dark = readJson("tokens/modes/dark.json");

validate(neutral, schema, schema, "themes/neutral.json");
validate(harbor, schema, schema, "themes/harbor.json");

for (const group of ["color", "font", "space", "radius", "motion", "size"]) {
  same(base[group], neutral[group], `tokens/base.json ${group}`);
}

const neutralLeaves = new Map(leaves(neutral));
const templateLeaves = new Map(leaves(template));
for (const key of neutralLeaves.keys()) {
  if (!templateLeaves.has(key)) fail(`themes/_template.json is missing ${key}`);
}
for (const [key, value] of templateLeaves) {
  if (!neutralLeaves.has(key)) fail(`themes/_template.json has extra key ${key}`);
  if (value !== "") fail(`themes/_template.json ${key} must be blank`);
}

const contract = schema["x-semanticTokens"];
const contractNames = contract.map((token) => token.name);
const semanticNames = Object.keys(semantic);
if (JSON.stringify(contractNames) !== JSON.stringify(semanticNames)) {
  fail("tokens/schema.json x-semanticTokens and tokens/semantic.json name different roles");
}
for (const token of contract) {
  const spec = semantic[token.name];
  if (!spec) continue;
  if (spec.type !== token.type) fail(`${token.name} type does not match the schema`);
  if (!spec.description || spec.description !== token.description) {
    fail(`${token.name} description does not match the schema`);
  }
  if (!/^\{[a-zA-Z0-9.]+\}$/.test(spec.value)) fail(`${token.name} must reference a raw path`);
}

const raw = rawValues(neutral);
const colorRoles = semanticNames.filter((name) => name.startsWith("color."));
for (const [modeName, mode] of [
  ["light", light],
  ["dark", dark],
]) {
  for (const role of colorRoles) {
    if (!(role in mode)) fail(`tokens/modes/${modeName}.json is missing ${role}`);
  }
  for (const [role, ref] of Object.entries(mode)) {
    if (!colorRoles.includes(role)) fail(`${modeName} remaps non-color role ${role}`);
    if (!/^\{[a-zA-Z0-9.]+\}$/.test(ref)) fail(`${modeName} ${role} must be a reference`);
    const path = ref.slice(1, -1);
    if (!(path in raw)) fail(`${modeName} ${role} points at missing ${path}`);
    if (modeName === "light" && semantic[role].value !== ref) {
      fail(`light mode and semantic.json disagree on ${role}`);
    }
  }
}

for (const spec of Object.values(semantic)) {
  const path = spec.value.slice(1, -1);
  if (!(path in raw)) fail(`semantic reference ${spec.value} is missing from the neutral theme`);
}

const css = renderThemes();
const builtPath = join(root, "tokens/build/themes.css");
let built = "";
try {
  built = readFileSync(builtPath, "utf8");
} catch {
  fail("tokens/build/themes.css is missing. Run npm run build:tokens.");
}
if (built && built !== css) {
  fail("tokens/build/themes.css is stale. Run npm run build:tokens.");
}
for (const themeName of ["neutral", "harbor"]) {
  for (const modeName of ["light", "dark"]) {
    if (!css.includes(`[data-theme="${themeName}"][data-mode="${modeName}"]`)) {
      fail(`CSS is missing ${themeName} ${modeName}`);
    }
  }
}
if (!css.includes(neutral.color.accent) || !css.includes(harbor.color.accent)) {
  fail("CSS is missing a theme accent");
}
if (neutral.color.accent === harbor.color.accent) {
  fail("harbor must change the accent so the swap is visible");
}

let generated;
try {
  generated = buildCatalog();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
if (generated) {
  const catalogPath = join(root, "catalog.json");
  const agentsPath = join(root, "AGENTS.md");
  let catalogText = "";
  let agentsText = "";
  try {
    catalogText = readFileSync(catalogPath, "utf8");
  } catch {
    fail("catalog.json is missing. Run npm run build:catalog.");
  }
  try {
    agentsText = readFileSync(agentsPath, "utf8");
  } catch {
    fail("AGENTS.md is missing. Run npm run build:catalog.");
  }
  if (catalogText && catalogText !== renderCatalog(generated.catalog)) {
    fail("catalog.json is stale. Run npm run build:catalog.");
  }
  if (agentsText && agentsText !== renderAgents(generated.catalog.rules)) {
    fail("AGENTS.md is stale. Run npm run build:catalog.");
  }
}

const skipDirs = new Set(["node_modules", "dist", ".git", "tokens", "themes", "agents"]);
const extensions = new Set([".css", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json"]);
const hex = new RegExp("#" + "[0-9a-fA-F]{3,8}\\b", "g");
const rgb = new RegExp("rgb" + "a?\\(", "g");
const px = new RegExp("\\d+" + "px\\b", "g");

function scan(dir) {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      scan(path);
      continue;
    }
    if (entry === "package-lock.json" || entry === "BRIEF.md" || entry === "catalog.json") continue;
    const dot = entry.lastIndexOf(".");
    if (dot < 0 || !extensions.has(entry.slice(dot))) continue;
    const text = readFileSync(path, "utf8");
    const found = [];
    for (const pattern of [hex, rgb, px]) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) found.push(match[0]);
    }
    if (found.length > 0) {
      fail(`${relative(root, path)} has a raw value: ${found.join(", ")}`);
    }
  }
}

scan(root);

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log("Atomic checks passed.");
