import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { listCollections, deleteCollection, chroma } from "../db/chroma";

export const collectionsCommand = new Command("collections")
  .description("Manage indexed project collections");

// List all indexed projects
collectionsCommand
  .command("list")
  .alias("ls")
  .description("List all indexed projects")
  .action(async () => {
    const spinner = ora("Fetching collections...").start();

    try {
      const collections = await listCollections();

      spinner.stop();

      if (collections.length === 0) {
        console.log(
          chalk.yellow(
            "\nNo indexed projects found. Index a project with: code-rag index <path>"
          )
        );
        return;
      }

      console.log(chalk.cyan(`\n📚 Indexed Projects (${collections.length}):\n`));

      for (const collection of collections) {
        const metadata = collection.metadata as any;
        const projectPath = metadata?.projectPath || "Unknown";
        const createdAt = metadata?.createdAt
          ? new Date(metadata.createdAt).toLocaleString()
          : "Unknown";

        // Get collection stats
        const count = await collection.count();

        console.log(chalk.green(`  • ${path.basename(projectPath)}`));
        console.log(chalk.gray(`    Path: ${projectPath}`));
        console.log(chalk.gray(`    Collection: ${collection.name}`));
        console.log(chalk.gray(`    Chunks: ${count}`));
        console.log(chalk.gray(`    Created: ${createdAt}`));
        console.log();
      }
    } catch (err) {
      spinner.fail(chalk.red("Failed to list collections"));
      console.error(err);
      process.exit(1);
    }
  });

// Delete a project's collection
collectionsCommand
  .command("delete")
  .alias("rm")
  .argument("<path>", "path to the project to remove")
  .description("Delete an indexed project")
  .action(async (projectPath) => {
    const spinner = ora("Deleting collection...").start();

    try {
      const absolutePath = path.resolve(projectPath);
      await deleteCollection(absolutePath);

      spinner.succeed(
        chalk.green(`Successfully deleted collection for: ${absolutePath}`)
      );
    } catch (err) {
      spinner.fail(chalk.red("Failed to delete collection"));

      if (err instanceof Error) {
        if (err.message.includes("not found")) {
          console.error(
            chalk.yellow(
              "\nCollection not found. Use 'code-rag collections list' to see indexed projects."
            )
          );
        } else {
          console.error(chalk.red(`\n❌ Error: ${err.message}`));
        }
      }

      process.exit(1);
    }
  });

// Clear all code-rag collections
collectionsCommand
  .command("clear")
  .description("Delete all indexed projects (use with caution)")
  .action(async () => {
    const spinner = ora("Fetching collections...").start();

    try {
      const collections = await listCollections();

      if (collections.length === 0) {
        spinner.info("No collections to clear");
        return;
      }

      spinner.text = `Deleting ${collections.length} collections...`;

      for (const collection of collections) {
        await chroma.deleteCollection({ name: collection.name });
      }

      spinner.succeed(
        chalk.green(`Successfully cleared ${collections.length} collections`)
      );
    } catch (err) {
      spinner.fail(chalk.red("Failed to clear collections"));
      console.error(err);
      process.exit(1);
    }
  });
