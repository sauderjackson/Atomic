/**
 * Code Connect template for Button.
 *
 * Instructions for agents:
 * - Catalog entry: Button in catalog.json
 * - Rules: RULES.md (one primary action, semantic tokens only)
 * - Figma variants Ghost, Amber, and Forest are not in code. Do not invent props for them.
 */
import figma from "@figma/code-connect";
import { Button } from "./Button";

figma.connect(Button, "https://www.figma.com/design/N2DLpNwbJwzoNqFWgQdVwl/Atomic?node-id=58-93", {
  props: {
    variant: figma.enum("Variant", {
      Primary: "primary",
      Secondary: "secondary",
    }),
    children: figma.string("Label"),
  },
  example: ({ variant, children }) => <Button variant={variant}>{children}</Button>,
});
