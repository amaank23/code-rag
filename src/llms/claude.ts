import Anthropic from "@anthropic-ai/sdk";
import { LLMPlugin } from "./base";
import { config } from "../config";

export const claude: LLMPlugin = {
  name: "claude",

  async rerank({ query, chunks, topK }) {
    const modelConfig = config.models.claude;
    if (!modelConfig?.apiKey) {
      throw new Error(
        "Claude API key not configured. Please set ANTHROPIC_API_KEY in your .env file."
      );
    }

    const client = new Anthropic({ apiKey: modelConfig.apiKey });

    // Build prompt with chunks
    const chunksText = chunks
      .map((chunk) => `[${chunk.id}]\n${chunk.content}`)
      .join("\n\n");

    const prompt = `Given the following code chunks and a user query, rank the chunks by relevance to the query. Return ONLY a JSON array of chunk IDs in order of relevance (most relevant first), limited to the top ${topK} chunks.

Query: ${query}

Code Chunks:
${chunksText}

Return format: ["id1", "id2", "id3", ...]`;

    const message = await client.messages.create({
      model: modelConfig.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    try {
      const rankedIds = JSON.parse(responseText.trim());
      return rankedIds.slice(0, topK);
    } catch (error) {
      console.error("Failed to parse Claude rerank response:", responseText);
      // Fallback: return first topK chunk IDs
      return chunks.slice(0, topK).map((c) => c.id);
    }
  },

  async answer({ query, context }) {
    const modelConfig = config.models.claude;
    if (!modelConfig?.apiKey) {
      throw new Error(
        "Claude API key not configured. Please set ANTHROPIC_API_KEY in your .env file."
      );
    }

    const client = new Anthropic({ apiKey: modelConfig.apiKey });

    const prompt = `You are a helpful coding assistant. Answer the user's question about their codebase using the provided context.

Context (relevant code snippets):
${context}

User Question: ${query}

Please provide a clear, concise answer based on the code context above.`;

    const message = await client.messages.create({
      model: modelConfig.model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  },
};
