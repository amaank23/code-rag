import { LLMPlugin } from "./base";
import { claude } from "./claude";
import { gemini } from "./gemini";

const plugins: Record<string, LLMPlugin> = {
  claude,
  gemini,
};

export function getLLM(name: string): LLMPlugin {
  const plugin = plugins[name];
  if (!plugin) {
    throw new Error(`LLM plugin "${name}" not found`);
  }
  return plugin;
}
