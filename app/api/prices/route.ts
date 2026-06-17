import { NextResponse } from 'next/server';
import { getPrices } from '@/lib/prices';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prices = await getPrices();
    return NextResponse.json({ prices });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
