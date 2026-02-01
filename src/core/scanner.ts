import fs from "fs/promises";
import path from "path";
import { shouldIgnore } from "../utils/ignore";
import { detectLanguage } from "../utils/language";

export interface ScannedFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export async function scanRepository(root: string): Promise<ScannedFile[]> {
  const results: ScannedFile[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(root, fullPath);

      if (shouldIgnore(relativePath)) continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const language = detectLanguage(entry.name);
      if (!language) continue;

      const stat = await fs.stat(fullPath);
      if (stat.size > 500_000) continue; // skip huge files

      const content = await fs.readFile(fullPath, "utf-8");

      results.push({
        path: relativePath,
        content,
        language,
        size: stat.size,
      });
    }
  }

  await walk(root);
  return results;
}
