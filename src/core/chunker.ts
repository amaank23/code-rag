import ts from "typescript";
import { ScannedFile } from "./scanner";

export interface CodeChunk {
  content: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  symbol?: string;
}

export function chunkTypeScriptFile(file: ScannedFile): CodeChunk[] {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
  );

  const chunks: CodeChunk[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isClassDeclaration(node)
    ) {
      const start =
        sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

      const end =
        sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;

      const content = file.content.slice(node.getStart(), node.getEnd());

      let symbol: string | undefined;

      if ("name" in node && node.name && ts.isIdentifier(node.name)) {
        symbol = node.name.text;
      }

      chunks.push({
        content,
        filePath: file.path,
        language: file.language,
        startLine: start,
        endLine: end,
        symbol,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return chunks;
}

export function fallbackChunk(file: ScannedFile, maxLines = 50): CodeChunk[] {
  const lines = file.content.split("\n");
  const chunks: CodeChunk[] = [];

  for (let i = 0; i < lines.length; i += maxLines) {
    const slice = lines.slice(i, i + maxLines);

    chunks.push({
      content: slice.join("\n"),
      filePath: file.path,
      language: file.language,
      startLine: i + 1,
      endLine: i + slice.length,
    });
  }

  return chunks;
}

export function chunkFile(file: ScannedFile): CodeChunk[] {
  if (file.language === "typescript" || file.language === "javascript") {
    const astChunks = chunkTypeScriptFile(file);
    if (astChunks.length > 0) return astChunks;
  }

  return fallbackChunk(file);
}
