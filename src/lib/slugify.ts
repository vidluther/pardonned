import { createHash } from "node:crypto";
import { PARDON_SLUG_OVERRIDES } from "./pardon-slug-overrides";

export const MAX_SLUG_LENGTH = 60;

/**
 * Convert a name to a URL-friendly slug.
 *
 * **Pass `name` unmodified.** The override lookup in step 1 is byte-exact —
 * pre-normalizing the input (String.prototype.normalize, NBSP→space, trim,
 * etc.) will silently miss override entries and fall through to the hashed
 * fallback.
 *
 * Resolution order:
 * 1. If `name` has an entry in PARDON_SLUG_OVERRIDES, return that override.
 * 2. Apply the normalization rules: lowercase, strip non-word characters,
 *    replace whitespace with hyphens, collapse repeated hyphens.
 * 3. If normalization produced an empty string, throw — an empty slug would
 *    collide with the index route and silently break the build.
 * 4. If the normalized slug is at or below MAX_SLUG_LENGTH, return it.
 * 5. Otherwise truncate to MAX_SLUG_LENGTH - 9 characters (one hyphen plus
 *    an 8-char sha1 prefix) and append the hash for collision resistance.
 */
export function slugify(name: string): string {
  const override = PARDON_SLUG_OVERRIDES[name];
  if (override) {
    return override;
  }

  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (normalized.length === 0) {
    throw new Error(
      `slugify: input produced an empty slug after normalization: ${JSON.stringify(name)}`,
    );
  }

  if (normalized.length <= MAX_SLUG_LENGTH) {
    return normalized;
  }

  const hash = createHash("sha1").update(name).digest("hex").slice(0, 8);
  // Budget: 1 hyphen + 8 hash chars = 9 chars reserved for the suffix.
  const truncated = normalized.slice(0, MAX_SLUG_LENGTH - 9).replace(/-+$/, "");
  return `${truncated}-${hash}`;
}
