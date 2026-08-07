import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    exclude: ["node_modules", ".next", "e2e"],
    server: {
      deps: {
        inline: [
          /@heroui\//,
          /@react-aria\//,
          /@react-stately\//,
          /@react-types\//,
          /react-aria-components/,
          "react",
          "react-dom",
        ],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
});
