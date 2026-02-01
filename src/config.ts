import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

export interface ModelConfig {
  apiKey: string;
  model: string;
}

export interface Config {
  reranker: string;
  answerModel: string;
  models: {
    [key: string]: ModelConfig;
  };
}

/**
 * Find config file in multiple locations:
 * 1. Current working directory (.coderag.json)
 * 2. User's home directory (~/.coderag.json)
 * 3. Installation directory (code-rag/.coderag.json)
 */
function findConfigPath(): string | null {
  const locations = [
    // Current directory
    path.join(process.cwd(), ".coderag.json"),
    // Home directory
    path.join(process.env.HOME || process.env.USERPROFILE || "~", ".coderag.json"),
    // Installation directory (where this file is)
    path.join(__dirname, "..", ".coderag.json"),
  ];

  for (const location of locations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  return null;
}

function loadConfig(): Config {
  const configPath = findConfigPath();

  if (!configPath) {
    throw new Error(
      ".coderag.json not found. Please create a configuration file in one of these locations:\n" +
      "  1. Current directory: .coderag.json\n" +
      "  2. Home directory: ~/.coderag.json\n" +
      "  3. Installation directory: code-rag/.coderag.json"
    );
  }

  let rawConfig: Config;
  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    rawConfig = JSON.parse(configContent) as Config;
  } catch (err) {
    throw new Error(
      `Failed to parse ${configPath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Validate required fields
  if (!rawConfig.answerModel) {
    throw new Error(
      `Missing required field 'answerModel' in ${configPath}`
    );
  }

  if (!rawConfig.models || typeof rawConfig.models !== "object") {
    throw new Error(
      `Missing or invalid 'models' configuration in ${configPath}`
    );
  }

  // Resolve API keys from environment variables
  const resolvedConfig: Config = {
    reranker: rawConfig.reranker,
    answerModel: rawConfig.answerModel,
    models: {},
  };

  for (const [modelName, modelConfig] of Object.entries(rawConfig.models)) {
    if (!modelConfig.apiKey || !modelConfig.model) {
      throw new Error(
        `Invalid configuration for model '${modelName}': missing apiKey or model field in ${configPath}`
      );
    }

    const apiKeyEnvVar = modelConfig.apiKey;
    const apiKey = process.env[apiKeyEnvVar];

    if (!apiKey) {
      console.warn(
        `Warning: API key for ${modelName} not found in environment variable ${apiKeyEnvVar}`
      );
    }

    resolvedConfig.models[modelName] = {
      apiKey: apiKey || "",
      model: modelConfig.model,
    };
  }

  return resolvedConfig;
}

export const config = loadConfig();
