import { describe, it, expect } from 'vitest';
import { slugify, generateUniqueSlug } from '@/lib/slug';

describe('slugify', () => {
  it('normalizes titles into URL-safe slugs', () => {
    expect(slugify('My First Site!')).toBe('my-first-site');
    expect(slugify('  Spaces   Everywhere  ')).toBe('spaces-everywhere');
    expect(slugify('Café Über')).toBe('caf-ber');
  });

  it('falls back to "site" for unusable titles', () => {
    expect(slugify('!!!')).toBe('site');
    expect(slugify('')).toBe('site');
  });

  it('caps length', () => {
    expect(slugify('x'.repeat(100)).length).toBeLessThanOrEqual(40);
  });
});

describe('generateUniqueSlug', () => {
  it('returns a slugified base with a random suffix', async () => {
    const slug = await generateUniqueSlug('My Page', async () => false);
    expect(slug).toMatch(/^my-page-[0-9a-f]{6}$/);
  });

  it('retries until the candidate is free', async () => {
    let attempts = 0;
    const slug = await generateUniqueSlug('Page', async () => {
      attempts += 1;
      return attempts < 3; // first two collide
    });
    expect(attempts).toBe(3);
    expect(slug).toMatch(/^page-[0-9a-f]{6}$/);
  });

  it('gives up after exhausting attempts', async () => {
    await expect(generateUniqueSlug('Page', async () => true, 3)).rejects.toThrow();
  });

  it('produces different slugs for repeated titles', async () => {
    const a = await generateUniqueSlug('Same', async () => false);
    const b = await generateUniqueSlug('Same', async () => false);
    expect(a).not.toBe(b);
  });
});
