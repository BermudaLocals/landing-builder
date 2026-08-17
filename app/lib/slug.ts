import { randomBytes } from 'crypto';

// "My First Site!" -> "my-first-site"
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
  return slug || 'site';
}

function randomSuffix(length = 6): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// Collision-safe: every candidate carries a random suffix and is checked
// against the database via the injected `exists` lookup.
export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
  maxAttempts = 5
): Promise<string> {
  const base = slugify(title);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
  }
  throw new Error('Could not allocate a unique slug');
}
