// Escape user-controlled text before interpolating it into generated HTML.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only allow safe URL schemes in generated links; anything else becomes '#'.
export function safeUrl(value: unknown): string {
  const url = String(value ?? '').trim();
  if (url === '') return '#';
  if (url.startsWith('#') || url.startsWith('/')) return escapeHtml(url);
  if (/^https:\/\//i.test(url) || /^http:\/\//i.test(url) || /^mailto:/i.test(url)) {
    return escapeHtml(url);
  }
  return '#';
}

// Strip characters that could break out of an inline style attribute.
export function escapeStyle(value: unknown): string {
  return String(value ?? '').replace(/[<>"']/g, '');
}
