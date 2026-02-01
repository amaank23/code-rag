import { Command } from "commander";
import ora from "ora";
import { retrieveRelevantChunks } from "../core/retriever";
import { buildContext } from "../core/context";

export const askCommand = new Command("ask")
  .argument("<question>", "question about the codebase")
  .option("-k, --topk <number>", "number of chunks", "5")
  .description("Ask questions about the indexed repository")
  .action(async (question, options) => {
    const spinner = ora("Searching codebase...").start();

    try {
      const chunks = await retrieveRelevantChunks(
        question,
        Number(options.topk),
      );

      spinner.stop();

      if (chunks.length === 0) {
        console.log("No relevant code found.");
        return;
      }

      const context = buildContext(chunks);

      console.log("\n📄 Relevant Code Context:\n");
      console.log(context);

      // Next step: send this context to an LLM
    } catch (err) {
      spinner.fail("Failed to retrieve results");
      console.error(err);
    }
  });
