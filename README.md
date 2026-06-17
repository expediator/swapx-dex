# ⚡ SwapX Exchange

A full-stack **CEX + DEX** trading platform with real token prices, Google OAuth, and Redis-backed portfolios.

**Live:** [swapx-dex.vercel.app](https://swapx-dex.vercel.app) · **Portfolio:** [expediator.github.io/resume](https://expediator.github.io/resume/)

---

## Features

| Feature | Details |
|---|---|
| 🔄 **DEX Swap** | AMM-style swaps, 0.3% fee, slippage simulation, 30+ token pairs |
| 🏛️ **CEX Trade** | Market & limit orders, live order book, 0.1% fee, all token pairs |
| 📊 **Portfolio** | Redis-backed balances, allocation chart, P&L tracking |
| 📋 **History** | Last 100 transactions, full breakdown |
| 💹 **Live Prices** | CoinGecko API, 60s Redis cache, 30+ tokens |
| 🔐 **Auth** | Google OAuth via NextAuth.js — no wallet needed |

## Token List (30+)

BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOGE, DOT, MATIC, ATOM, NEAR, SUI, APT, LTC, HBAR, OP, ARB, INJ, LINK, UNI, AAVE, MKR, COMP, LDO, CRV, JTO, USDT, USDC, DAI, PYUSD

## Setup

### 1. Clone & install
```bash
git clone https://github.com/expediator/swapx-dex
cd swapx-dex
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel URL (e.g. `https://swapx-dex.vercel.app`) |
| `UPSTASH_REDIS_REST_URL` | [Upstash Console](https://console.upstash.com) → Create Database |
| `UPSTASH_REDIS_REST_TOKEN` | Same Upstash database |

### 3. Google OAuth setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Web application)
3. Add Authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
4. Also add `http://localhost:3000/api/auth/callback/google` for local dev

### 4. Upstash Redis (free)
1. Sign up at [console.upstash.com](https://console.upstash.com)
2. Create a Redis database (free tier: 10k commands/day)
3. Copy the REST URL and Token

### 5. Run locally
```bash
npm run dev   # → http://localhost:3000
```

## Deploy to Vercel (free)

```bash
npx vercel
```

Or connect the GitHub repo to Vercel at [vercel.com](https://vercel.com) and add the env vars in the dashboard.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **NextAuth.js 4** (Google OAuth)
- **Upstash Redis** (REST API, serverless-compatible)
- **Tailwind CSS**
- **CoinGecko API** (free tier, no key needed)

## Disclaimer

Simulated exchange — no real money, no real blockchain transactions. For educational/portfolio demonstration only.
