import { CodeChunk } from "./chunker";
import { embedText } from "./embeddings";
import { getCollection } from "../db/chroma";

export async function indexChunks(chunks: CodeChunk[]) {
  const collection = await getCollection();

  for (const chunk of chunks) {
    const id = `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`;

    const embedding = await embedText(chunk.content);

    await collection.upsert({
      ids: [id],
      embeddings: [embedding],
      documents: [chunk.content],
      metadatas: [
        {
          filePath: chunk.filePath,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          language: chunk.language,
          symbol: chunk.symbol ?? null,
        },
      ],
    });
  }
}
