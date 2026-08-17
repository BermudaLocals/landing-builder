import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/apiResponse';
import { validateComponents, validateTitle } from '@/lib/validation';
import { generateUniqueSlug } from '@/lib/slug';

const SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  published: true,
  publishedUrl: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/projects — list the current user's projects.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, 'Unauthorized');
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      select: SUMMARY_SELECT,
      orderBy: { updatedAt: 'desc' },
    });

    return apiOk({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return apiError(500, 'Failed to list projects');
  }
}

// POST /api/projects — create a project owned by the current user.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, 'Unauthorized');
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError(400, 'Request body must be valid JSON');
    }

    let title = 'Untitled Project';
    if (body.title !== undefined) {
      const titleCheck = validateTitle(body.title);
      if (!titleCheck.ok) {
        return apiError(400, titleCheck.error);
      }
      title = titleCheck.title;
    }

    let components: unknown = [];
    if (body.components !== undefined) {
      const componentsCheck = validateComponents(body.components);
      if (!componentsCheck.ok) {
        return apiError(400, componentsCheck.error);
      }
      components = componentsCheck.components;
    }

    const slug = await generateUniqueSlug(title, async (candidate) => {
      const existing = await prisma.project.findUnique({ where: { slug: candidate } });
      return existing !== null;
    });

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title,
        slug,
        components: components as object[],
      },
      select: SUMMARY_SELECT,
    });

    return apiOk({ project }, 201);
  } catch (error) {
    console.error('Create project error:', error);
    return apiError(500, 'Failed to create project');
  }
}
