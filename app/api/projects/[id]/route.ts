import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/apiResponse';
import { validateComponents, validateTitle } from '@/lib/validation';

interface RouteContext {
  params: { id: string };
}

// GET /api/projects/[id] — read one project, ownership enforced.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, 'Unauthorized');
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!project) {
      return apiError(404, 'Project not found');
    }

    return apiOk({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return apiError(500, 'Failed to load project');
  }
}

// PUT /api/projects/[id] — update title and/or components, ownership enforced.
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    const data: { title?: string; components?: object[] } = {};

    if (body.title !== undefined) {
      const titleCheck = validateTitle(body.title);
      if (!titleCheck.ok) {
        return apiError(400, titleCheck.error);
      }
      data.title = titleCheck.title;
    }

    if (body.components !== undefined) {
      const componentsCheck = validateComponents(body.components);
      if (!componentsCheck.ok) {
        return apiError(400, componentsCheck.error);
      }
      data.components = componentsCheck.components;
    }

    if (Object.keys(data).length === 0) {
      return apiError(400, 'Nothing to update');
    }

    // Scoped update: a row owned by someone else is indistinguishable from
    // a missing one.
    const { count } = await prisma.project.updateMany({
      where: { id: params.id, userId: user.id },
      data,
    });
    if (count === 0) {
      return apiError(404, 'Project not found');
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: user.id },
    });

    return apiOk({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return apiError(500, 'Failed to update project');
  }
}

// DELETE /api/projects/[id] — ownership enforced.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, 'Unauthorized');
    }

    const { count } = await prisma.project.deleteMany({
      where: { id: params.id, userId: user.id },
    });
    if (count === 0) {
      return apiError(404, 'Project not found');
    }

    return apiOk({ deleted: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return apiError(500, 'Failed to delete project');
  }
}
