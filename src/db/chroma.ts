import { ChromaClient } from "chromadb";
import * as crypto from "crypto";
import * as path from "path";

export const chroma = new ChromaClient({
  host: "localhost",
  port: 8000,
  ssl: false,
});

/**
 * Generate a unique collection name for a project path
 * Format: code-rag-<hash>-<sanitized-name>
 */
function generateCollectionName(projectPath: string): string {
  // Get the base name of the project (last directory in path)
  const baseName = path.basename(projectPath);

  // Create a short hash of the full path for uniqueness
  const hash = crypto
    .createHash("md5")
    .update(projectPath)
    .digest("hex")
    .substring(0, 8);

  // Sanitize base name: only alphanumeric, hyphens, underscores
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Chroma collection names must be 3-63 characters, alphanumeric + hyphens/underscores
  const collectionName = `code-rag-${hash}-${sanitized}`.substring(0, 63);

  return collectionName;
}

export async function getCollection(projectPath: string) {
  const collectionName = generateCollectionName(projectPath);

  return await chroma.getOrCreateCollection({
    name: collectionName,
    metadata: {
      description: "Codebase embeddings",
      projectPath,
      createdAt: new Date().toISOString(),
    },
    embeddingFunction: null,
  });
}

/**
 * List all code-rag collections
 */
export async function listCollections() {
  const collections = await chroma.listCollections();
  return collections.filter((c) => c.name.startsWith("code-rag-"));
}

/**
 * Delete a collection for a specific project
 */
export async function deleteCollection(projectPath: string) {
  const collectionName = generateCollectionName(projectPath);
  await chroma.deleteCollection({ name: collectionName });
}
