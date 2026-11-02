<div align="center">

# ⚡ SwapX Exchange

**Full-stack CEX + DEX crypto trading platform**

[![Live](https://img.shields.io/badge/Live-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://easygoing-motivation-production.up.railway.app)
[![GitHub](https://img.shields.io/badge/GitHub-expediator%2Fswapx--dex-181717?style=flat-square&logo=github)](https://github.com/expediator/swapx-dex)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Redis](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square)](https://upstash.com)

A portfolio/educational project demonstrating full-stack web development using a crypto exchange as the domain. Combines a **Centralized Exchange (CEX)** order-book interface and a **Decentralized Exchange (DEX)** AMM swap engine in a single Next.js app.

</div>

---

## Features

- **CEX Interface** — Buy/sell with a market order book. Prices pulled from CoinGecko API with 60s Redis cache.
- **DEX AMM Swap** — Constant-product formula (`x * y = k`) swap between any two tokens.
- **30+ Tokens** — BTC, ETH, SOL, DeFi tokens, stablecoins, meme coins.
- **Persistent Portfolios** — Per-user portfolios stored in Upstash Redis. Survive refreshes and sessions.
- **Full Transaction History** — Every trade logged, last 100 per user.
- **Google OAuth** — One-click sign in, no wallet required.
- **Real-time Prices** — CoinGecko v3 API with Redis caching to avoid rate limits.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v3, shadcn/ui |
| Auth | NextAuth.js v4, Google OAuth 2.0 |
| Database | Upstash Redis (REST API) |
| Charts | Recharts |
| Prices | CoinGecko v3 API |
| Deploy | Vercel / Railway |

## Quick Start

```bash
git clone https://github.com/expediator/swapx-dex
cd swapx-dex
npm install
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) or your production URL |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `UPSTASH_REDIS_REST_URL` | [console.upstash.com](https://console.upstash.com) → Create free DB → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Same database → REST Token |

## Deploy to Vercel

```bash
npm i -g vercel && vercel login && vercel --prod
```

Add env vars in Vercel dashboard → Project → Settings → Environment Variables.

## How DEX AMM Works

```
x * y = k    (constant product)
Δy = y - k / (x + Δx)
```

Slippage increases with trade size relative to pool depth. A 0.3% fee is deducted on every swap.

## How Pricing Works

CoinGecko prices fetched every 60s and cached in Redis. All trades execute at the cached price — avoids rate-limit issues and gives consistent prices per session.

> **Disclaimer:** Simulated exchange — no real funds. Educational/portfolio project only.

---

<div align="center">
An <strong>Expediator Inc.</strong> product · © 2026 · <a href="https://expediator.github.io/resume/">Portfolio</a>
</div>