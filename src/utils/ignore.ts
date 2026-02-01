export const DEFAULT_IGNORES = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  "coverage",
  "*.lock",
  "*.log",
];

export function shouldIgnore(path: string): boolean {
  return DEFAULT_IGNORES.some((rule) => path.includes(rule.replace("*", "")));
}
