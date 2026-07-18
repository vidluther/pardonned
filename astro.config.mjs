// @ts-check
import { defineConfig, fontProviders } from "astro/config";
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
  // Fonts API downloads at build time and serves the files first-party —
  // no runtime requests to fonts.googleapis.com/gstatic.
  fonts: [
    {
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ["normal"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      name: "DM Serif Display",
      cssVariable: "--font-dm-serif-display",
      provider: fontProviders.google(),
      weights: [400],
      styles: ["normal"],
      fallbacks: ["Georgia", "serif"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
