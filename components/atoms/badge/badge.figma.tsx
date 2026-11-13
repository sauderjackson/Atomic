/**
 * Code Connect template for Badge (Figma Status, Style=Tag).
 *
 * Instructions for agents:
 * - Catalog entry: Badge in catalog.json
 * - Rules: RULES.md (status hues stay success, warning, error, info)
 * - Figma Neutral tone is not in code. Do not map it.
 */
import figma from "@figma/code-connect";
import { Badge } from "./Badge";

figma.connect(Badge, "https://www.figma.com/design/N2DLpNwbJwzoNqFWgQdVwl/Atomic?node-id=76-42", {
  props: {
    tone: figma.enum("Tone", {
      Success: "success",
      Warning: "warning",
      Error: "error",
      Info: "info",
    }),
    children: figma.string("Label"),
  },
  example: ({ tone, children }) => <Badge tone={tone}>{children}</Badge>,
});
