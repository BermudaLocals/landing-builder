import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

// Resolve the Clerk session to the app's User row, provisioning it on first
// sight. Never accept a user id from the client — this is the only source.
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (!email) return null;

  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || null;

  return prisma.user.create({
    data: { clerkId, email, name },
  });
}
