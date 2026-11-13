import { fileURLToPath, URL } from "node:url";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: "Atomic",
      description: "A brand-agnostic design system. A theme supplies values. The pieces stay the same.",
      sidebar: [
        { label: "Start here", link: "/" },
        { label: "Figma source", link: "/figma-source/" },
        { label: "Foundations", autogenerate: { directory: "foundations" } },
        { label: "Components", autogenerate: { directory: "components" } },
        { label: "Gallery", link: "/gallery/" },
      ],
    }),
  ],
  vite: {
    resolve: {
      alias: {
        "@components": fileURLToPath(new URL("../components", import.meta.url)),
        react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
        "react-dom": fileURLToPath(new URL("./node_modules/react-dom", import.meta.url)),
        "lucide-react": fileURLToPath(new URL("./node_modules/lucide-react", import.meta.url)),
      },
    },
    server: {
      fs: {
        allow: [repoRoot],
      },
    },
  },
});
