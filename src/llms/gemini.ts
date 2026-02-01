import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMPlugin } from "./base";
import { config } from "../config";

export const gemini: LLMPlugin = {
  name: "gemini",

  async rerank({ query, chunks, topK }) {
    const modelConfig = config.models.gemini;
    if (!modelConfig?.apiKey) {
      throw new Error(
        "Gemini API key not configured. Please set GEMINI_API_KEY in your .env file."
      );
    }

    const genAI = new GoogleGenerativeAI(modelConfig.apiKey);
    const model = genAI.getGenerativeModel({ model: modelConfig.model });

    // Build prompt with chunks
    const chunksText = chunks
      .map((chunk) => `[${chunk.id}]\n${chunk.content}`)
      .join("\n\n");

    const prompt = `Given the following code chunks and a user query, rank the chunks by relevance to the query. Return ONLY a JSON array of chunk IDs in order of relevance (most relevant first), limited to the top ${topK} chunks.

Query: ${query}

Code Chunks:
${chunksText}

Return format: ["id1", "id2", "id3", ...]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    try {
      const rankedIds = JSON.parse(responseText.trim());
      return rankedIds.slice(0, topK);
    } catch (error) {
      console.error("Failed to parse Gemini rerank response:", responseText);
      // Fallback: return first topK chunk IDs
      return chunks.slice(0, topK).map((c) => c.id);
    }
  },

  async answer({ query, context }) {
    const modelConfig = config.models.gemini;
    if (!modelConfig?.apiKey) {
      throw new Error(
        "Gemini API key not configured. Please set GEMINI_API_KEY in your .env file."
      );
    }

    const genAI = new GoogleGenerativeAI(modelConfig.apiKey);
    const model = genAI.getGenerativeModel({ model: modelConfig.model });

    const prompt = `You are a helpful coding assistant. Answer the user's question about their codebase using the provided context.

Context (relevant code snippets):
${context}

User Question: ${query}

Please provide a clear, concise answer based on the code context above.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },
};
