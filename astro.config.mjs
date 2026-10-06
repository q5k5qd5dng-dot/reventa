import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    build: { assetsInlineLimit: Infinity },
    plugins: [tailwindcss()],
  },
});
