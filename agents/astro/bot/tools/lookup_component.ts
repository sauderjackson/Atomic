import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { lookupComponent } from "../lib/repo";

export default defineTool({
  description: "Look up a component's purpose, props, when to use it, and when not to use it.",
  effect: "read",
  inputSchema: z.object({
    name: z.string().describe("Component name, such as Button."),
  }),
  execute({ name }) {
    return lookupComponent(name);
  },
});
