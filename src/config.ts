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

function loadConfig(): Config {
  const configPath = path.join(process.cwd(), ".coderag.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      ".coderag.json not found. Please create a configuration file in your project root."
    );
  }

  let rawConfig: Config;
  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    rawConfig = JSON.parse(configContent) as Config;
  } catch (err) {
    throw new Error(
      `Failed to parse .coderag.json: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Validate required fields
  if (!rawConfig.answerModel) {
    throw new Error(
      "Missing required field 'answerModel' in .coderag.json"
    );
  }

  if (!rawConfig.models || typeof rawConfig.models !== "object") {
    throw new Error(
      "Missing or invalid 'models' configuration in .coderag.json"
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
        `Invalid configuration for model '${modelName}': missing apiKey or model field`
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
