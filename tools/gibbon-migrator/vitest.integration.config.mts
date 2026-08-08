import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.integration.test.ts"],
    // extract+transform+load against real data (1000+ people/enrolments)
    // takes longer than a pure unit test.
    testTimeout: 30_000,
  },
});
