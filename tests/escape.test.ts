import { describe, it, expect } from 'vitest';
import { escapeHtml, safeUrl, escapeStyle } from '@/lib/escape';

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("a & b's")).toBe('a &amp; b&#39;s');
  });

  it('handles nullish and non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('safeUrl', () => {
  it('allows http(s), mailto, hash, and relative URLs', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com');
    expect(safeUrl('http://example.com')).toBe('http://example.com');
    expect(safeUrl('mailto:a@b.c')).toBe('mailto:a@b.c');
    expect(safeUrl('#pricing')).toBe('#pricing');
    expect(safeUrl('/docs')).toBe('/docs');
  });

  it('neutralizes javascript: and other unsafe schemes', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBe('#');
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('defaults empty input to #', () => {
    expect(safeUrl('')).toBe('#');
    expect(safeUrl(null)).toBe('#');
  });
});

describe('escapeStyle', () => {
  it('strips characters that could break out of a style context', () => {
    expect(escapeStyle('red;"><script>')).toBe('red;script');
    expect(escapeStyle("url('x')")).toBe('url(x)');
  });
});
