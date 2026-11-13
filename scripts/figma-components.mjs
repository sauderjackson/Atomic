#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readJson, root } from "./tokens.mjs";

const REQUIRED = ["Purpose", "Use when", "Don't use when", "Props"];

function decodeEntities(text) {
  return String(text)
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export function parseDescription(raw) {
  const text = decodeEntities(raw || "");
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const fields = {};
  for (const line of lines) {
    const match = /^(Purpose|Use when|Don't use when|Props|Catalog|Spec):\s*(.*)$/i.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const normalized =
      key === "purpose" ? "purpose"
        : key === "use when" ? "useWhen"
          : key === "don't use when" ? "dontUseWhen"
            : key === "props" ? "props"
              : key === "catalog" ? "catalog"
                : "spec";
    fields[normalized] = match[2].trim();
  }
  return fields;
}

export function kebabName(name) {
  return name
    .replaceAll(" / ", " ")
    .replaceAll("/", " ")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function loadComponentsExport({ fileKey, token } = {}) {
  const key = fileKey || process.env.FIGMA_FILE_KEY || readJson("figma/structure.json").fileKey;
  const auth = token || process.env.FIGMA_TOKEN;
  if (auth) {
    const [componentsRes, setsRes] = await Promise.all([
      fetch(`https://api.figma.com/v1/files/${key}/components`, { headers: { "X-Figma-Token": auth } }),
      fetch(`https://api.figma.com/v1/files/${key}/component_sets`, { headers: { "X-Figma-Token": auth } }),
    ]);
    if (componentsRes.ok && setsRes.ok) {
      const components = await componentsRes.json();
      const sets = await setsRes.json();
      return {
        source: "api",
        data: {
          generatedBy: "figma-components-rest",
          fileKey: key,
          components: [
            ...Object.values(sets.meta.component_sets || {}).map((item) => ({
              id: item.node_id,
              name: item.name,
              type: "COMPONENT_SET",
              description: item.description || "",
              key: item.key,
              page: item.containing_frame?.pageName,
            })),
            ...Object.values(components.meta.components || {})
              .filter((item) => !item.containing_frame?.containingStateGroup)
              .map((item) => ({
                id: item.node_id,
                name: item.name,
                type: "COMPONENT",
                description: item.description || "",
                key: item.key,
                page: item.containing_frame?.pageName,
              })),
          ],
        },
      };
    }
  }
  const path = join(root, "figma/export/components.json");
  if (!existsSync(path)) {
    throw new Error("figma/export/components.json is missing. Refresh the Professional export or set FIGMA_TOKEN.");
  }
  return { source: "export", data: JSON.parse(readFileSync(path, "utf8")) };
}

function pageRoleFor(pageName, structure) {
  for (const [role, pages] of Object.entries(structure.pages)) {
    if (pages.some((page) => page.name === pageName)) return role;
  }
  return null;
}

function readComponentDoc(catalogName) {
  const map = {
    Button: "components/atoms/button/button.md",
    TextInput: "components/atoms/input/input.md",
    Badge: "components/atoms/badge/badge.md",
    Icon: "components/atoms/icon/icon.md",
    Type: "components/atoms/type/type.md",
  };
  const rel = map[catalogName];
  if (!rel || !existsSync(join(root, rel))) return null;
  return { path: rel, text: readFileSync(join(root, rel), "utf8") };
}

function proposedDocEdit(parsed) {
  const parts = [
    parsed.purpose ? `Atom. ${parsed.purpose}` : "",
    "",
    "## When to use",
    "",
    parsed.useWhen || "",
    "",
    "## When not to use",
    "",
    parsed.dontUseWhen || "",
  ];
  return `${parts.join("\n").trim()}\n`;
}

export async function syncComponents() {
  const structure = readJson("figma/structure.json");
  const catalog = readJson("catalog.json");
  const catalogNames = new Set((catalog.components || []).map((c) => c.name));
  const { source, data } = await loadComponentsExport();
  const summary = {
    source,
    needsDescription: [],
    docUpdates: [],
    candidates: [],
    removedFromFigma: [],
    unmappedVariants: [],
    parked: [],
  };

  mkdirSync(join(root, "decisions"), { recursive: true });
  const seen = new Set();

  for (const component of data.components || []) {
    const role = component.pageRole || pageRoleFor(component.page, structure);
    if (role === "private") continue;
    if (role !== "library" && role !== "templates") continue;

    const parsed = parseDescription(component.description);
    component.parsed = parsed;
    const missing = REQUIRED.filter((label) => {
      const key = label === "Purpose" ? "purpose"
        : label === "Use when" ? "useWhen"
          : label === "Don't use when" ? "dontUseWhen"
            : "props";
      return !parsed[key];
    });
    if (missing.length > 0) {
      summary.needsDescription.push(component.name);
      continue;
    }

    const catalogLine = parsed.catalog || "";
    const catalogName = catalogLine.split(/\s|\(/)[0];

    if (catalogNames.has(catalogName)) {
      if (catalogName === "Button") {
        summary.unmappedVariants.push("Button: Ghost, Amber, Forest (variant in Figma, not in code)");
      }
      if (catalogName === "Badge") {
        summary.unmappedVariants.push("Status/Badge: Neutral tone (tone in Figma, not in code)");
      }
      if (/parked/i.test(catalogLine)) {
        summary.parked.push(component.name);
        continue;
      }
      const doc = readComponentDoc(catalogName);
      if (doc) {
        const proposed = proposedDocEdit(parsed);
        // Compare loosely: if Figma purpose text is absent from the doc, propose an edit file.
        if (parsed.purpose && !doc.text.includes(parsed.purpose)) {
          const out = `${doc.path}.figma-proposed.md`;
          writeFileSync(join(root, out), proposed);
          summary.docUpdates.push(out);
        }
      }
      continue;
    }

    if (/candidate/i.test(catalogLine) || role === "templates") {
      const id = kebabName(component.name);
      seen.add(id);
      const draft = /DRAFT/i.test(catalogLine);
      const needsHuman = draft
        || /possibly brand-only/i.test(catalogLine)
        || /possibly product-only/i.test(catalogLine);
      const decision = {
        generatedBy: "scripts/figma-components.mjs",
        name: component.name.replaceAll(" / ", "/"),
        status: "candidate",
        uses: 0,
        reason: parsed.purpose,
        source: "figma",
        purpose: parsed.purpose,
        useWhen: parsed.useWhen,
        dontUseWhen: parsed.dontUseWhen,
        props: parsed.props,
        catalog: catalogLine,
        figmaKey: component.key,
        figmaId: component.id,
      };
      if (role === "templates") decision.surface = "social";
      if (needsHuman) decision.needsHuman = true;
      writeFileSync(join(root, "decisions", `${id}.json`), `${JSON.stringify(decision, null, 2)}\n`);
      summary.candidates.push(id);
    }
  }

  // Detect catalog-mapped components that disappeared: compare prior figma decisions.
  for (const entry of readdirSync(join(root, "decisions"))) {
    if (!entry.endsWith(".json")) continue;
    const decision = JSON.parse(readFileSync(join(root, "decisions", entry), "utf8"));
    if (decision.source !== "figma") continue;
    const id = entry.replace(/\.json$/, "");
    if (!seen.has(id) && !data.components.some((c) => kebabName(c.name) === id)) {
      summary.removedFromFigma.push(decision.name);
    }
  }

  // Enrich committed export with parsed fields for drift warnings.
  data.components = (data.components || []).map((component) => ({
    ...component,
    pageRole: component.pageRole || pageRoleFor(component.page, structure),
    parsed: parseDescription(component.description),
  }));
  writeFileSync(join(root, "figma/export/components.json"), `${JSON.stringify(data, null, 2)}\n`);

  return summary;
}

if (process.argv[1] && process.argv[1].endsWith("figma-components.mjs")) {
  const summary = await syncComponents();
  console.log(`figma:components source=${summary.source}`);
  console.log(`Candidates: ${summary.candidates.length}`);
  for (const id of summary.candidates) console.log(`  decisions/${id}.json`);
  if (summary.needsDescription.length) {
    console.log("Needs a description in Figma:");
    for (const name of summary.needsDescription) console.log(`  ${name}`);
  }
  if (summary.docUpdates.length) {
    console.log("Proposed doc edits:");
    for (const path of summary.docUpdates) console.log(`  ${path}`);
  }
  if (summary.unmappedVariants.length) {
    console.log("Unmapped Figma variants:");
    for (const line of summary.unmappedVariants) console.log(`  ${line}`);
  }
  if (summary.removedFromFigma.length) {
    console.log("Removed from Figma:");
    for (const name of summary.removedFromFigma) console.log(`  ${name}`);
  }
}
