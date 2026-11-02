import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfile, setProfile, getChallengeStart, setChallengeStart } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as { id?: string }).id!;
  const profile = await getProfile(uid);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as { id?: string }).id!;

  const { username, avatarId } = await req.json();
  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
  }
  if (typeof avatarId !== 'number' || avatarId < 0 || avatarId > 11) {
    return NextResponse.json({ error: 'Invalid avatar selection' }, { status: 400 });
  }

  await setProfile(uid, { username: username.trim(), avatarId, setupDone: true });

  // Start the 60-day challenge clock on first profile setup
  const existing = await getChallengeStart(uid);
  if (!existing) await setChallengeStart(uid, Date.now());

  return NextResponse.json({ success: true });
}
