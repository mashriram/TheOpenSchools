import { describe, expect, it } from "vitest";
import { run } from "./cli";
import packageJson from "../package.json";

describe("cli run()", () => {
  it("prints the package version for --version", async () => {
    const result = await run(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(packageJson.version);
  });

  it("accepts -v as a shorthand for --version", async () => {
    const result = await run(["-v"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(packageJson.version);
  });

  it("prints usage for --help", async () => {
    const result = await run(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Usage");
    expect(result.output).toContain("gibbon-migrator");
  });

  it("accepts -h as a shorthand for --help", async () => {
    const result = await run(["-h"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Usage");
  });

  it("exits non-zero with usage help when no command is given", async () => {
    const result = await run([]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Usage");
  });

  it("exits non-zero with a clear message for an unrecognized command", async () => {
    const result = await run(["frobnicate"]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Unknown command: frobnicate");
  });

  it("ignores trailing args after --version rather than treating them as a second command", async () => {
    const result = await run(["--version", "extra-arg"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(packageJson.version);
  });

  it("is case-sensitive, so --VERSION is treated as an unknown command, not a version flag", async () => {
    const result = await run(["--VERSION"]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Unknown command: --VERSION");
  });

  it("treats an empty-string argument the same as no command at all", async () => {
    const result = await run([""]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Usage");
  });

  describe("migrate command", () => {
    it("requires both schoolName and subdomainSlug arguments", async () => {
      const result = await run(["migrate"], {});

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain("Usage: gibbon-migrator migrate");
    });

    it("fails clearly when required source connection env vars are missing", async () => {
      const result = await run(["migrate", "Greenwood High", "greenwood"], {});

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain("Missing required environment variable");
      expect(result.output).toContain("GIBBON_SOURCE_HOST");
    });

    it("checks target env vars too once source ones are present", async () => {
      const result = await run(["migrate", "Greenwood High", "greenwood"], {
        GIBBON_SOURCE_HOST: "localhost",
        GIBBON_SOURCE_USER: "root",
        GIBBON_SOURCE_PASSWORD: "pw",
        GIBBON_SOURCE_DATABASE: "gibbon_source",
      });

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain("Missing required environment variable: TARGET_HOST");
    });
  });
});
