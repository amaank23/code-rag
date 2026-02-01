import { Command } from "commander";
import { indexCommand } from "./commands/index";
import { askCommand } from "./commands/ask";

const program = new Command();

program
  .name("code-rag")
  .description("CLI-based Code Repository Assistant")
  .version("0.1.0");

program.addCommand(indexCommand);
program.addCommand(askCommand);

program.parse();
