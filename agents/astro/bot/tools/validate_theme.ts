import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { validateThemeName } from "../lib/repo";

export default defineTool({
  description: "Validate a theme file against tokens/schema.json. A theme supplies values only.",
  effect: "read",
  inputSchema: z.object({
    theme: z.string().describe("Theme name, such as okvy or neutral."),
  }),
  execute({ theme }) {
    return validateThemeName(theme);
  },
});
