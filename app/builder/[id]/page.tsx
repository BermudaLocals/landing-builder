import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateComponents } from '@/lib/validation';
import LandingPageBuilder, { Component } from '@/components/LandingPageBuilder';

interface BuilderPageProps {
  params: { id: string };
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!project) {
    notFound();
  }

  // Stored JSON is untrusted input — revalidate before handing it to the UI.
  const parsed = validateComponents(project.components);
  const initialComponents = (parsed.ok ? parsed.components : []) as Component[];

  return (
    <LandingPageBuilder
      projectId={project.id}
      projectTitle={project.title}
      initialComponents={initialComponents}
    />
  );
}
