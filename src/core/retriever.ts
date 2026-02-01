import { getCollection } from "../db/chroma";
import { embedText } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string | null;
  metadata: any;
  distance?: number | null;
}

export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const collection = await getCollection();

  const queryEmbedding = await embedText(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const chunks: RetrievedChunk[] = [];

  for (let i = 0; i < (results.ids?.[0]?.length ?? 0); i++) {
    chunks.push({
      id: results.ids![0][i],
      content: results.documents![0][i],
      metadata: results.metadatas![0][i],
      distance: results.distances?.[0]?.[i],
    });
  }

  return chunks;
}
