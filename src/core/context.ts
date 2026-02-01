import { RetrievedChunk } from "./retriever";

export function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, idx) => {
      const m = chunk.metadata;
      return `
[${idx + 1}] ${m.filePath}:${m.startLine}-${m.endLine}
${chunk.content}
`;
    })
    .join("\n---\n");
}
