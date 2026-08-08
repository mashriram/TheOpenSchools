import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Integration tests hit real MySQL databases (a scratch Gibbon source +
    // the local PurpleSchools target) - kept out of the default fast/pure
    // unit run, same split as apps/api's jest vs jest-e2e. Run them via
    // `pnpm test:integration`.
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});
