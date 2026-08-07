import packageJson from "../package.json";

export interface CliResult {
  exitCode: 0 | 1;
  output: string;
}

const USAGE = `Usage: gibbon-migrator <command>

gibbon-migrator imports a school's Gibbon MySQL data into PurpleSchools.

Commands:
  (none yet) - extract/transform/load commands land once the target
               Foundation schema (School/Person/Role/...) exists in apps/api.

Options:
  -v, --version  print the CLI version
  -h, --help     print this message`;

/**
 * Pure argv -> result function so the CLI's behavior is fully unit
 * testable without spawning a process or touching stdout/stderr.
 */
export function run(argv: readonly string[]): CliResult {
  const [command] = argv;

  if (command === "--version" || command === "-v") {
    return { exitCode: 0, output: packageJson.version };
  }

  if (command === "--help" || command === "-h") {
    return { exitCode: 0, output: USAGE };
  }

  if (!command) {
    return { exitCode: 1, output: USAGE };
  }

  return {
    exitCode: 1,
    output: `Unknown command: ${command}\n\n${USAGE}`,
  };
}
