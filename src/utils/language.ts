export function detectLanguage(file: string): string | null {
  if (file.endsWith(".ts") || file.endsWith(".tsx")) return "typescript";
  if (file.endsWith(".js") || file.endsWith(".jsx")) return "javascript";
  if (file.endsWith(".py")) return "python";
  if (file.endsWith(".rs")) return "rust";
  if (file.endsWith(".go")) return "go";
  if (file.endsWith(".java")) return "java";
  return null;
}
