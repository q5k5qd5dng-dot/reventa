import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://siemprewave.es",
  vite: {
    plugins: [tailwindcss()],
  },
});
