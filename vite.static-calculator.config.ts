import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "static-calculator",
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      "next/link": path.resolve(import.meta.dirname, "static-calculator/next-link.tsx"),
    },
  },
  build: {
    outDir: "../dist-static-calculator",
    emptyOutDir: true,
  },
});
