import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { readJson, root } from "./tokens.mjs";

const skipDirs = new Set(["node_modules", "dist", ".git", "tokens", "themes", "agents"]);
const extensions = new Set([".css", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json"]);
const hexPattern = new RegExp("#(?:" + "[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b", "g");
const rgbPattern = new RegExp("rgba?\\([^)]*\\)", "g");
const pxPattern = new RegExp("\\d+" + "px\\b", "g");

export function collectFindings() {
  const catalog = readJson("catalog.json");
  const findings = [];
  scan(root, catalog, findings);
  return findings;
}

export function suggest(raw, catalog) {
  const normalized = normalize(raw);
  if (!normalized) return { severity: "major", use: "no token is close", token: "" };
  const groups = tokenGroups(catalog);
  const pool = normalized.kind === "color" ? groups.colors : groups.lengths;
  const exact = pool.filter((token) => token.values.includes(normalized.key));
  if (exact.length > 0) {
    return { severity: "major", use: exact[0].use, token: exact.map((token) => token.name).join(" or ") };
  }
  if (normalized.kind !== "color") return { severity: "major", use: "no token is close", token: "" };
  let best = null;
  for (const token of groups.colors) {
    for (const value of token.parsed) {
      const distance = colorDistance(normalized.rgb, value);
      if (!best || distance < best.distance) best = { token, distance };
    }
  }
  if (best && best.distance <= 48) {
    return { severity: "minor", use: best.token.use, token: best.token.name };
  }
  return { severity: "major", use: "no token is close", token: "" };
}

function tokenGroups(catalog) {
  const colors = [];
  const lengths = [];
  for (const [name, token] of Object.entries(catalog.tokens)) {
    const values = [];
    for (const theme of Object.values(token.values)) {
      for (const value of Object.values(theme)) values.push(String(value).toLowerCase());
    }
    const entry = { name, use: token.use, values: [...new Set(values)] };
    if (token.type === "color") {
      entry.parsed = entry.values.map(hexToRgb).filter(Boolean);
      colors.push(entry);
    } else {
      lengths.push(entry);
    }
  }
  return { colors, lengths };
}

function scan(dir, catalog, findings) {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      scan(path, catalog, findings);
      continue;
    }
    if (entry === "package-lock.json" || entry === "BRIEF.md" || entry === "catalog.json") continue;
    const rel = relative(root, path);
    if (rel.startsWith(join("docs-site", "src", "content", "docs"))) continue;
    const dot = entry.lastIndexOf(".");
    if (dot < 0 || !extensions.has(entry.slice(dot))) continue;
    const text = readFileSync(path, "utf8");
    for (const pattern of [hexPattern, rgbPattern, pxPattern]) {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        const hint = suggest(match[0], catalog);
        findings.push({
          severity: hint.severity,
          file: rel,
          line: text.slice(0, match.index).split("\n").length,
          raw: match[0],
          use: hint.use,
          token: hint.token,
        });
      }
    }
  }
}

function normalize(raw) {
  const text = String(raw).trim().toLowerCase();
  if (text.startsWith("#")) {
    const rgb = hexToRgb(text);
    if (!rgb) return null;
    return { kind: "color", key: rgbToHex(rgb), rgb };
  }
  const rgbMatch = text.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const rgb = [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    return { kind: "color", key: rgbToHex(rgb), rgb };
  }
  if (/^\d+px$/.test(text)) return { kind: "length", key: text };
  return null;
}

function hexToRgb(hex) {
  let value = hex.slice(1);
  if (value.length === 3) value = value.split("").map((part) => part + part).join("");
  if (value.length === 8) value = value.slice(0, 6);
  if (value.length !== 6) return null;
  return [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16));
}

function rgbToHex(rgb) {
  return `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function colorDistance(left, right) {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
}
