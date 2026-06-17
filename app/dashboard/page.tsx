import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortfolio, getTxHistory } from '@/lib/redis';
import { getPrices } from '@/lib/prices';
import { DashboardClient } from './dashboard-client';
import { TOKENS } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uid = (session!.user as { id?: string }).id!;

  const [portfolio, history, prices] = await Promise.all([
    getPortfolio(uid),
    getTxHistory(uid),
    getPrices(),
  ]);

  const totalUsd = Object.entries(portfolio).reduce(
    (sum, [sym, amt]) => sum + amt * (prices[sym] ?? 1),
    0
  );

  return (
    <DashboardClient
      user={{ name: session!.user!.name!, email: session!.user!.email!, image: session!.user!.image ?? '' }}
      portfolio={portfolio}
      history={history}
      prices={prices}
      totalUsd={totalUsd}
      tokens={TOKENS}
    />
  );
}
