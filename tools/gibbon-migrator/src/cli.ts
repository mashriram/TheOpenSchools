import packageJson from "../package.json";
import { runMigration, formatReport } from "./migrate";

export interface CliResult {
  exitCode: 0 | 1;
  output: string;
}

const USAGE = `Usage: gibbon-migrator <command>

gibbon-migrator imports a school's Gibbon MySQL data into PurpleSchools.

Commands:
  migrate <schoolName> <subdomainSlug>
      Extracts Foundation data from the source Gibbon database, transforms
      it, and loads it into the target PurpleSchools database as a new
      school. Dry-run by default (rolls back); pass --commit to write for
      real. Connection details are read from environment variables:
        GIBBON_SOURCE_HOST, GIBBON_SOURCE_PORT, GIBBON_SOURCE_USER,
        GIBBON_SOURCE_PASSWORD, GIBBON_SOURCE_DATABASE
        TARGET_HOST, TARGET_PORT, TARGET_USER, TARGET_PASSWORD,
        TARGET_DATABASE

Options:
  -v, --version  print the CLI version
  -h, --help     print this message`;

function requireEnv(env: Record<string, string | undefined>, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function runMigrateCommand(
  args: readonly string[],
  env: Record<string, string | undefined>,
): Promise<CliResult> {
  const [schoolName, subdomainSlug] = args;
  if (!schoolName || !subdomainSlug) {
    return {
      exitCode: 1,
      output: "Usage: gibbon-migrator migrate <schoolName> <subdomainSlug> [--commit]",
    };
  }

  const report = await runMigration({
    source: {
      host: requireEnv(env, "GIBBON_SOURCE_HOST"),
      port: env.GIBBON_SOURCE_PORT ? Number.parseInt(env.GIBBON_SOURCE_PORT, 10) : undefined,
      user: requireEnv(env, "GIBBON_SOURCE_USER"),
      password: requireEnv(env, "GIBBON_SOURCE_PASSWORD"),
      database: requireEnv(env, "GIBBON_SOURCE_DATABASE"),
    },
    target: {
      host: requireEnv(env, "TARGET_HOST"),
      port: env.TARGET_PORT ? Number.parseInt(env.TARGET_PORT, 10) : undefined,
      user: requireEnv(env, "TARGET_USER"),
      password: requireEnv(env, "TARGET_PASSWORD"),
      database: requireEnv(env, "TARGET_DATABASE"),
    },
    schoolName,
    subdomainSlug,
    commit: args.includes("--commit"),
  });

  return { exitCode: 0, output: formatReport(report) };
}

/**
 * argv -> result function so the CLI's behavior is testable without
 * spawning a process or touching stdout/stderr. Async since `migrate`
 * does real database I/O - --version/--help/unknown-command paths still
 * resolve synchronously in practice, just wrapped in a resolved Promise.
 */
export async function run(
  argv: readonly string[],
  env: Record<string, string | undefined> = process.env,
): Promise<CliResult> {
  const [command, ...rest] = argv;

  if (command === "--version" || command === "-v") {
    return { exitCode: 0, output: packageJson.version };
  }

  if (command === "--help" || command === "-h") {
    return { exitCode: 0, output: USAGE };
  }

  if (!command) {
    return { exitCode: 1, output: USAGE };
  }

  if (command === "migrate") {
    try {
      return await runMigrateCommand(rest, env);
    } catch (error) {
      return {
        exitCode: 1,
        output: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    exitCode: 1,
    output: `Unknown command: ${command}\n\n${USAGE}`,
  };
}
