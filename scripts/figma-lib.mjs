import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { root, readJson } from "./tokens.mjs";

export const GENERATOR = "scripts/figma-pull.mjs";
export const META_KEYS = new Set(["generatedBy", "hash"]);

export function contentHash(value) {
  const clone = structuredClone(value);
  delete clone.generatedBy;
  delete clone.hash;
  return createHash("sha256").update(JSON.stringify(clone)).digest("hex").slice(0, 16);
}

export function withMeta(value, generatedBy = GENERATOR) {
  const body = { generatedBy, ...value };
  body.hash = contentHash(body);
  return body;
}

export function stripMeta(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out = { ...value };
  delete out.generatedBy;
  delete out.hash;
  return out;
}

export function assertHash(path, value) {
  if (!value || typeof value !== "object") return `${path} is missing generated metadata`;
  if (path.startsWith("themes/") || path.startsWith("tokens/")) {
    if (value.generatedBy !== GENERATOR) {
      return `${path} generatedBy must be ${GENERATOR}`;
    }
    const expected = contentHash(value);
    if (value.hash !== expected) {
      return `${path} hash does not match its content. Run npm run figma:pull.`;
    }
  }
  return null;
}

export function hexFromFigmaColor(color) {
  const channel = (n) => Math.round(Math.min(1, Math.max(0, n)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

export function mapPrimitivePath(figmaName, mapping) {
  const parts = figmaName.split("/");
  // Try longest pattern matches via simple rewrite rules from mapping.pathMap keys.
  for (const [pattern, target] of Object.entries(mapping.Primitive.pathMap)) {
    const patternParts = pattern.split("/");
    if (patternParts.length !== parts.length) continue;
    const bindings = {};
    let ok = true;
    for (let i = 0; i < patternParts.length; i += 1) {
      const p = patternParts[i];
      if (p.startsWith("{") && p.endsWith("}")) {
        bindings[p.slice(1, -1)] = parts[i];
      } else if (p !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    return target.replace(/\{(\w+)\}/g, (_, key) => bindings[key]);
  }
  return null;
}

export function formatPrimitiveValue(themePath, raw, mapping) {
  if (raw && typeof raw === "object" && "r" in raw && "g" in raw && "b" in raw) {
    return hexFromFigmaColor(raw);
  }
  if (typeof raw === "string") {
    if (themePath === "font.family.sans") {
      return `"${raw}"${mapping.fontFallbacks.sans}`;
    }
    if (themePath === "font.family.serif") {
      return `"${raw}"${mapping.fontFallbacks.serif}`;
    }
    if (themePath === "font.family.mono") {
      return `"${raw}"${mapping.fontFallbacks.mono}`;
    }
    return raw;
  }
  if (typeof raw === "number") {
    if (mapping.Primitive.numberFields.some((field) => themePath.startsWith(field))) {
      return raw;
    }
    for (const [prefix, unit] of Object.entries(mapping.Primitive.unitFields)) {
      if (themePath === prefix || themePath.startsWith(`${prefix}.`)) {
        return `${raw}${unit}`;
      }
    }
    return raw;
  }
  return raw;
}

export function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

export function isProposedPrimitive(name, mapping) {
  return mapping.Primitive.proposedPrimitives.includes(name)
    || name.startsWith("color/secondary/")
    || name.startsWith("color/shade/")
    || name.startsWith("color/neutral/")
    || (typeof name === "string" && false);
}

export function isProposedDescription(description) {
  return typeof description === "string" && description.includes("PROPOSED");
}

export function roleFromWebSyntax(web, mapping) {
  if (!web) return null;
  return mapping.Semantic.webSyntaxToRole[web] ?? null;
}

export function loadVariablesExport() {
  const path = join(root, "figma/export/variables.json");
  if (!existsSync(path)) {
    throw new Error("figma/export/variables.json is missing. Refresh the Professional export or set FIGMA_TOKEN.");
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export async function fetchVariablesFromApi(fileKey, token) {
  const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`;
  const response = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });
  if (response.status === 403 || response.status === 401) {
    const err = new Error("Variables REST needs an Enterprise plan or a valid FIGMA_TOKEN. Using the committed export.");
    err.code = "PLAN";
    throw err;
  }
  if (!response.ok) {
    throw new Error(`Figma Variables API failed (${response.status}).`);
  }
  const data = await response.json();
  // Normalize REST shape into the committed export shape.
  const collections = Object.values(data.meta.variableCollections).map((collection) => {
    const modes = collection.modes.map((mode) => ({ name: mode.name, modeId: mode.modeId }));
    const variables = collection.variableIds.map((id) => {
      const variable = data.meta.variables[id];
      return {
        id: variable.id,
        name: variable.name,
        description: variable.description || "",
        resolvedType: variable.resolvedType,
        codeSyntax: variable.codeSyntax || {},
        valuesByMode: variable.valuesByMode,
      };
    });
    return {
      id: collection.id,
      name: collection.name,
      modes,
      variables,
    };
  });
  return {
    generatedBy: "figma-variables-rest",
    fileKey,
    collections,
  };
}

export async function loadVariablesSource({ fileKey, token } = {}) {
  const key = fileKey || process.env.FIGMA_FILE_KEY || readJson("figma/structure.json").fileKey;
  if (token || process.env.FIGMA_TOKEN) {
    try {
      return {
        source: "api",
        data: await fetchVariablesFromApi(key, token || process.env.FIGMA_TOKEN),
      };
    } catch (error) {
      if (error.code !== "PLAN") throw error;
      console.warn(error.message);
    }
  }
  return { source: "export", data: loadVariablesExport() };
}

function indexVariables(collections) {
  const byId = new Map();
  for (const collection of collections) {
    for (const variable of collection.variables) {
      byId.set(variable.id, { ...variable, collection: collection.name });
    }
  }
  return byId;
}

function aliasToThemeRef(aliasId, byId, mapping) {
  const target = byId.get(aliasId);
  if (!target) return null;
  const themePath = mapPrimitivePath(target.name, mapping);
  if (!themePath) return null;
  return `{${themePath}}`;
}

export function pullTokens(variablesData, mapping = readJson("figma/mapping.json")) {
  const refused = [];
  const proposed = [];
  const changed = [];
  const collections = variablesData.collections;
  const byId = indexVariables(collections);

  const primitive = collections.find((c) => c.name === "Primitive");
  const semantic = collections.find((c) => c.name === "Semantic");
  const lead = collections.find((c) => c.name === "Lead");

  if (!primitive || !semantic) {
    refused.push("Figma export is missing the Primitive or Semantic collection.");
    return { ok: false, refused, proposed, changed };
  }

  if (lead) {
    proposed.push({
      kind: "collection",
      name: "Lead",
      note: "Proposed collection. Skip until a contract PR adds lead roles.",
    });
  }

  const contractPrimitivePaths = new Set();
  // Theme schema leaves that must be filled from Primitive Neutral.
  const requiredThemePaths = [
    ...["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"].map((n) => `color.gray.${n}`),
    "color.accent", "color.success", "color.warning", "color.error", "color.info",
    ...["1", "2", "3", "4", "5", "6", "7", "8"].map((n) => `space.${n}`),
    "radius.none", "radius.sm", "radius.md", "radius.full",
    "font.size.sm", "font.size.md", "font.size.lg", "font.size.xl",
    "font.weight.regular", "font.weight.medium",
    "font.lineHeight.body", "font.lineHeight.title",
    "font.family.sans",
    "size.tap", "size.border", "size.outline", "size.icon",
    "motion.duration.fast", "motion.duration.base",
    "motion.easing.standard",
  ];

  const themes = {};
  for (const mode of primitive.modes) {
    const themeName = mode.name.toLowerCase();
    const theme = {
      name: themeName,
      icon: "lucide",
      logo: { wordmark: mode.name === "Neutral" ? "Neutral" : mode.name },
      color: {},
      font: {},
      space: {},
      radius: {},
      motion: {},
      size: {},
    };
    themes[themeName] = { theme, modeId: mode.modeId, paths: new Set() };
  }

  for (const variable of primitive.variables) {
    const proposedPrim = isProposedPrimitive(variable.name, mapping) || isProposedDescription(variable.description);
    const themePath = mapPrimitivePath(variable.name, mapping);

    if (proposedPrim) {
      proposed.push({ kind: "primitive", name: variable.name });
      continue;
    }

    if (!themePath) {
      refused.push(
        `Figma has a variable ${variable.name} with no role in tokens/schema.json. Mark it PROPOSED in Figma or add the role in a contract pull request.`,
      );
      continue;
    }

    contractPrimitivePaths.add(themePath);

    for (const [themeName, bucket] of Object.entries(themes)) {
      const raw = variable.valuesByMode[bucket.modeId];
      if (raw === undefined) {
        refused.push(`Primitive ${variable.name} is missing a value in mode ${themeName}.`);
        continue;
      }
      if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
        refused.push(`Primitive ${variable.name} in ${themeName} must be a raw value, not an alias.`);
        continue;
      }
      const value = formatPrimitiveValue(themePath, raw, mapping);
      setPath(bucket.theme, themePath, value);
      bucket.paths.add(themePath);
    }
  }

  for (const path of requiredThemePaths) {
    if (!contractPrimitivePaths.has(path)) {
      refused.push(`Contract primitive ${path} is missing from Figma (rule 4).`);
    }
  }

  // Gray step and status hue guards
  const graySteps = ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
  for (const step of graySteps) {
    if (![...contractPrimitivePaths].some((p) => p === `color.gray.${step}`)) {
      refused.push(`Gray step color.gray.${step} is missing (rule 6).`);
    }
  }
  for (const hue of ["success", "warning", "error", "info"]) {
    if (!contractPrimitivePaths.has(`color.${hue}`)) {
      refused.push(`Status hue color.${hue} is missing (rule 7).`);
    }
  }

  const schema = readJson("tokens/schema.json");
  const contractRoles = schema["x-semanticTokens"].map((token) => token.name);
  const semanticByRole = {};
  const lightMode = {};
  const darkMode = {};

  const lightModeId = semantic.modes.find((m) => m.name === "Light")?.modeId;
  const darkModeId = semantic.modes.find((m) => m.name === "Dark")?.modeId;
  if (!lightModeId || !darkModeId) {
    refused.push("Semantic collection must have Light and Dark modes.");
  }

  const foundRoles = new Set();

  for (const variable of semantic.variables) {
    const web = variable.codeSyntax?.WEB;
    const role = roleFromWebSyntax(web, mapping);
    const proposedSem = isProposedDescription(variable.description);

    if (proposedSem) {
      proposed.push({ kind: "semantic", name: variable.name });
      continue;
    }

    if (!role) {
      refused.push(
        `Figma has a variable ${variable.name} with no role in tokens/schema.json. Mark it PROPOSED in Figma or add the role in a contract pull request.`,
      );
      continue;
    }

    if (!contractRoles.includes(role)) {
      refused.push(
        `Figma has a variable ${variable.name} with no role in tokens/schema.json. Mark it PROPOSED in Figma or add the role in a contract pull request.`,
      );
      continue;
    }

    foundRoles.add(role);
    const contract = schema["x-semanticTokens"].find((token) => token.name === role);

    const resolveMode = (modeId, modeName) => {
      const raw = variable.valuesByMode[modeId];
      if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
        const ref = aliasToThemeRef(raw.id, byId, mapping);
        if (!ref) {
          refused.push(`${variable.name} in ${modeName} aliases an unknown primitive.`);
          return null;
        }
        return ref;
      }
      if (raw && typeof raw === "object" && "r" in raw) {
        refused.push(
          `${variable.name.replaceAll("/", ".")} in ${modeName} is a raw color ${hexFromFigmaColor(raw)}. Alias it to a gray step in Figma.`,
        );
        return null;
      }
      if (typeof raw === "number" || typeof raw === "string") {
        // Non-color literals still need to be aliases to primitives for Atomic.
        refused.push(
          `${variable.name} in ${modeName} must alias a Primitive. Got a raw value.`,
        );
        return null;
      }
      refused.push(`${variable.name} in ${modeName} has no value.`);
      return null;
    };

    const lightRef = resolveMode(lightModeId, "Light");
    const darkRef = resolveMode(darkModeId, "Dark");
    if (!lightRef) continue;

    semanticByRole[role] = {
      value: lightRef,
      type: contract.type,
      description: contract.description,
    };

    if (role.startsWith("color.")) {
      lightMode[role] = lightRef;
      if (darkRef) darkMode[role] = darkRef;
    }
  }

  for (const role of contractRoles) {
    if (!foundRoles.has(role)) {
      refused.push(`Contract role ${role} is missing from Figma (rule 4).`);
    }
  }

  if (refused.length > 0) {
    return { ok: false, refused, proposed, changed, themes: null };
  }

  const neutral = themes.neutral.theme;
  const files = {
    "themes/neutral.json": withMeta(neutral),
    "tokens/base.json": withMeta({
      color: neutral.color,
      font: neutral.font,
      space: neutral.space,
      radius: neutral.radius,
      motion: neutral.motion,
      size: neutral.size,
    }),
    "tokens/semantic.json": withMeta(
      Object.fromEntries(contractRoles.map((role) => [role, semanticByRole[role]])),
    ),
    "tokens/modes/light.json": withMeta(lightMode),
    "tokens/modes/dark.json": withMeta(darkMode),
  };

  for (const [themeName, bucket] of Object.entries(themes)) {
    if (themeName === "neutral") continue;
    files[`themes/${themeName}.json`] = withMeta(bucket.theme);
  }

  return {
    ok: true,
    refused,
    proposed,
    changed,
    files,
    themes: Object.fromEntries(Object.entries(themes).map(([name, bucket]) => [name, bucket.theme])),
  };
}

export function writePullResult(result) {
  for (const [rel, value] of Object.entries(result.files)) {
    writeFileSync(join(root, rel), `${JSON.stringify(value, null, 2)}\n`);
  }
}

export function diffTheme(before, after, label) {
  const changes = [];
  const walk = (a, b, path) => {
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a)) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of keys) {
        if (META_KEYS.has(key)) continue;
        walk(a?.[key], b?.[key], path ? `${path}.${key}` : key);
      }
      return;
    }
    if (a !== b) changes.push({ path: `${label}.${path}`, from: a, to: b });
  };
  walk(before, after, "");
  return changes;
}
