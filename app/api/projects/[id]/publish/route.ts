import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/apiResponse';
import { rateLimit } from '@/lib/rateLimit';
import { validateComponents } from '@/lib/validation';
import { generateStaticHTML } from '@/lib/renderStatic';

interface RouteContext {
  params: { id: string };
}

// 10 publishes per minute per user. Single-replica in-memory limiter,
// see app/lib/rateLimit.ts for the scaling caveat.
const PUBLISH_RATE_LIMIT = 10;
const PUBLISH_RATE_WINDOW_MS = 60_000;

// POST /api/projects/[id]/publish — snapshot the project's current components
// to a public page at /p/[slug]. Idempotent: republishing refreshes the
// snapshot and timestamp while keeping the same slug/URL.
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, 'Unauthorized');
    }

    const { allowed, retryAfterSeconds } = rateLimit(
      `publish:${user.id}`,
      PUBLISH_RATE_LIMIT,
      PUBLISH_RATE_WINDOW_MS
    );
    if (!allowed) {
      return apiError(429, `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`);
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!project) {
      return apiError(404, 'Project not found');
    }

    // Data comes back from the DB as untyped JSON — validate before trusting.
    const validation = validateComponents(project.components);
    if (!validation.ok) {
      return apiError(422, `Stored components are invalid: ${validation.error}`);
    }

    const publishedHtml = generateStaticHTML(validation.components, project.title);
    const publishedAt = new Date();
    const publishedUrl = `/p/${project.slug}`;

    await prisma.project.updateMany({
      where: { id: project.id, userId: user.id },
      data: {
        published: true,
        publishedUrl,
        publishedAt,
        publishedHtml,
      },
    });

    return apiOk({ url: publishedUrl, slug: project.slug, publishedAt });
  } catch (error) {
    console.error('Publish error:', error);
    return apiError(500, 'Failed to publish');
  }
}
