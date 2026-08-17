import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      publishedUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <Dashboard
      projects={projects.map((project) => ({
        ...project,
        publishedAt: project.publishedAt ? project.publishedAt.toISOString() : null,
        updatedAt: project.updatedAt.toISOString(),
      }))}
    />
  );
}
