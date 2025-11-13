// @ts-check
import { defineConfig } from "astro/config";
import "dotenv/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// Determine adapter based on environment
const isCloudflare = process.env.CLOUDFLARE === "true";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || "https://discord-wannabe.pages.dev",
  output: "server",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["crypto", "path", "fs", "os"],
    },
    resolve: isCloudflare
      ? {
          alias: {
            "react-dom/server": "react-dom/server.edge",
          },
        }
      : undefined,
  },
  image: {
    service: isCloudflare
      ? { entrypoint: "astro/assets/services/noop" }
      : undefined,
  },
  server: { port: 3000 },
  adapter: isCloudflare
    ? cloudflare({
        platformProxy: {
          enabled: true,
        },
      })
    : node({
        mode: "standalone",
      }),
});
