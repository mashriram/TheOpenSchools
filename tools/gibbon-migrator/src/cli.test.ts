import { describe, expect, it } from "vitest";
import { run } from "./cli";
import packageJson from "../package.json";

describe("cli run()", () => {
  it("prints the package version for --version", () => {
    const result = run(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(packageJson.version);
  });

  it("accepts -v as a shorthand for --version", () => {
    const result = run(["-v"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(packageJson.version);
  });

  it("prints usage for --help", () => {
    const result = run(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Usage");
    expect(result.output).toContain("gibbon-migrator");
  });

  it("accepts -h as a shorthand for --help", () => {
    const result = run(["-h"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Usage");
  });

  it("exits non-zero with usage help when no command is given", () => {
    const result = run([]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Usage");
  });

  it("exits non-zero with a clear message for an unrecognized command", () => {
    const result = run(["frobnicate"]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Unknown command: frobnicate");
  });

  it("ignores trailing args after --version rather than treating them as a second command", () => {
    const result = run(["--version", "extra-arg"]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toBe(packageJson.version);
  });

  it("is case-sensitive, so --VERSION is treated as an unknown command, not a version flag", () => {
    const result = run(["--VERSION"]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Unknown command: --VERSION");
  });

  it("treats an empty-string argument the same as no command at all", () => {
    const result = run([""]);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Usage");
  });
});
