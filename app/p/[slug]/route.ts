import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { slug: string };
}

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Not found</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 4rem;">
  <h1>Page not found</h1>
  <p>This page is not published or does not exist.</p>
</body>
</html>`;

// GET /p/[slug] — public, no authentication (whitelisted in middleware).
// Serves the sanitized HTML snapshot produced at publish time; content was
// escaped when generated, so it is safe to serve as a complete document.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const project = await prisma.project.findFirst({
      where: { slug: params.slug, published: true },
      select: { publishedHtml: true },
    });

    if (!project?.publishedHtml) {
      return new NextResponse(NOT_FOUND_HTML, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new NextResponse(project.publishedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Public page error:', error);
    return new NextResponse(NOT_FOUND_HTML, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
