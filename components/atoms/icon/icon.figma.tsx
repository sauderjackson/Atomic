/**
 * Code Connect template for Icon (Figma IconSwap).
 *
 * Instructions for agents:
 * - Catalog entry: Icon in catalog.json
 * - Rules: RULES.md (icons go through icons/; Lucide is the default set)
 * - The Figma Icon instance-swap maps to the `name` prop.
 */
import figma from "@figma/code-connect";
import { Icon } from "./Icon";

figma.connect(Icon, "https://www.figma.com/design/N2DLpNwbJwzoNqFWgQdVwl/Atomic?node-id=71-164", {
  props: {
    name: figma.string("Icon"),
  },
  example: ({ name }) => <Icon name={name} />,
});
