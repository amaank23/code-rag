import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface SetupAnswers {
  answerModel: string;
  reranker: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
  claudeModel: string;
  geminiModel: string;
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupWizard(): Promise<SetupAnswers> {
  const rl = createInterface();
  const answers: Partial<SetupAnswers> = {};

  console.log(chalk.cyan("\n🚀 Welcome to code-rag setup!\n"));
  console.log(
    "This wizard will help you configure your LLM providers and preferences.\n"
  );

  // Ask which model for answering
  console.log(chalk.yellow("Question 1: Choose your answer generation model"));
  console.log("  1. Claude (Anthropic) - Recommended for accuracy");
  console.log("  2. Gemini (Google) - Fast and cost-effective");
  const answerChoice = await question(
    rl,
    chalk.green("\nEnter your choice (1 or 2): ")
  );

  answers.answerModel = answerChoice === "1" ? "claude" : "gemini";

  // Ask about reranking
  console.log(chalk.yellow("\nQuestion 2: Do you want to enable reranking?"));
  console.log("Reranking improves result quality but uses extra API calls.");
  console.log("  1. Yes, use Claude for reranking");
  console.log("  2. Yes, use Gemini for reranking");
  console.log("  3. No, skip reranking");
  const rerankChoice = await question(
    rl,
    chalk.green("\nEnter your choice (1, 2, or 3): ")
  );

  if (rerankChoice === "1") {
    answers.reranker = "claude";
  } else if (rerankChoice === "2") {
    answers.reranker = "gemini";
  } else {
    answers.reranker = "";
  }

  // Determine which API keys we need
  const needClaude =
    answers.answerModel === "claude" || answers.reranker === "claude";
  const needGemini =
    answers.answerModel === "gemini" || answers.reranker === "gemini";

  // Ask for API keys
  console.log(chalk.yellow("\nQuestion 3: API Key Configuration"));

  if (needClaude) {
    console.log(
      chalk.cyan(
        "\n📝 You'll need a Claude API key from: https://console.anthropic.com/"
      )
    );
    const claudeKey = await question(
      rl,
      chalk.green("Enter your Anthropic API key: ")
    );
    answers.claudeApiKey = claudeKey;

    // Ask for model preference
    console.log(chalk.yellow("\nChoose Claude model:"));
    console.log("  1. claude-3-5-sonnet (Recommended - Best quality)");
    console.log("  2. claude-3-haiku (Faster, cheaper)");
    const claudeModelChoice = await question(
      rl,
      chalk.green("\nEnter your choice (1 or 2, default: 1): ")
    );
    answers.claudeModel =
      claudeModelChoice === "2" ? "claude-3-haiku-20240307" : "claude-3-5-sonnet-20241022";
  }

  if (needGemini) {
    console.log(
      chalk.cyan(
        "\n📝 You'll need a Gemini API key from: https://makersuite.google.com/app/apikey"
      )
    );
    const geminiKey = await question(
      rl,
      chalk.green("Enter your Google API key: ")
    );
    answers.geminiApiKey = geminiKey;

    // Ask for model preference
    console.log(chalk.yellow("\nChoose Gemini model:"));
    console.log("  1. gemini-1.5-flash (Recommended - Fast and cheap)");
    console.log("  2. gemini-1.5-pro (More capable, slower)");
    const geminiModelChoice = await question(
      rl,
      chalk.green("\nEnter your choice (1 or 2, default: 1): ")
    );
    answers.geminiModel =
      geminiModelChoice === "2" ? "gemini-1.5-pro" : "gemini-1.5-flash";
  }

  // Set defaults for unused models
  if (!needClaude) {
    answers.claudeModel = "claude-3-5-sonnet-20241022";
  }
  if (!needGemini) {
    answers.geminiModel = "gemini-1.5-flash";
  }

  rl.close();
  return answers as SetupAnswers;
}

function createEnvFile(answers: SetupAnswers): void {
  const envPath = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".env");

  let envContent = "";

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Update or add API keys
  const updateEnvVar = (key: string, value?: string) => {
    if (!value) return;

    const regex = new RegExp(`^${key}=.*$`, "m");
    const newLine = `${key}=${value}`;

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
  };

  updateEnvVar("ANTHROPIC_API_KEY", answers.claudeApiKey);
  updateEnvVar("GEMINI_API_KEY", answers.geminiApiKey);

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log(chalk.green(`\n✓ API keys saved to ${envPath}`));
}

function createConfigFile(answers: SetupAnswers): void {
  const configPath = path.join(
    process.env.HOME || process.env.USERPROFILE || "~",
    ".coderag.json"
  );

  const config = {
    reranker: answers.reranker,
    answerModel: answers.answerModel,
    models: {
      claude: {
        apiKey: "ANTHROPIC_API_KEY",
        model: answers.claudeModel,
      },
      gemini: {
        apiKey: "GEMINI_API_KEY",
        model: answers.geminiModel,
      },
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green(`✓ Configuration saved to ${configPath}`));
}

function displaySummary(answers: SetupAnswers): void {
  console.log(chalk.cyan("\n" + "=".repeat(50)));
  console.log(chalk.cyan("📋 Setup Summary"));
  console.log(chalk.cyan("=".repeat(50)));

  console.log(chalk.white("\nAnswer Generation:"));
  console.log(
    chalk.green(
      `  Model: ${answers.answerModel === "claude" ? "Claude" : "Gemini"} (${answers.answerModel === "claude" ? answers.claudeModel : answers.geminiModel})`
    )
  );

  console.log(chalk.white("\nReranking:"));
  if (answers.reranker) {
    console.log(
      chalk.green(
        `  Enabled with ${answers.reranker === "claude" ? "Claude" : "Gemini"}`
      )
    );
  } else {
    console.log(chalk.yellow("  Disabled"));
  }

  console.log(chalk.white("\nAPI Keys:"));
  if (answers.claudeApiKey) {
    console.log(
      chalk.green(`  Claude: ${answers.claudeApiKey.substring(0, 15)}...`)
    );
  }
  if (answers.geminiApiKey) {
    console.log(
      chalk.green(`  Gemini: ${answers.geminiApiKey.substring(0, 15)}...`)
    );
  }

  console.log(chalk.cyan("\n" + "=".repeat(50)));
  console.log(chalk.green("\n✅ Setup complete!"));
  console.log(chalk.white("\nNext steps:"));
  console.log(chalk.yellow("  1. Start ChromaDB:"));
  console.log(
    chalk.gray("     docker run -p 8000:8000 chromadb/chroma")
  );
  console.log(chalk.yellow("\n  2. Index a repository:"));
  console.log(chalk.gray("     code-rag index /path/to/your/project"));
  console.log(chalk.yellow("\n  3. Ask questions:"));
  console.log(
    chalk.gray('     code-rag ask "how does authentication work?"')
  );
  console.log();
}

export const setupCommand = new Command("setup")
  .description("Interactive setup wizard for configuring code-rag")
  .action(async () => {
    try {
      const answers = await setupWizard();
      createEnvFile(answers);
      createConfigFile(answers);
      displaySummary(answers);
    } catch (err) {
      console.error(chalk.red("\n❌ Setup failed"));
      if (err instanceof Error) {
        console.error(chalk.red(err.message));
      }
      process.exit(1);
    }
  });
