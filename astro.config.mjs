import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://siemprewave.es",
  redirects: { "/empresas": "/" },
  vite: {
    plugins: [tailwindcss()],
  },
});
