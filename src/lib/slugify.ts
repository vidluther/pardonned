/**
 * Convert a name to a URL-friendly slug
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Collapse multiple hyphens
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except underscores and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Collapse multiple hyphens
}
