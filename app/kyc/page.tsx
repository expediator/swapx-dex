'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ID_TYPES = ['Aadhaar Card', 'PAN Card', 'Passport', 'Voter ID', "Driver's Licence", 'Other'];

export default function KycPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone]       = useState('');
  const [idType, setIdType]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const [already, setAlready]   = useState(false);

  useEffect(() => {
    fetch('/api/kyc').then(r => r.json()).then(d => {
      if (d.status === 'pending') setAlready(true);
    }).catch(() => {});
  }, []);

  const submit = async () => {
    if (!fullName.trim() || !phone.trim() || !idType) return setError('All fields are required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, idType }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? 'Something went wrong');
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0b10' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-xl text-white">Swap<span className="text-blue-400">X</span></span>
        </div>

        <div className="glass rounded-2xl p-8">
          {done || already ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-white mb-2">
                {done ? 'KYC Submitted!' : 'Already submitted'}
              </h2>
              <p className="text-[#6b7280] text-sm">
                {done
                  ? 'Your details are under review. You\'ll be notified once verified.'
                  : 'Your KYC is pending review. We\'ll notify you when it\'s approved.'}
              </p>
              {done && <p className="text-xs text-[#4b5563] mt-4">Redirecting to dashboard…</p>}
              {already && (
                <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors">
                  Back to Dashboard
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-green-900/30 text-green-400 border border-green-700/40 rounded-full px-3 py-1 text-xs font-medium mb-3">
                  🏆 Challenge Target Reached!
                </div>
                <h1 className="text-xl font-bold text-white mb-1">Identity Verification</h1>
                <p className="text-sm text-[#6b7280]">You've hit the 7.5% target. Complete KYC to apply for live trading access.</p>
              </div>

              <label className="text-xs text-[#6b7280] mb-1 block font-medium uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="As on government ID"
                className="input-dark mb-4"
              />

              <label className="text-xs text-[#6b7280] mb-1 block font-medium uppercase tracking-widest">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="input-dark mb-4"
              />

              <label className="text-xs text-[#6b7280] mb-1 block font-medium uppercase tracking-widest">ID Type</label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className="input-dark mb-6 cursor-pointer"
              >
                <option value="">Select document type…</option>
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <div className="bg-[#0f1117] rounded-xl p-3 mb-6 text-xs text-[#6b7280]">
                🔒 Your information is stored securely and used only for identity verification purposes.
              </div>

              <button
                onClick={submit}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '⏳ Submitting…' : 'Submit KYC →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
