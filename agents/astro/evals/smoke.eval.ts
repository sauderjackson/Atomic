import { defineEval, includes } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
  description: "A harbor web hero uses the system and rejects a raw color.",
  async test(t) {
    await t.send(
      "Using the harbor theme, specify an on-system web hero. Name the components and the semantic tokens. Reject a hard-coded color.",
    );
    t.succeeded();
    t.calledTool("validate_theme", { input: { theme: "harbor" } });
    t.calledTool("lookup_component");
    t.check(t.reply, includes(/color\.action\.primary/));
    t.check(t.reply, includes(/primary/i));
  },
});
