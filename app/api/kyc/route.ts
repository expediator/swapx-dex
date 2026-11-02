import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as { id?: string }).id!;

  const raw = await redis.get(`user:${uid}:kyc`);
  if (!raw) return NextResponse.json({ status: null });
  const data = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
  return NextResponse.json({ status: data.status, submittedAt: data.submittedAt });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as { id?: string }).id!;

  const { fullName, phone, idType } = await req.json();
  if (!fullName?.trim() || !phone?.trim() || !idType) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  await redis.set(`user:${uid}:kyc`, JSON.stringify({
    fullName: fullName.trim(),
    phone:    phone.trim(),
    idType,
    email:    session.user.email,
    submittedAt: Date.now(),
    status: 'pending',
  }));

  return NextResponse.json({ success: true });
}
