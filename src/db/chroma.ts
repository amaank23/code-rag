import { ChromaClient } from "chromadb";

export const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

export async function getCollection() {
  return await chroma.getOrCreateCollection({
    name: "code-rag",
    metadata: { description: "Codebase embeddings" },
    embeddingFunction: null,
  });
}
