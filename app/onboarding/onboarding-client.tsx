'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AVATARS } from '@/lib/challenge';

export function OnboardingClient({ name }: { name: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(name.split(' ')[0] ?? '');
  const [avatarId, setAvatarId] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async () => {
    if (username.trim().length < 2) return setError('Username must be at least 2 characters');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), avatarId }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? 'Something went wrong');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0b10' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-xl text-white">Swap<span className="text-blue-400">X</span></span>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-1">Set up your profile</h1>
          <p className="text-sm text-[#6b7280] mb-6">Choose a username and avatar to start your $100,000 trading challenge.</p>

          {/* Username */}
          <label className="text-xs text-[#6b7280] mb-1 block font-medium uppercase tracking-widest">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            maxLength={20}
            placeholder="e.g. crypto_trader"
            className="input-dark mb-6"
          />

          {/* Avatar */}
          <label className="text-xs text-[#6b7280] mb-3 block font-medium uppercase tracking-widest">Choose Avatar</label>
          <div className="grid grid-cols-6 gap-2 mb-6">
            {AVATARS.map(av => (
              <button
                key={av.id}
                onClick={() => setAvatarId(av.id)}
                title={av.label}
                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${
                  avatarId === av.id
                    ? 'border-blue-400 scale-110 shadow-lg'
                    : 'border-transparent hover:border-[#1e2235]'
                }`}
                style={{ background: av.bg + '33' }}
              >
                {av.emoji}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 bg-[#0f1117] rounded-xl p-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: AVATARS[avatarId].bg }}
            >
              {AVATARS[avatarId].emoji}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{username || 'your_name'}</div>
              <div className="text-xs text-[#6b7280]">Starting balance: $100,000 · 60-day challenge</div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={submit}
            disabled={loading || username.trim().length < 2}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Setting up…' : 'Start Challenge →'}
          </button>
        </div>

        <p className="text-center text-xs text-[#4b5563] mt-4">
          Demo platform · Simulated trading · No real money involved
        </p>
      </div>
    </div>
  );
}
