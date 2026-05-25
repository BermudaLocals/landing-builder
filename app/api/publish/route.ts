import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { components } = await request.json();
    
    // Generate static HTML
    const html = generateStaticHTML(components);
    const css = generateStaticCSS(components);
    
    // In a real app, you would:
    // 1. Upload to Vercel/Netlify
    // 2. Deploy to GitHub Pages
    // 3. Save to S3/Cloudflare
    
    // For demo, return a mock URL
    const slug = `landing-${Date.now()}`;
    const url = `https://${slug}.launchpad-demo.com`;
    
    return NextResponse.json({ 
      success: true, 
      url,
      html,
      css,
      slug
    });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }
}

function generateStaticHTML(components: any[]) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LaunchPad Landing Page</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    ${generateStaticCSS(components)}
  </style>
</head>
<body class="font-sans">
  ${components.map(comp => renderComponentHTML(comp)).join('\n')}
  <footer class="text-center py-8 text-gray-500 text-sm">
    Built with LaunchPad • Better than landingsite.ai
  </footer>
</body>
</html>`;
}

function renderComponentHTML(component: any) {
  const styles = component.styles || {};
  const styleString = Object.entries(styles)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
  
  switch (component.type) {
    case 'header':
      return `<header style="${styleString}" class="px-4 py-4">
        <div class="container mx-auto flex justify-between items-center">
          <div class="text-2xl font-bold">${component.props.title || 'LaunchPad'}</div>
          <nav class="space-x-6">
            ${(component.props.navItems || []).map((item: string) => `<a href="#" class="hover:text-blue-600">${item}</a>`).join('')}
          </nav>
        </div>
      </header>`;
    
    case 'hero':
      return `<section style="${styleString}" class="py-20 text-center">
        <div class="container mx-auto">
          <h1 class="text-5xl font-bold mb-6">${component.props.title || 'Welcome'}</h1>
          <p class="text-xl mb-10 opacity-90">${component.props.subtitle || 'Build amazing landing pages'}</p>
          <a href="${component.props.ctaLink || '#'}" class="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition">
            ${component.props.ctaText || 'Get Started'}
          </a>
        </div>
      </section>`;
    
    default:
      return `<div style="${styleString}" class="p-8">
        <div class="container mx-auto">
          <h2 class="text-2xl font-bold mb-4">${component.type.toUpperCase()} Component</h2>
          <p>Created with LaunchPad Builder</p>
        </div>
      </div>`;
  }
}

function generateStaticCSS(components: any[]) {
  return `/* LaunchPad Generated CSS */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
@media (max-width: 768px) { .container { padding: 0 0.5rem; } }`;
}
