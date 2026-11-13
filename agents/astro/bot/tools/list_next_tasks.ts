import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import { nextTasks } from "../lib/repo";

export default defineTool({
  description: "List the next Not started rows from the Project Atomic board, in order.",
  effect: "read",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(10).optional().describe("How many rows to return. Defaults to 1."),
  }),
  execute({ limit }) {
    const count = limit ?? 1;
    return {
      source: "Project Atomic",
      next: nextTasks[0] ?? null,
      tasks: nextTasks.slice(0, count),
      remaining: Math.max(nextTasks.length - count, 0),
    };
  },
});
