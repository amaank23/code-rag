import { LLMPlugin } from "./base";

export const claude: LLMPlugin = {
  name: "claude",

  async rerank({ query, chunks, topK }) {
    // prompt Claude to return ranked IDs
    return ["chunk-2", "chunk-5"];
  },

  async answer({ query, context }) {
    return "Claude-generated explanation...";
  },
};
