export const CHALLENGE_INITIAL = 100_000;
export const CHALLENGE_TARGET  = 107_500;  // 7.5% return → qualifies for real trading
export const CHALLENGE_MAX_LOSS = 70_000;  // 30% drawdown → account at risk
export const CHALLENGE_DAYS    = 60;

export const AVATARS = [
  { id: 0,  emoji: '🦊', bg: '#f97316', label: 'Fox' },
  { id: 1,  emoji: '🐺', bg: '#6366f1', label: 'Wolf' },
  { id: 2,  emoji: '🦁', bg: '#f59e0b', label: 'Lion' },
  { id: 3,  emoji: '🐉', bg: '#22c55e', label: 'Dragon' },
  { id: 4,  emoji: '🦅', bg: '#3b82f6', label: 'Eagle' },
  { id: 5,  emoji: '🐻', bg: '#8b5cf6', label: 'Bear' },
  { id: 6,  emoji: '🦈', bg: '#0ea5e9', label: 'Shark' },
  { id: 7,  emoji: '🦋', bg: '#ec4899', label: 'Butterfly' },
  { id: 8,  emoji: '🐆', bg: '#d97706', label: 'Leopard' },
  { id: 9,  emoji: '🦏', bg: '#6b7280', label: 'Rhino' },
  { id: 10, emoji: '🐬', bg: '#14b8a6', label: 'Dolphin' },
  { id: 11, emoji: '🦔', bg: '#a855f7', label: 'Hedgehog' },
] as const;
