import { ValidatedComponent } from './validation';
import { escapeHtml, escapeStyle, safeUrl } from './escape';

// Shared static renderer used by /api/publish (code export) and by the
// publishing snapshot served at /p/[slug]. All user-controlled values are
// escaped here — the output is safe to serve as-is.
export function generateStaticCSS(): string {
  return `/* LaunchPad Generated CSS */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
@media (max-width: 768px) { .container { padding: 0 0.5rem; } }`;
}

function styleString(styles: Record<string, unknown>): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      const safeKey = key
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/[^a-z-]/g, '');
      if (!safeKey) return '';
      return `${safeKey}: ${escapeStyle(value)}`;
    })
    .filter(Boolean)
    .join('; ');
}

function renderComponentHTML(component: ValidatedComponent): string {
  const styles = styleString(component.styles || {});
  const props = component.props || {};

  switch (component.type) {
    case 'header': {
      const navItems = Array.isArray(props.navItems) ? props.navItems : [];
      return `<header style="${styles}" class="px-4 py-4">
        <div class="container mx-auto flex justify-between items-center">
          <div class="text-2xl font-bold">${escapeHtml(props.title || 'LaunchPad')}</div>
          <nav class="space-x-6">
            ${navItems.map((item: unknown) => `<a href="#" class="hover:text-blue-600">${escapeHtml(item)}</a>`).join('')}
          </nav>
        </div>
      </header>`;
    }

    case 'hero':
      return `<section style="${styles}" class="py-20 text-center">
        <div class="container mx-auto">
          <h1 class="text-5xl font-bold mb-6">${escapeHtml(props.title || 'Welcome')}</h1>
          <p class="text-xl mb-10 opacity-90">${escapeHtml(props.subtitle || 'Build amazing landing pages')}</p>
          <a href="${safeUrl(props.ctaLink)}" class="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition">
            ${escapeHtml(props.ctaText || 'Get Started')}
          </a>
        </div>
      </section>`;

    default:
      return `<div style="${styles}" class="p-8">
        <div class="container mx-auto">
          <h2 class="text-2xl font-bold mb-4">${escapeHtml(component.type.toUpperCase())} Component</h2>
          <p>Created with LaunchPad Builder</p>
        </div>
      </div>`;
  }
}

export function generateStaticHTML(components: ValidatedComponent[], title = 'LaunchPad Landing Page'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    ${generateStaticCSS()}
  </style>
</head>
<body class="font-sans">
  ${components.map((comp) => renderComponentHTML(comp)).join('\n')}
  <footer class="text-center py-8 text-gray-500 text-sm">
    Built with LaunchPad • Better than landingsite.ai
  </footer>
</body>
</html>`;
}
