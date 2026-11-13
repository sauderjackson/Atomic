/**
 * Code Connect template for TextInput.
 *
 * Instructions for agents:
 * - Catalog entry: TextInput in catalog.json
 * - Rules: RULES.md (semantic tokens, FieldGroup when a label is needed)
 */
import figma from "@figma/code-connect";
import { TextInput } from "./TextInput";

figma.connect(TextInput, "https://www.figma.com/design/N2DLpNwbJwzoNqFWgQdVwl/Atomic?node-id=60-31", {
  props: {
    value: figma.string("Value"),
  },
  example: ({ value }) => <TextInput defaultValue={value} />,
});
