import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSnapshots, getChallengeStart } from '@/lib/redis';
import { CHALLENGE_TARGET, CHALLENGE_MAX_LOSS, CHALLENGE_INITIAL, CHALLENGE_DAYS } from '@/lib/challenge';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as { id?: string }).id!;

  const [snapshots, challengeStart] = await Promise.all([
    getSnapshots(uid),
    getChallengeStart(uid),
  ]);

  const challengeDeadline = challengeStart
    ? challengeStart + CHALLENGE_DAYS * 24 * 60 * 60 * 1000
    : null;

  const daysLeft = challengeDeadline
    ? Math.max(0, Math.ceil((challengeDeadline - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return NextResponse.json({
    snapshots,
    challengeStart,
    challengeDeadline,
    daysLeft,
    initial: CHALLENGE_INITIAL,
    target: CHALLENGE_TARGET,
    maxLoss: CHALLENGE_MAX_LOSS,
  });
}
