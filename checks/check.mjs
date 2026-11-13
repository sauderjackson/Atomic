import { collectFindings } from "../scripts/audit.mjs";
import { engineerIssues } from "../scripts/engineer.mjs";
import { decisionIssues } from "../scripts/sync-product.mjs";
import { layerSyncIssues } from "../scripts/sync.mjs";
import { figmaDriftIssues } from "./figma-drift.mjs";
import { assertHash } from "../scripts/figma-lib.mjs";
import { rawValues, readJson, renderThemes, withoutMeta } from "../scripts/tokens.mjs";

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
const semanticFile = readJson("tokens/semantic.json");
const baseFile = readJson("tokens/base.json");
const neutralFile = readJson("themes/neutral.json");
const okvyFile = readJson("themes/okvy.json");
const template = readJson("themes/_template.json");
const lightFile = readJson("tokens/modes/light.json");
const darkFile = readJson("tokens/modes/dark.json");

for (const [path, value] of [
  ["themes/neutral.json", neutralFile],
  ["themes/okvy.json", okvyFile],
  ["tokens/base.json", baseFile],
  ["tokens/semantic.json", semanticFile],
  ["tokens/modes/light.json", lightFile],
  ["tokens/modes/dark.json", darkFile],
]) {
  const hashIssue = assertHash(path, value);
  if (hashIssue) fail(hashIssue);
}

const semantic = withoutMeta(semanticFile);
const base = withoutMeta(baseFile);
const neutral = withoutMeta(neutralFile);
const okvy = withoutMeta(okvyFile);
const light = withoutMeta(lightFile);
const dark = withoutMeta(darkFile);

validate(neutral, schema, schema, "themes/neutral.json");
validate(okvy, schema, schema, "themes/okvy.json");

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
for (const themeName of ["neutral", "okvy"]) {
  for (const modeName of ["light", "dark"]) {
    if (!css.includes(`[data-theme="${themeName}"][data-mode="${modeName}"]`)) {
      fail(`CSS is missing ${themeName} ${modeName}`);
    }
  }
}
if (!css.includes(neutral.color.accent) || !css.includes(okvy.color.accent)) {
  fail("CSS is missing a theme accent");
}
if (neutral.color.accent === okvy.color.accent) {
  fail("okvy must change the accent so the swap is visible");
}

for (const issue of layerSyncIssues()) fail(issue);
for (const issue of decisionIssues()) fail(issue);
for (const issue of engineerIssues()) fail(issue);
for (const issue of figmaDriftIssues()) fail(issue);
for (const finding of collectFindings()) {
  fail(`${finding.file}:${finding.line} has a raw value: ${finding.raw}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log("Atomic checks passed.");
