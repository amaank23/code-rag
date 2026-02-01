import { Command } from "commander";
import ora from "ora";
import { scanRepository } from "../core/scanner";
import { chunkFile } from "../core/chunker";
import { indexChunks } from "../core/indexer";

export const indexCommand = new Command("index")
  .argument("<path>", "path to repository")
  .description("Index a codebase into vector store")
  .action(async (path) => {
    const spinner = ora("Indexing repository...").start();

    try {
      // later:
      const files = await scanRepository(path);

      let allChunks = [];

      for (const file of files) {
        const chunks = chunkFile(file);
        allChunks.push(...chunks);
      }

      spinner.text = `Embedding ${allChunks.length} chunks...`;

      await indexChunks(allChunks);

      spinner.succeed(
        `Indexed ${files.length} files → ${allChunks.length} chunks`,
      );
      spinner.succeed(`Repository indexed: ${path}`);
    } catch (err) {
      spinner.fail("Indexing failed");
      console.error(err);
    }
  });
