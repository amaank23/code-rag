import { LLMPlugin } from "./base";

export const gemini: LLMPlugin = {
  name: "gemini",

  async answer({ query, context }) {
    return "Gemini-generated explanation...";
  },
};
