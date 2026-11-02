import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortfolio, getTxHistory, getProfile, getSnapshots, getChallengeStart } from '@/lib/redis';
import { getPrices } from '@/lib/prices';
import { DashboardClient } from './dashboard-client';
import { TOKENS } from '@/lib/tokens';
import { redirect } from 'next/navigation';
import { CHALLENGE_TARGET, CHALLENGE_MAX_LOSS, CHALLENGE_INITIAL, CHALLENGE_DAYS } from '@/lib/challenge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uid = (session!.user as { id?: string }).id!;

  const [portfolio, history, prices, profile, snapshots, challengeStart] = await Promise.all([
    getPortfolio(uid),
    getTxHistory(uid),
    getPrices(),
    getProfile(uid),
    getSnapshots(uid),
    getChallengeStart(uid),
  ]);

  if (!profile?.setupDone) redirect('/onboarding');

  const totalUsd = Object.entries(portfolio).reduce(
    (sum, [sym, amt]) => sum + amt * (prices[sym] ?? 1),
    0
  );

  const challengeDeadline = challengeStart
    ? challengeStart + CHALLENGE_DAYS * 24 * 60 * 60 * 1000
    : null;

  const daysLeft = challengeDeadline
    ? Math.max(0, Math.ceil((challengeDeadline - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <DashboardClient
      user={{ name: session!.user!.name!, email: session!.user!.email!, image: session!.user!.image ?? '' }}
      profile={profile}
      portfolio={portfolio}
      history={history}
      prices={prices}
      totalUsd={totalUsd}
      tokens={TOKENS}
      snapshots={snapshots}
      challengeStart={challengeStart}
      challengeDeadline={challengeDeadline}
      daysLeft={daysLeft}
      challengeTarget={CHALLENGE_TARGET}
      challengeMaxLoss={CHALLENGE_MAX_LOSS}
      challengeInitial={CHALLENGE_INITIAL}
    />
  );
}
