import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { renderThemes, root } from "./tokens.mjs";

const out = join(root, "tokens/build/themes.css");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, renderThemes());
console.log(`Wrote ${out}`);
