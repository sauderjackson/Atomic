import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  description:
    "Reviews a change against RULES.md. Use before calling work ready. Schema and raw-value checks block. The written rules review warns.",
});
