// @ts-check
import { defineConfig } from "astro/config";
import "dotenv/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: { port: 3000 },
  adapter: node({
    mode: "standalone",
  }),
});
