import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

export function readRepoJson(path: string): unknown {
  return JSON.parse(readFileSync(join(repoRoot, path), "utf8"));
}

type Schema = {
  $ref?: string;
  $defs?: Record<string, Schema>;
  type?: string;
  const?: unknown;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, Schema>;
  minLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
};

function deref(schema: Schema, root: Schema): Schema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.slice("#/$defs/".length);
  const target = root.$defs?.[name];
  if (!target) throw new Error(`Missing schema def ${schema.$ref}`);
  return target;
}

export function validateThemeName(name: string): { ok: boolean; theme: string; errors: string[] } {
  const errors: string[] = [];
  if (!/^[a-z0-9-]+$/.test(name) || name.startsWith("_")) {
    return { ok: false, theme: name, errors: ["Use a theme name such as harbor. A template is not a theme."] };
  }
  let theme: Record<string, unknown>;
  try {
    theme = readRepoJson(`themes/${name}.json`) as Record<string, unknown>;
  } catch {
    return { ok: false, theme: name, errors: [`themes/${name}.json was not found.`] };
  }
  if ("components" in theme) {
    errors.push("A theme cannot override components.");
  }
  const schema = readRepoJson("tokens/schema.json") as Schema;
  validate(theme, schema, schema, name, errors);
  return { ok: errors.length === 0, theme: name, errors };
}

function validate(instance: unknown, schema: Schema, root: Schema, path: string, errors: string[]) {
  const rule = deref(schema, root);
  if (Object.prototype.hasOwnProperty.call(rule, "const") && instance !== rule.const) {
    errors.push(`${path} must be ${JSON.stringify(rule.const)}`);
  }
  if (rule.type === "object") {
    if (instance === null || typeof instance !== "object" || Array.isArray(instance)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const record = instance as Record<string, unknown>;
    for (const key of rule.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) errors.push(`${path}.${key} is required`);
    }
    if (rule.additionalProperties === false) {
      const allowed = new Set(Object.keys(rule.properties ?? {}));
      for (const key of Object.keys(record)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} is not in the contract`);
      }
    }
    for (const [key, prop] of Object.entries(rule.properties ?? {})) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        validate(record[key], prop, root, `${path}.${key}`, errors);
      }
    }
    return;
  }
  if (rule.type === "string") {
    if (typeof instance !== "string") {
      errors.push(`${path} must be a string`);
      return;
    }
    if ((rule.minLength ?? 0) > instance.length) errors.push(`${path} is empty`);
    if (rule.pattern && !new RegExp(rule.pattern).test(instance)) errors.push(`${path} does not match the contract`);
    return;
  }
  if (rule.type === "integer") {
    if (!Number.isInteger(instance)) errors.push(`${path} must be an integer`);
    return;
  }
  if (rule.type === "number" && typeof instance !== "number") {
    errors.push(`${path} must be a number`);
  }
}

export type CatalogProp = {
  name: string;
  values?: string[];
  default?: string;
  required?: boolean;
  job: string;
};

export type CatalogEntry = {
  name: string;
  level: string;
  purpose: string;
  props: CatalogProp[];
  whenToUse: string;
  whenNotToUse: string;
};

export function lookupComponent(name: string): { found: false; name: string } | ({ found: true } & CatalogEntry) {
  const catalog = readRepoJson("catalog.json") as { components: CatalogEntry[] };
  const entry = catalog.components.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!entry) return { found: false, name };
  return { found: true, ...entry };
}

export const nextTasks = [
  {
    order: 11,
    name: "Build molecules and organisms",
    phase: "Molecules",
    status: "Not started",
    doneWhen: "Form groups, cards, nav, headers, post layouts, and thumbnail layouts use semantic tokens only.",
    url: "https://app.notion.com/p/4176d55232fa81288a4bca687114bf39",
  },
  {
    order: 12,
    name: "Build social templates",
    phase: "Templates",
    status: "Not started",
    doneWhen: "Feed, carousel, and story templates render from the theme.",
    url: "https://app.notion.com/p/4176d55232fa8148b34dea78aae24720",
  },
  {
    order: 13,
    name: "Build the thumbnail template",
    phase: "Templates",
    status: "Not started",
    doneWhen: "A thumbnail template renders from the theme.",
    url: "https://app.notion.com/p/4176d55232fa813f89f6f5b76ae5a318",
  },
  {
    order: 14,
    name: "Build the web page template",
    phase: "Templates",
    status: "Not started",
    doneWhen: "A web page template renders from the theme.",
    url: "https://app.notion.com/p/4176d55232fa81e1be20e86bb61dda40",
  },
  {
    order: 15,
    name: "Build video title and lower-third templates",
    phase: "Templates",
    status: "Not started",
    doneWhen: "A video title and a lower third render from the theme.",
    url: "https://app.notion.com/p/4176d55232fa8154a050e2ecfa56255c",
  },
  {
    order: 16,
    name: "Generate catalog.json from every component",
    phase: "Catalog",
    status: "Not started",
    doneWhen: "catalog.json is generated from the components. New components are not hand-added.",
    url: "https://app.notion.com/p/4176d55232fa81108f45ed2d57f921a3",
  },
  {
    order: 17,
    name: "Extend the theme proof to molecules and templates",
    phase: "Theming",
    status: "Not started",
    doneWhen: "Swapping the theme restyles every molecule and template with no component edits.",
    url: "https://app.notion.com/p/4176d55232fa8183a553e26bcf1b68db",
  },
  {
    order: 18,
    name: "Automate Figma sync",
    phase: "Design sync",
    status: "Not started",
    doneWhen: "Figma variables and components mirror the repo through the Figma connector.",
    url: "https://app.notion.com/p/4176d55232fa81fdb2e1ff458e7bfd6b",
  },
  {
    order: 19,
    name: "Let the RULES.md review block",
    phase: "Checks",
    status: "Not started",
    doneWhen: "An automated review against RULES.md can block a change. Until then it warns.",
    url: "https://app.notion.com/p/4176d55232fa81b4b7c5f75d1e21dc04",
  },
  {
    order: 20,
    name: "Write the start-here and add-a-brand docs",
    phase: "Handoff",
    status: "Not started",
    doneWhen: "docs/ explains the system in one read and how to add a brand.",
    url: "https://app.notion.com/p/4176d55232fa816a9e4ff674b14435b4",
  },
] as const;
