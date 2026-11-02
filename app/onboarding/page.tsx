import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfile } from '@/lib/redis';
import { redirect } from 'next/navigation';
import { OnboardingClient } from './onboarding-client';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/');

  const uid = (session.user as { id?: string }).id!;
  const profile = await getProfile(uid);
  if (profile?.setupDone) redirect('/dashboard');

  return <OnboardingClient name={session.user.name ?? ''} />;
}
