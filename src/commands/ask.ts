import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import * as path from "path";
import * as fs from "fs";
import { retrieveRelevantChunks } from "../core/retriever";
import { buildContext } from "../core/context";
import { config } from "../config";
import { getLLM } from "../llms/registry";

export const askCommand = new Command("ask")
  .argument("<question>", "question about the codebase")
  .option("-k, --topk <number>", "number of chunks", "5")
  .option(
    "-p, --project <path>",
    "path to the indexed project",
    process.cwd()
  )
  .description("Ask questions about the indexed repository")
  .action(async (question, options) => {
    const spinner = ora("Validating project path...").start();

    try {
      // Validate and resolve project path
      const projectPath = path.resolve(options.project);
      if (!fs.existsSync(projectPath)) {
        spinner.fail(
          chalk.red(`Project path does not exist: ${options.project}`)
        );
        console.error(
          chalk.yellow(
            "\nTip: Use --project <path> to specify the indexed project, or run from the project directory."
          )
        );
        process.exit(1);
      }

      spinner.text = "Searching codebase...";

      let chunks = await retrieveRelevantChunks(
        question,
        projectPath,
        Number(options.topk),
      );

      if (chunks.length === 0) {
        spinner.fail("No relevant code found.");
        console.error(
          chalk.yellow(
            `\nNo results found in project: ${projectPath}`
          )
        );
        console.error(
          chalk.yellow(
            "Make sure you've indexed this project first with: code-rag index <path>"
          )
        );
        return;
      }

      // Optional reranking step
      if (config.reranker) {
        spinner.text = "Reranking results...";
        const rerankerLLM = getLLM(config.reranker);

        if (rerankerLLM?.rerank) {
          try {
            const rankedIds = await rerankerLLM.rerank({
              query: question,
              chunks: chunks
                .filter((c) => c.content !== null)
                .map((c) => ({
                  id: c.metadata.id || `${c.metadata.filePath}:${c.metadata.startLine}-${c.metadata.endLine}`,
                  content: c.content!,
                  metadata: c.metadata,
                })),
              topK: Number(options.topk),
            });

            // Reorder chunks based on ranked IDs
            const idToChunk = new Map(
              chunks.map((c) => [
                c.metadata.id || `${c.metadata.filePath}:${c.metadata.startLine}-${c.metadata.endLine}`,
                c,
              ])
            );
            chunks = rankedIds
              .map((id) => idToChunk.get(id))
              .filter((c) => c !== undefined) as typeof chunks;
          } catch (rerankErr) {
            console.warn(
              chalk.yellow("\nWarning: Reranking failed, using original order")
            );
          }
        }
      }

      const context = buildContext(chunks);

      spinner.text = "Generating answer...";

      // Generate answer using configured LLM
      const answerLLM = getLLM(config.answerModel);
      if (!answerLLM) {
        spinner.fail(
          `LLM "${config.answerModel}" not found. Check your .coderag.json configuration.`
        );
        return;
      }

      const answer = await answerLLM.answer({
        query: question,
        context,
      });

      spinner.succeed(`Answer generated from project: ${path.basename(projectPath)}`);

      console.log(chalk.cyan("\n📄 Relevant Code Context:\n"));
      console.log(context);

      console.log(chalk.green("\n💡 Answer:\n"));
      console.log(answer);
    } catch (err) {
      spinner.fail(chalk.red("Failed to generate answer"));

      if (err instanceof Error) {
        if (err.message.includes("API key not configured")) {
          console.error(
            chalk.red(
              `\n❌ ${err.message}`
            )
          );
          console.error(
            chalk.yellow(
              "Please set up your .env file with the required API keys. See .env.example for details.\n"
            )
          );
        } else if (err.message.includes("ECONNREFUSED")) {
          console.error(
            chalk.red(
              "\n❌ Cannot connect to Chroma database. Make sure Chroma is running on localhost:8000"
            )
          );
          console.error(
            chalk.yellow("Run: docker run -p 8000:8000 chromadb/chroma\n")
          );
        } else if (err.message.includes("quota") || err.message.includes("rate limit")) {
          console.error(
            chalk.red(
              "\n❌ API rate limit or quota exceeded. Please check your API usage.\n"
            )
          );
        } else {
          console.error(chalk.red(`\n❌ Error: ${err.message}`));
          if (process.env.DEBUG) {
            console.error(err.stack);
          }
        }
      } else {
        console.error(chalk.red(`\n❌ Unknown error: ${String(err)}`));
      }

      process.exit(1);
    }
  });
