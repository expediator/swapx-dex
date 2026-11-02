import { Redis } from '@upstash/redis';

// Lazy singleton — throws at call time (not import time) if env vars missing
let _redis: Redis | null = null;
function getClient(): Redis {
  if (!_redis) {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL / TOKEN not set');
    _redis = new Redis({ url, token });
  }
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop: string) {
    return (...args: unknown[]) => (getClient() as unknown as Record<string, (...a: unknown[]) => unknown>)[prop](...args);
  },
});

// ── Key helpers ───────────────────────────────────────────────────
export const keys = {
  portfolio:      (uid: string) => `user:${uid}:portfolio`,
  orders:         (uid: string) => `user:${uid}:orders`,
  swaps:          (uid: string) => `user:${uid}:swaps`,
  profile:        (uid: string) => `user:${uid}:profile`,
  snapshots:      (uid: string) => `user:${uid}:snapshots`,
  challengeStart: (uid: string) => `user:${uid}:challengeStart`,
  priceCache:     () => 'prices:cache',
  priceTs:        () => 'prices:ts',
};

// ── Portfolio helpers ─────────────────────────────────────────────
export async function getPortfolio(uid: string): Promise<Record<string, number>> {
  const raw = await redis.hgetall(keys.portfolio(uid));
  if (!raw || Object.keys(raw).length === 0) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, parseFloat(v as string)])
  );
}

export async function setBalance(uid: string, symbol: string, amount: number) {
  if (amount < 0) amount = 0;
  if (amount === 0) {
    await redis.hdel(keys.portfolio(uid), symbol);
  } else {
    await redis.hset(keys.portfolio(uid), { [symbol]: amount.toString() });
  }
}

// ── Transaction log helpers ────────────────────────────────────────
export interface TxRecord {
  id:        string;
  type:      'swap' | 'buy' | 'sell';
  fromSym:   string;
  toSym:     string;
  fromAmt:   number;
  toAmt:     number;
  price:     number;
  fee:       number;
  ts:        number;
}

export async function logTx(uid: string, tx: TxRecord) {
  const key = keys.swaps(uid);
  await redis.lpush(key, JSON.stringify(tx));
  await redis.ltrim(key, 0, 99); // keep last 100 transactions
}

export async function getTxHistory(uid: string): Promise<TxRecord[]> {
  const raw = await redis.lrange(keys.swaps(uid), 0, 49);
  return raw.map(r => JSON.parse(r as string)) as TxRecord[];
}

// ── Profile helpers ────────────────────────────────────────────────
export interface UserProfile {
  username:  string;
  avatarId:  number;
  setupDone: boolean;
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const raw = await redis.get(keys.profile(uid));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as UserProfile);
}

export async function setProfile(uid: string, profile: UserProfile) {
  await redis.set(keys.profile(uid), JSON.stringify(profile));
}

// ── Snapshot helpers ───────────────────────────────────────────────
export interface Snapshot {
  ts:    number;
  value: number;
}

export async function saveSnapshot(uid: string, value: number) {
  const key = keys.snapshots(uid);
  await redis.lpush(key, JSON.stringify({ ts: Date.now(), value }));
  await redis.ltrim(key, 0, 199);
}

export async function getSnapshots(uid: string): Promise<Snapshot[]> {
  const raw = await redis.lrange(keys.snapshots(uid), 0, 199);
  return (raw as string[]).map(r => JSON.parse(r) as Snapshot).reverse();
}

// ── Challenge start ────────────────────────────────────────────────
export async function getChallengeStart(uid: string): Promise<number | null> {
  const raw = await redis.get(keys.challengeStart(uid));
  if (!raw) return null;
  return parseInt(raw as string, 10);
}

export async function setChallengeStart(uid: string, ts: number) {
  await redis.set(keys.challengeStart(uid), ts.toString());
}
