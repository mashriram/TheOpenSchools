#!/usr/bin/env node
import { run } from "./cli";

const { exitCode, output } = run(process.argv.slice(2));
if (exitCode === 0) {
  console.log(output);
} else {
  console.error(output);
}
process.exit(exitCode);
