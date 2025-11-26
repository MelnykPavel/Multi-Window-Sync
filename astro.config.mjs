// @ts-check
import { defineConfig } from "astro/config";
// Import /static for a static site
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  // Must be 'static' or 'hybrid'
  output: "static",
  adapter: vercel({
    edgeMiddleware: true,
  }),
});
