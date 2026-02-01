#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { indexCommand } from "./commands/index";
import { askCommand } from "./commands/ask";

// Global error handlers
process.on("unhandledRejection", (reason) => {
  console.error(
    chalk.red("\n❌ Unhandled promise rejection:"),
    reason instanceof Error ? reason.message : String(reason)
  );
  if (process.env.DEBUG && reason instanceof Error) {
    console.error(reason.stack);
  }
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(chalk.red("\n❌ Uncaught exception:"), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

const program = new Command();

program
  .name("code-rag")
  .description("CLI-based Code Repository Assistant")
  .version("0.1.0");

program.addCommand(indexCommand);
program.addCommand(askCommand);

try {
  program.parse();
} catch (err) {
  console.error(
    chalk.red("\n❌ Fatal error:"),
    err instanceof Error ? err.message : String(err)
  );
  process.exit(1);
}
