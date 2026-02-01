import { minimatch } from "minimatch";

export const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/*.lock",
  "**/*.log",
];

export function shouldIgnore(path: string): boolean {
  // Normalize path separators to forward slashes for consistent matching
  const normalizedPath = path.replace(/\\/g, "/");

  return DEFAULT_IGNORES.some((pattern) => {
    // Check if the pattern matches the full path
    if (minimatch(normalizedPath, pattern)) {
      return true;
    }

    // Also check if any part of the path matches directory patterns
    // This handles cases like "node_modules" appearing anywhere in the path
    const pathParts = normalizedPath.split("/");
    return pathParts.some((part) => {
      const simplePattern = pattern.replace(/\*\*/g, "").replace(/\//g, "");
      return simplePattern && part === simplePattern;
    });
  });
}
