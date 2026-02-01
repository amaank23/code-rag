import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { scanRepository } from "../core/scanner";
import { chunkFile } from "../core/chunker";
import { indexChunks } from "../core/indexer";

export const indexCommand = new Command("index")
  .argument("<path>", "path to repository")
  .description("Index a codebase into vector store")
  .action(async (repoPath) => {
    const spinner = ora("Validating repository path...").start();

    try {
      // Validate path exists
      const absolutePath = path.resolve(repoPath);
      if (!fs.existsSync(absolutePath)) {
        spinner.fail(chalk.red(`Path does not exist: ${repoPath}`));
        process.exit(1);
      }

      if (!fs.statSync(absolutePath).isDirectory()) {
        spinner.fail(chalk.red(`Path is not a directory: ${repoPath}`));
        process.exit(1);
      }

      spinner.text = "Scanning repository...";
      const files = await scanRepository(absolutePath);

      if (files.length === 0) {
        spinner.warn(
          chalk.yellow(
            "No files found to index. Check your ignore patterns or repository content."
          )
        );
        return;
      }

      spinner.text = `Chunking ${files.length} files...`;
      let allChunks = [];

      for (const file of files) {
        try {
          const chunks = chunkFile(file);
          allChunks.push(...chunks);
        } catch (chunkErr) {
          console.warn(
            chalk.yellow(
              `\nWarning: Failed to chunk file ${file.path}: ${chunkErr instanceof Error ? chunkErr.message : String(chunkErr)}`
            )
          );
        }
      }

      if (allChunks.length === 0) {
        spinner.fail(
          chalk.red(
            "No chunks generated from files. Repository may be empty or files may be too small."
          )
        );
        return;
      }

      spinner.text = `Embedding and indexing ${allChunks.length} chunks...`;

      await indexChunks(allChunks, absolutePath);

      spinner.succeed(
        chalk.green(
          `Successfully indexed ${files.length} files → ${allChunks.length} chunks from ${absolutePath}`
        )
      );
    } catch (err) {
      spinner.fail(chalk.red("Indexing failed"));

      if (err instanceof Error) {
        if (err.message.includes("ECONNREFUSED")) {
          console.error(
            chalk.red(
              "\n❌ Cannot connect to Chroma database. Make sure Chroma is running on localhost:8000"
            )
          );
          console.error(
            chalk.yellow(
              "Run: docker run -p 8000:8000 chromadb/chroma\n"
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
