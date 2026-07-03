// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://pardonned.com",
  // astro is pinned to exactly 7.0.3: versions 7.0.4–7.0.6 fail the build for
  // dynamic file endpoints (src/pages/og/**/[slug].png.ts) combined with
  // trailingSlash "always" — see withastro/astro#17241. Unpin once the fix ships.
  trailingSlash: "always",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
