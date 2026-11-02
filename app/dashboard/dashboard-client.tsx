'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Token } from '@/lib/tokens';
import type { TxRecord, UserProfile, Snapshot } from '@/lib/redis';
import { AVATARS } from '@/lib/challenge';

interface Props {
  user:              { name: string; email: string; image: string };
  profile:           UserProfile;
  portfolio:         Record<string, number>;
  history:           TxRecord[];
  prices:            Record<string, number>;
  totalUsd:          number;
  tokens:            Token[];
  snapshots:         Snapshot[];
  challengeStart:    number | null;
  challengeDeadline: number | null;
  daysLeft:          number | null;
  challengeTarget:   number;
  challengeMaxLoss:  number;
  challengeInitial:  number;
}

type Tab = 'dex' | 'cex' | 'portfolio' | 'history' | 'performance';

function fmt(n: number, d = 2) {
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: d });
  if (n >= 1)    return '$' + n.toFixed(d);
  return '$' + n.toFixed(6);
}

function fmtAmt(n: number, sym: string) {
  if (['USDT','USDC','DAI','PYUSD'].includes(sym)) return n.toFixed(2);
  if (n < 0.001) return n.toFixed(6);
  if (n < 1)     return n.toFixed(4);
  return n.toFixed(3);
}

function pctChange() { return (Math.random() * 6 - 3).toFixed(2); }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs border border-[#1e2235]">
      <p className="text-[#9ca3af] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="mono text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardClient({
  user, profile, portfolio: initPortfolio, history: initHistory, prices: initPrices,
  totalUsd: initTotal, tokens, snapshots: initSnapshots,
  challengeStart, challengeDeadline, daysLeft,
  challengeTarget, challengeMaxLoss, challengeInitial,
}: Props) {
  const [tab, setTab]             = useState<Tab>('dex');
  const [portfolio, setPortfolio] = useState(initPortfolio);
  const [history, setHistory]     = useState(initHistory);
  const [prices]                  = useState(initPrices);
  const [totalUsd, setTotalUsd]   = useState(initTotal);
  const [snapshots, setSnapshots] = useState(initSnapshots);
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const [kycModal, setKycModal]   = useState(false);
  const [kycDone, setKycDone]     = useState(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>();

  // DEX state
  const [dexFrom, setDexFrom]     = useState('USDT');
  const [dexTo, setDexTo]         = useState('ETH');
  const [dexAmt, setDexAmt]       = useState('');
  const [dexLoading, setDexLoading] = useState(false);

  // CEX state
  const [cexBase, setCexBase]     = useState('ETH');
  const [cexQuote, setCexQuote]   = useState('USDT');
  const [cexSide, setCexSide]     = useState<'buy'|'sell'>('buy');
  const [cexAmt, setCexAmt]       = useState('');
  const [cexType, setCexType]     = useState<'market'|'limit'>('market');
  const [cexLimit, setCexLimit]   = useState('');
  const [cexLoading, setCexLoading] = useState(false);

  // KYC form state
  const [kycName, setKycName]     = useState('');
  const [kycPhone, setKycPhone]   = useState('');
  const [kycId, setKycId]         = useState('');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError]   = useState('');

  const notify = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };

  const refreshPortfolio = useCallback(async () => {
    const res = await fetch('/api/portfolio');
    if (!res.ok) return;
    const d = await res.json();
    setPortfolio(d.portfolio);
    setHistory(d.history);
    setTotalUsd(d.totalUsd);
  }, []);

  const refreshSnapshots = useCallback(async () => {
    const res = await fetch('/api/performance');
    if (!res.ok) return;
    const d = await res.json();
    setSnapshots(d.snapshots ?? []);
  }, []);

  // Real-time chart: poll every 30s when on performance tab
  useEffect(() => {
    if (tab !== 'performance') return;
    const id = setInterval(refreshSnapshots, 30_000);
    return () => clearInterval(id);
  }, [tab, refreshSnapshots]);

  // Check KYC status on mount
  useEffect(() => {
    fetch('/api/kyc').then(r => r.json()).then(d => {
      if (d.status === 'pending') setKycDone(true);
    }).catch(() => {});
  }, []);

  // Show KYC modal when target reached
  useEffect(() => {
    if (totalUsd >= challengeTarget && !kycDone) {
      setKycModal(true);
    }
  }, [totalUsd, challengeTarget, kycDone]);

  const doSwap = async () => {
    if (!dexAmt || parseFloat(dexAmt) <= 0) return notify('Enter an amount', false);
    setDexLoading(true);
    try {
      const res = await fetch('/api/swap', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromSym: dexFrom, toSym: dexTo, fromAmt: parseFloat(dexAmt) }) });
      const d = await res.json();
      if (!res.ok) return notify(d.error, false);
      notify(`Swapped ${dexAmt} ${dexFrom} → ${d.toAmt.toFixed(6)} ${dexTo} (fee $${d.fee.toFixed(3)})`, true);
      setDexAmt('');
      await refreshPortfolio();
    } finally { setDexLoading(false); }
  };

  const doOrder = async () => {
    if (!cexAmt || parseFloat(cexAmt) <= 0) return notify('Enter an amount', false);
    setCexLoading(true);
    try {
      const res = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side: cexSide, baseSym: cexBase, quoteSym: cexQuote, amount: parseFloat(cexAmt),
          orderType: cexType, limitPrice: cexLimit ? parseFloat(cexLimit) : undefined }) });
      const d = await res.json();
      if (!res.ok) return notify(d.error, false);
      notify(`${cexSide === 'buy' ? 'Bought' : 'Sold'} @ $${d.execPrice.toLocaleString()} · fee $${d.fee.toFixed(3)}`, true);
      setCexAmt('');
      await refreshPortfolio();
    } finally { setCexLoading(false); }
  };

  const submitKyc = async () => {
    if (!kycName.trim() || !kycPhone.trim() || !kycId) return setKycError('All fields are required');
    setKycLoading(true);
    setKycError('');
    try {
      const res = await fetch('/api/kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: kycName, phone: kycPhone, idType: kycId }) });
      const d = await res.json();
      if (!res.ok) return setKycError(d.error ?? 'Failed');
      setKycDone(true);
      setKycModal(false);
      notify('🎉 KYC submitted! Our team will review your details.', true);
    } finally { setKycLoading(false); }
  };

  const dexOutAmt = dexAmt && prices[dexFrom] && prices[dexTo]
    ? ((parseFloat(dexAmt) * prices[dexFrom] * 0.997) / prices[dexTo]).toFixed(6)
    : '—';

  const cexPrice = prices[cexBase];

  const mkOrderBook = (p: number, side: 'ask'|'bid', n = 7) =>
    Array.from({ length: n }, (_, i) => ({
      price: side === 'ask' ? p * (1 + 0.0003 * (i + 1)) : p * (1 - 0.0003 * (i + 1)),
      qty:   (Math.random() * 3 + 0.1).toFixed(4),
    }));

  const asks = cexPrice ? mkOrderBook(cexPrice, 'ask') : [];
  const bids = cexPrice ? mkOrderBook(cexPrice, 'bid') : [];

  // Challenge derived values
  const challengePct  = Math.min(100, Math.max(0, ((totalUsd - challengeInitial) / (challengeTarget - challengeInitial)) * 100));
  const isAboveTarget = totalUsd >= challengeTarget;
  const isBelowMax    = totalUsd <= challengeMaxLoss;
  const challengeBarColor = isBelowMax ? '#ef4444' : isAboveTarget ? '#22c55e' : totalUsd >= challengeInitial ? '#3b82f6' : '#f59e0b';

  // Avatar
  const avatar = AVATARS[profile.avatarId] ?? AVATARS[0];

  // Chart data for performance tab
  const chartData = snapshots.length > 0
    ? snapshots.map(s => ({
        date: new Date(s.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Portfolio': Math.round(s.value),
        'Baseline':  challengeInitial,
        'Target':    challengeTarget,
        'Max Loss':  challengeMaxLoss,
      }))
    : [{ date: 'Start', 'Portfolio': challengeInitial, 'Baseline': challengeInitial, 'Target': challengeTarget, 'Max Loss': challengeMaxLoss }];

  // Add current value as last point
  if (snapshots.length > 0) {
    chartData.push({
      date: 'Now',
      'Portfolio': Math.round(totalUsd),
      'Baseline':  challengeInitial,
      'Target':    challengeTarget,
      'Max Loss':  challengeMaxLoss,
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0b10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1e2235] glass sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold text-white">Swap<span className="text-blue-400">X</span></span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0f1117] border border-[#1e2235] rounded-xl p-1">
          {([
            ['dex', '🔄 DEX'],
            ['cex', '🏛 CEX'],
            ['portfolio', '📊 Portfolio'],
            ['performance', '📈 Performance'],
            ['history', '📋 History'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-[#1e2235] text-blue-400' : 'text-[#6b7280] hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-[#6b7280]">Portfolio</div>
            <div className={`font-bold mono text-sm ${isAboveTarget ? 'text-green-400' : isBelowMax ? 'text-red-400' : 'text-blue-400'}`}>{fmt(totalUsd)}</div>
          </div>
          {/* Custom avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ring-2 ring-[#1e2235]"
            style={{ background: avatar.bg }}
            title={profile.username}
          >
            {avatar.emoji}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-white">{profile.username}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs text-[#6b7280] hover:text-red-400 border border-[#1e2235] px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </header>

      {/* Challenge progress bar */}
      <div className="px-6 py-2 bg-[#0a0b10] border-b border-[#0f1117]">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#6b7280]">
                {isAboveTarget ? '🏆 Challenge Complete!' : isBelowMax ? '⚠️ Below Safety Floor' : '⚡ Trading Challenge'}
                {' · '}
                <span className="mono" style={{ color: challengeBarColor }}>{fmt(totalUsd)}</span>
                {' / '}
                <span className="text-[#6b7280] mono">{fmt(challengeTarget)} target</span>
              </span>
              <span className="text-[#6b7280]">
                {daysLeft !== null ? `${daysLeft}d left` : '—'}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1e2235] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${challengePct}%`, background: challengeBarColor }}
              />
            </div>
          </div>
          {isAboveTarget && !kycDone && (
            <button onClick={() => setKycModal(true)}
              className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors">
              Complete KYC →
            </button>
          )}
          {kycDone && (
            <span className="text-xs text-green-400 font-medium">KYC Submitted ✓</span>
          )}
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${msg.ok ? 'bg-green-900/90 text-green-300 border border-green-700' : 'bg-red-900/90 text-red-300 border border-red-700'}`}>
          {msg.ok ? '✅' : '❌'} {msg.text}
        </div>
      )}

      {/* KYC Modal */}
      {kycModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4" onClick={e => e.target === e.currentTarget && setKycModal(false)}>
          <div className="w-full max-w-md glass rounded-2xl p-7">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 border border-green-700/40 rounded-full px-3 py-0.5 text-xs font-medium mb-2">
                  🏆 Target Reached!
                </div>
                <h2 className="text-lg font-bold text-white">Identity Verification</h2>
                <p className="text-xs text-[#6b7280] mt-0.5">Complete KYC to apply for live trading.</p>
              </div>
              <button onClick={() => setKycModal(false)} className="text-[#6b7280] hover:text-white text-xl">✕</button>
            </div>

            <label className="text-xs text-[#6b7280] mb-1 block uppercase tracking-widest">Full Name</label>
            <input value={kycName} onChange={e => setKycName(e.target.value)} placeholder="As on government ID" className="input-dark mb-3" />

            <label className="text-xs text-[#6b7280] mb-1 block uppercase tracking-widest">Phone</label>
            <input type="tel" value={kycPhone} onChange={e => setKycPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="input-dark mb-3" />

            <label className="text-xs text-[#6b7280] mb-1 block uppercase tracking-widest">ID Type</label>
            <select value={kycId} onChange={e => setKycId(e.target.value)} className="input-dark mb-4 cursor-pointer">
              <option value="">Select document type…</option>
              {['Aadhaar Card','PAN Card','Passport','Voter ID',"Driver's Licence",'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {kycError && <p className="text-red-400 text-xs mb-3">{kycError}</p>}

            <button onClick={submitKyc} disabled={kycLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 transition-colors">
              {kycLoading ? '⏳ Submitting…' : 'Submit KYC'}
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">

        {/* ── DEX SWAP ──────────────────────────────────────────────── */}
        {tab === 'dex' && (
          <div className="flex gap-4 h-full">
            <div className="w-96 flex-shrink-0">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-white text-lg">DEX Swap</h2>
                  <span className="text-xs text-[#6b7280] mono">Fee: 0.3%</span>
                </div>

                <label className="text-xs text-[#6b7280] mb-1 block">From</label>
                <div className="flex gap-2 mb-2">
                  <select value={dexFrom} onChange={e => setDexFrom(e.target.value)} className="input-dark w-28 flex-shrink-0 cursor-pointer">
                    {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                  </select>
                  <input type="number" placeholder="0.00" value={dexAmt} onChange={e => setDexAmt(e.target.value)} className="input-dark flex-1" />
                </div>
                <div className="text-xs text-[#6b7280] mb-4">
                  Balance: <span className="text-gray-300 mono">{fmtAmt(portfolio[dexFrom] ?? 0, dexFrom)} {dexFrom}</span>
                  {dexAmt && <> · ≈ {fmt(parseFloat(dexAmt||'0') * (prices[dexFrom]??0))}</>}
                  {portfolio[dexFrom] && (
                    <button onClick={() => setDexAmt((portfolio[dexFrom]).toString())} className="ml-2 text-blue-400 hover:underline">MAX</button>
                  )}
                </div>

                <div className="flex justify-center my-2">
                  <button onClick={() => { setDexFrom(dexTo); setDexTo(dexFrom); setDexAmt(''); }}
                    className="p-2 rounded-lg bg-[#1e2235] hover:bg-[#252a3a] text-blue-400 text-xl transition-colors">⇅</button>
                </div>

                <label className="text-xs text-[#6b7280] mb-1 block">To (estimated)</label>
                <div className="flex gap-2 mb-2">
                  <select value={dexTo} onChange={e => setDexTo(e.target.value)} className="input-dark w-28 flex-shrink-0 cursor-pointer">
                    {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                  </select>
                  <div className="input-dark flex-1 text-[#9ca3af] mono">{dexOutAmt}</div>
                </div>
                <div className="text-xs text-[#6b7280] mb-4">
                  Balance: <span className="text-gray-300 mono">{fmtAmt(portfolio[dexTo] ?? 0, dexTo)} {dexTo}</span>
                </div>

                <div className="bg-[#0f1117] rounded-xl p-3 mb-4 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-[#6b7280]">Rate</span>
                    <span className="mono text-gray-300">1 {dexFrom} = {prices[dexFrom] && prices[dexTo] ? (prices[dexFrom]/prices[dexTo]).toFixed(6) : '—'} {dexTo}</span></div>
                  <div className="flex justify-between"><span className="text-[#6b7280]">Price impact</span><span className="text-green-400 mono">&lt; 0.1%</span></div>
                  <div className="flex justify-between"><span className="text-[#6b7280]">Slippage tolerance</span><span className="mono text-gray-300">0.5%</span></div>
                  <div className="flex justify-between"><span className="text-[#6b7280]">Min received</span>
                    <span className="mono text-gray-300">{dexOutAmt !== '—' ? (parseFloat(dexOutAmt)*0.995).toFixed(6) : '—'} {dexTo}</span></div>
                </div>

                <button onClick={doSwap} disabled={dexLoading} className="btn-swap">
                  {dexLoading ? '⏳ Swapping…' : '🔄 Swap'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold text-white mb-3">Market Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#6b7280] text-xs border-b border-[#1e2235]">
                        <th className="text-left py-2 pl-2">Token</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">24h %</th>
                        <th className="text-right py-2">Type</th>
                        <th className="text-right py-2 pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map(t => {
                        const change = parseFloat(pctChange());
                        return (
                          <tr key={t.symbol} className="border-b border-[#0f1117] hover:bg-[#0f1117] transition-colors">
                            <td className="py-2.5 pl-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                                <span className="font-medium text-white">{t.symbol}</span>
                                <span className="text-[#6b7280] text-xs hidden sm:inline">{t.name}</span>
                              </div>
                            </td>
                            <td className="text-right mono text-gray-300">
                              {prices[t.symbol] ? fmt(prices[t.symbol]) : <span className="text-[#4b5563]">—</span>}
                            </td>
                            <td className={`text-right mono font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {change >= 0 ? '+' : ''}{change}%
                            </td>
                            <td className="text-right">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                t.type === 'stable' ? 'bg-green-900/40 text-green-400' :
                                t.type === 'defi'   ? 'bg-purple-900/40 text-purple-400' :
                                'bg-blue-900/40 text-blue-400'
                              }`}>{t.type}</span>
                            </td>
                            <td className="text-right pr-2">
                              <button onClick={() => { setDexFrom('USDT'); setDexTo(t.symbol); setTab('dex'); }}
                                className="text-xs text-blue-400 hover:underline">Swap</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CEX TRADE ─────────────────────────────────────────────── */}
        {tab === 'cex' && (
          <div className="flex gap-4">
            <div className="w-80 flex-shrink-0 space-y-3">
              <div className="glass rounded-2xl p-5">
                <h2 className="font-bold text-white text-lg mb-4">CEX Trade</h2>
                <div className="flex gap-2 mb-4">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Base</label>
                    <select value={cexBase} onChange={e => setCexBase(e.target.value)} className="input-dark cursor-pointer">
                      {tokens.filter(t => t.type !== 'stable').map(t => <option key={t.symbol}>{t.symbol}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Quote</label>
                    <select value={cexQuote} onChange={e => setCexQuote(e.target.value)} className="input-dark cursor-pointer">
                      {tokens.filter(t => t.type === 'stable').map(t => <option key={t.symbol}>{t.symbol}</option>)}
                    </select>
                  </div>
                </div>

                {cexPrice && (
                  <div className="bg-[#0f1117] rounded-xl p-3 mb-4 text-center">
                    <div className="text-xs text-[#6b7280] mb-1">{cexBase}/{cexQuote}</div>
                    <div className="text-2xl font-bold text-white mono">{fmt(cexPrice)}</div>
                  </div>
                )}

                <div className="flex gap-1 bg-[#0a0b10] rounded-lg p-1 mb-4">
                  {(['market','limit'] as const).map(t => (
                    <button key={t} onClick={() => setCexType(t)}
                      className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all ${cexType === t ? 'bg-[#1e2235] text-blue-400' : 'text-[#6b7280]'}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1 mb-4">
                  {(['buy','sell'] as const).map(s => (
                    <button key={s} onClick={() => setCexSide(s)}
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                        cexSide === s ? (s === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-[#1e2235] text-[#6b7280]'
                      }`}>
                      {s === 'buy' ? '▲ Buy' : '▼ Sell'}
                    </button>
                  ))}
                </div>

                {cexType === 'limit' && (
                  <>
                    <label className="text-xs text-[#6b7280] mb-1 block">Limit Price (USD)</label>
                    <input type="number" placeholder={cexPrice ? cexPrice.toString() : '0'} value={cexLimit}
                      onChange={e => setCexLimit(e.target.value)} className="input-dark mb-3" />
                  </>
                )}

                <label className="text-xs text-[#6b7280] mb-1 block">
                  {cexSide === 'buy' ? `Amount (${cexQuote} to spend)` : `Amount (${cexBase} to sell)`}
                </label>
                <input type="number" placeholder="0.00" value={cexAmt} onChange={e => setCexAmt(e.target.value)} className="input-dark mb-1" />
                <div className="text-xs text-[#6b7280] mb-3">
                  Balance: {cexSide === 'buy'
                    ? <span className="text-gray-300 mono">{fmtAmt(portfolio[cexQuote]??0, cexQuote)} {cexQuote}</span>
                    : <span className="text-gray-300 mono">{fmtAmt(portfolio[cexBase]??0, cexBase)} {cexBase}</span>}
                </div>

                {cexAmt && cexPrice && (
                  <div className="bg-[#0f1117] rounded-xl p-3 mb-4 text-xs space-y-1">
                    {cexSide === 'buy' ? (
                      <>
                        <div className="flex justify-between"><span className="text-[#6b7280]">You pay</span><span className="mono">{fmt(parseFloat(cexAmt||'0'))}</span></div>
                        <div className="flex justify-between"><span className="text-[#6b7280]">You receive ≈</span><span className="mono text-green-400">{((parseFloat(cexAmt||'0')*0.999)/cexPrice).toFixed(5)} {cexBase}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between"><span className="text-[#6b7280]">You sell</span><span className="mono">{cexAmt} {cexBase}</span></div>
                        <div className="flex justify-between"><span className="text-[#6b7280]">You receive ≈</span><span className="mono text-green-400">{fmt(parseFloat(cexAmt||'0') * cexPrice * 0.999)}</span></div>
                      </>
                    )}
                    <div className="flex justify-between"><span className="text-[#6b7280]">Fee (0.1%)</span><span className="mono text-[#6b7280]">{fmt(parseFloat(cexAmt||'0')*(cexSide==='buy'?1:cexPrice)*0.001)}</span></div>
                  </div>
                )}

                <button onClick={doOrder} disabled={cexLoading} className={cexSide === 'buy' ? 'btn-buy' : 'btn-sell'}>
                  {cexLoading ? '⏳ Processing…' : (cexSide === 'buy' ? `▲ Buy ${cexBase}` : `▼ Sell ${cexBase}`)}
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold text-white mb-3">Order Book — {cexBase}/{cexQuote}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6b7280] grid grid-cols-2 mb-2"><span>Price</span><span className="text-right">Qty ({cexBase})</span></div>
                    {asks.reverse().map((a, i) => (
                      <div key={i} className="grid grid-cols-2 text-xs py-0.5 hover:bg-red-900/10 rounded transition-colors">
                        <span className="text-red-400 mono">{fmt(a.price)}</span>
                        <span className="text-right text-[#9ca3af] mono">{a.qty}</span>
                      </div>
                    ))}
                    {cexPrice && (
                      <div className="text-center font-bold text-white mono py-1.5 border-y border-[#1e2235] my-1 text-sm">{fmt(cexPrice)}</div>
                    )}
                    {bids.map((b, i) => (
                      <div key={i} className="grid grid-cols-2 text-xs py-0.5 hover:bg-green-900/10 rounded transition-colors">
                        <span className="text-green-400 mono">{fmt(b.price)}</span>
                        <span className="text-right text-[#9ca3af] mono">{b.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs text-[#6b7280] grid grid-cols-2 mb-2"><span>Price</span><span className="text-right">Side</span></div>
                    {Array.from({ length: 14 }, (_, i) => {
                      const isBuy = Math.random() > 0.5;
                      const p = cexPrice ? cexPrice * (1 + (Math.random() * 0.002 - 0.001)) : 0;
                      return (
                        <div key={i} className="grid grid-cols-2 text-xs py-0.5">
                          <span className={`${isBuy ? 'text-green-400' : 'text-red-400'} mono`}>{p ? fmt(p) : '—'}</span>
                          <span className={`text-right text-xs ${isBuy ? 'text-green-400' : 'text-red-400'}`}>{isBuy ? 'BUY' : 'SELL'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-4">
                <h3 className="font-semibold text-white mb-3 text-sm">Quick Select</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {tokens.filter(t => t.type !== 'stable').map(t => (
                    <button key={t.symbol} onClick={() => setCexBase(t.symbol)}
                      className={`p-2 rounded-xl text-xs font-medium transition-all text-center ${cexBase === t.symbol ? 'ring-1 ring-blue-400 bg-blue-900/20' : 'bg-[#0f1117] hover:bg-[#1e2235]'}`}>
                      <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: t.color }} />
                      <div className="text-white">{t.symbol}</div>
                      <div className="text-[#6b7280]" style={{ fontSize: '10px' }}>{prices[t.symbol] ? fmt(prices[t.symbol]) : '—'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PORTFOLIO ─────────────────────────────────────────────── */}
        {tab === 'portfolio' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Value', value: fmt(totalUsd), color: 'text-green-400' },
                { label: 'Assets', value: Object.keys(portfolio).length.toString(), color: 'text-blue-400' },
                { label: 'Transactions', value: history.length.toString(), color: 'text-purple-400' },
                { label: 'Stablecoins', value: fmt((['USDT','USDC','DAI','PYUSD'] as string[]).reduce((s,sym) => s + (portfolio[sym]??0)*(prices[sym]??1), 0)), color: 'text-yellow-400' },
              ].map(c => (
                <div key={c.label} className="glass rounded-2xl p-4">
                  <div className="text-xs text-[#6b7280] mb-1">{c.label}</div>
                  <div className={`text-2xl font-bold mono ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold text-white mb-3">Holdings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#6b7280] text-xs border-b border-[#1e2235]">
                      <th className="text-left py-2 pl-2">Token</th>
                      <th className="text-right py-2">Balance</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Value</th>
                      <th className="text-right py-2 pr-2">Alloc %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(portfolio)
                      .map(([sym, amt]) => ({ sym, amt, val: amt * (prices[sym] ?? 1) }))
                      .sort((a, b) => b.val - a.val)
                      .map(({ sym, amt, val }) => (
                        <tr key={sym} className="border-b border-[#0f1117] hover:bg-[#0f1117] transition-colors">
                          <td className="py-2.5 pl-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: tokens.find(t=>t.symbol===sym)?.color ?? '#888' }} />
                              <span className="font-medium text-white">{sym}</span>
                            </div>
                          </td>
                          <td className="text-right mono text-gray-300">{fmtAmt(amt, sym)}</td>
                          <td className="text-right mono text-gray-300">{prices[sym] ? fmt(prices[sym]) : '—'}</td>
                          <td className="text-right mono font-semibold text-white">{fmt(val)}</td>
                          <td className="text-right pr-2">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-[#1e2235] rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, val/totalUsd*100)}%` }} />
                              </div>
                              <span className="text-[#6b7280] text-xs mono">{(val/totalUsd*100).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE ───────────────────────────────────────────── */}
        {tab === 'performance' && (
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Current Value',  value: fmt(totalUsd),         color: isAboveTarget ? 'text-green-400' : isBelowMax ? 'text-red-400' : 'text-blue-400' },
                { label: 'P&L',            value: (totalUsd >= challengeInitial ? '+' : '') + fmt(totalUsd - challengeInitial), color: totalUsd >= challengeInitial ? 'text-green-400' : 'text-red-400' },
                { label: 'Return %',       value: ((totalUsd - challengeInitial) / challengeInitial * 100).toFixed(2) + '%', color: totalUsd >= challengeInitial ? 'text-green-400' : 'text-red-400' },
                { label: 'Days Left',      value: daysLeft !== null ? `${daysLeft}d` : '—', color: (daysLeft ?? 60) > 20 ? 'text-blue-400' : 'text-yellow-400' },
              ].map(c => (
                <div key={c.label} className="glass rounded-2xl p-4">
                  <div className="text-xs text-[#6b7280] mb-1">{c.label}</div>
                  <div className={`text-2xl font-bold mono ${c.color}`}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Portfolio Performance</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-[#6b7280]">Live · refreshes 30s</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1e2235' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Baseline"
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Target"
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Max Loss"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Portfolio"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ fill: '#a855f7', r: 3 }}
                    activeDot={{ r: 5, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-4 gap-3 mt-4 text-xs">
                {[
                  { color: '#6b7280', label: 'Baseline', value: fmt(challengeInitial) },
                  { color: '#22c55e', label: 'Target (7.5%)', value: fmt(challengeTarget) },
                  { color: '#ef4444', label: 'Max Loss Floor', value: fmt(challengeMaxLoss) },
                  { color: '#a855f7', label: 'Your Portfolio', value: fmt(totalUsd) },
                ].map(l => (
                  <div key={l.label} className="bg-[#0f1117] rounded-xl p-3 text-center">
                    <div className="flex items-center gap-1.5 justify-center mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                      <span className="text-[#6b7280]">{l.label}</span>
                    </div>
                    <div className="font-bold mono text-white">{l.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Challenge description */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3">About the Challenge</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#0f1117] rounded-xl p-4">
                  <div className="text-green-400 font-bold text-lg mb-1">{fmt(challengeTarget)}</div>
                  <div className="text-[#6b7280]">Target — reach this in 60 days to qualify for live trading.</div>
                </div>
                <div className="bg-[#0f1117] rounded-xl p-4">
                  <div className="text-red-400 font-bold text-lg mb-1">{fmt(challengeMaxLoss)}</div>
                  <div className="text-[#6b7280]">Safety floor — if you fall below this, your challenge is at risk.</div>
                </div>
                <div className="bg-[#0f1117] rounded-xl p-4">
                  <div className="text-blue-400 font-bold text-lg mb-1">{daysLeft !== null ? `${daysLeft} days` : '—'}</div>
                  <div className="text-[#6b7280]">Time remaining. Started: {challengeStart ? new Date(challengeStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ───────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="glass rounded-2xl p-4">
            <h3 className="font-semibold text-white mb-3">Transaction History</h3>
            {history.length === 0 ? (
              <div className="text-center text-[#6b7280] py-12">No transactions yet. Start trading to see history here.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#6b7280] text-xs border-b border-[#1e2235]">
                      <th className="text-left py-2 pl-2">Type</th>
                      <th className="text-right py-2">From</th>
                      <th className="text-right py-2">To</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Fee</th>
                      <th className="text-right py-2 pr-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(tx => (
                      <tr key={tx.id} className="border-b border-[#0f1117] hover:bg-[#0f1117] transition-colors">
                        <td className="py-2.5 pl-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            tx.type === 'buy'  ? 'bg-green-900/40 text-green-400' :
                            tx.type === 'sell' ? 'bg-red-900/40 text-red-400' :
                            'bg-blue-900/40 text-blue-400'
                          }`}>{tx.type.toUpperCase()}</span>
                        </td>
                        <td className="text-right mono text-gray-300">{fmtAmt(tx.fromAmt, tx.fromSym)} {tx.fromSym}</td>
                        <td className="text-right mono text-green-400">{fmtAmt(tx.toAmt, tx.toSym)} {tx.toSym}</td>
                        <td className="text-right mono text-gray-300">{fmt(tx.price)}</td>
                        <td className="text-right mono text-[#6b7280]">${tx.fee.toFixed(3)}</td>
                        <td className="text-right pr-2 text-xs text-[#6b7280]">
                          {new Date(tx.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
