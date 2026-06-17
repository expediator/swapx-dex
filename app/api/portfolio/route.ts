import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortfolio, getTxHistory } from '@/lib/redis';
import { getPrices } from '@/lib/prices';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as { id?: string }).id!;

  const [portfolio, history, prices] = await Promise.all([
    getPortfolio(uid),
    getTxHistory(uid),
    getPrices(),
  ]);

  const totalUsd = Object.entries(portfolio).reduce((sum, [sym, amt]) => {
    return sum + amt * (prices[sym] ?? 1);
  }, 0);

  return NextResponse.json({ portfolio, history, prices, totalUsd });
}
