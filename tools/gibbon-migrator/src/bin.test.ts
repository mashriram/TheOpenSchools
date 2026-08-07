import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "../package.json";

const originalArgv = process.argv;

describe("bin entrypoint", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it("prints the version to stdout and exits 0 for --version", async () => {
    process.argv = ["node", "bin.js", "--version"];

    await import("./bin");

    expect(logSpy).toHaveBeenCalledWith(packageJson.version);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("prints usage to stderr and exits 1 when no command is given", async () => {
    process.argv = ["node", "bin.js"];

    await import("./bin");

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Usage"));
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("prints the unknown-command error to stderr and exits 1", async () => {
    process.argv = ["node", "bin.js", "frobnicate"];

    await import("./bin");

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown command: frobnicate"),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("routes success output to console.log and never to console.error", async () => {
    process.argv = ["node", "bin.js", "--help"];

    await import("./bin");

    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
