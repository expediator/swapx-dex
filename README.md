# ⚡ SwapX Exchange — CEX + DEX Trading Platform

> A full-stack simulated crypto exchange combining a **Centralized Exchange (CEX)** order interface with a **Decentralized Exchange (DEX)** AMM swap engine. Built with Next.js 14, TypeScript, Redis, and Google OAuth.

**Live Demo:** [swapx-dex.onrender.com](https://swapx-dex.onrender.com) &nbsp;·&nbsp; **Source:** [github.com/expediator/swapx-dex](https://github.com/expediator/swapx-dex) &nbsp;·&nbsp; **Portfolio:** [expediator.github.io/resume](https://expediator.github.io/resume/)

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Feature Breakdown](#2-feature-breakdown)
3. [Tech Stack — Why Each Tool Was Chosen](#3-tech-stack--why-each-tool-was-chosen)
4. [Project Structure — Every File Explained](#4-project-structure--every-file-explained)
5. [How the Data Model Works (Redis)](#5-how-the-data-model-works-redis)
6. [API Reference — Every Endpoint](#6-api-reference--every-endpoint)
7. [How Pricing Works](#7-how-pricing-works)
8. [How DEX Swaps Work (Math)](#8-how-dex-swaps-work-math)
9. [How CEX Orders Work (Math)](#9-how-cex-orders-work-math)
10. [Authentication Flow (Google OAuth)](#10-authentication-flow-google-oauth)
11. [Token List (30+)](#11-token-list-30)
12. [Setup Guide — Local Development](#12-setup-guide--local-development)
13. [Deployment — Free on Render.com](#13-deployment--free-on-rendercom)
14. [Environment Variables Reference](#14-environment-variables-reference)
15. [Common Issues & Troubleshooting](#15-common-issues--troubleshooting)
16. [What "Simulated" Means](#16-what-simulated-means)

---

## 1. What This Project Is

SwapX is a **portfolio/educational project** that demonstrates full-stack web development, API design, database usage, and authentication — using a crypto exchange as the domain.

**It is NOT a real exchange.** No real money is involved. No blockchain transactions happen. It's a simulation: you get a starting portfolio of fake tokens, trade them using real market prices pulled from CoinGecko, and the balances are stored in Redis.

### Why a crypto exchange?

It lets you show off multiple hard skills simultaneously in one coherent product:
- **Backend API design** (REST endpoints for swap, order, portfolio, prices)
- **Database usage** (Redis hash maps, sorted sets, lists)
- **Authentication** (OAuth2.0 with Google)
- **Real-time data** (CoinGecko price API with caching)
- **Frontend state management** (React hooks in Next.js App Router)
- **Type safety** (TypeScript throughout)
- **Web3 knowledge** (DEX AMM mechanics, CEX order book, trading fee models)

---

## 2. Feature Breakdown

### 🔄 DEX Swap Tab
- Select any of 30+ tokens in the "From" and "To" dropdowns
- Enter an amount — the "To" estimate updates instantly using live prices
- Click Swap → your balances are updated in Redis atomically
- Shows: exchange rate, price impact, slippage tolerance, minimum received
- Fee: **0.3%** (standard Uniswap-style AMM fee)
- The `⇅` button flips the pair

### 🏛️ CEX Trade Tab
- Select a base token (e.g. ETH) and a quote stablecoin (e.g. USDT)
- Choose Market or Limit order type
- Choose Buy or Sell side
- Live order book (simulated bids/asks around the real market price)
- Quick-select grid of all tokens with live prices
- Fee: **0.1%** (standard CEX maker/taker fee)
- Limit orders execute at your price if the market is within 0.2% of it

### 📊 Portfolio Tab
- Total portfolio value in USD
- Number of assets held, transaction count, stablecoin value
- Full holdings table with: balance, price, USD value, allocation % bar
- Sorted by USD value (largest holdings first)

### 📋 History Tab
- Last 100 transactions (swaps + buy/sell orders)
- Shows: type, from amount, to amount, execution price, fee, timestamp
- Color-coded: BUY (green), SELL (red), SWAP (blue)

### 🏠 Landing Page
- Live price ticker for top 16 tokens (seamlessly animated loop)
- Hero with gradient and glow effects
- Feature cards explaining CEX, DEX, Portfolio
- Google sign-in button → redirects to dashboard

### Starting Portfolio
Every new user gets this on first sign-in:
```
USDT:  10,000
USDC:   5,000
ETH:       0.5
BTC:       0.005
SOL:      10
BNB:       1
```
Total ≈ $15,000–$20,000 depending on prices.

---

## 3. Tech Stack — Why Each Tool Was Chosen

| Tool | Version | Why |
|---|---|---|
| **Next.js** | 14.2 | App Router provides both frontend and backend (API routes) in one repo. Server Components fetch data server-side for fast initial load. No need for a separate Express server. |
| **TypeScript** | 5 | Type safety catches bugs at compile time. Resume mentions TypeScript. Interfaces shared between frontend and backend (e.g. `TxRecord`, `Token`). |
| **NextAuth.js** | 4.x | Industry-standard auth library for Next.js. Handles the entire OAuth flow (redirects, CSRF, session cookies) with just a config file. Google provider is plug-and-play. |
| **Upstash Redis** | 1.34 | Upstash provides Redis-as-a-service with a **REST API** — critical for serverless deployments (Render, Vercel) where you can't keep a persistent TCP connection open. Free tier: 10,000 commands/day, 256MB. |
| **Tailwind CSS** | 3.4 | Utility-first CSS lets you build custom UIs quickly without fighting a component library. No separate CSS files. Dark-theme-friendly. |
| **CoinGecko API** | Free | Public price API — no API key required for basic requests. Returns live USD prices for all tokens by their `geckoId`. |
| **Recharts** | (dep, available) | Installed for potential chart features (price history charts). Not yet used in the main dashboard but available for extension. |
| **Lucide React** | (dep, available) | Icon library, installed for future icon use. |

### Why NOT a real DEX (e.g. Uniswap contracts)?
- A real DEX requires: MetaMask/wallet, gas fees, a deployed smart contract, and a blockchain connection. This project is a portfolio demo — the goal is to show the engineering, not pay gas fees.
- The math models used (AMM fee, slippage, order fill) are accurate to how real exchanges work.

---

## 4. Project Structure — Every File Explained

```
swapx-dex/
│
├── package.json              ← NPM deps and scripts (build, dev, start, lint)
├── next.config.js            ← Next.js config (allows Google/CoinGecko image hosts)
├── tailwind.config.ts        ← Tailwind theme (custom colors, fonts, animations)
├── postcss.config.js         ← Required for Tailwind to process CSS
├── tsconfig.json             ← TypeScript config (strict mode, path aliases @/*)
├── vercel.json               ← Vercel deployment config
├── render.yaml               ← Render.com one-click deploy config
├── .env.example              ← Template listing all required env vars
├── .gitignore                ← Excludes node_modules, .next, .env.local
│
├── lib/                      ← Shared utilities used by both frontend and API
│   ├── tokens.ts             ← Token list (30+), TOKEN_MAP lookup, initial balances
│   ├── redis.ts              ← Redis client, key helpers, portfolio/tx read/write fns
│   ├── auth.ts               ← NextAuth config (Google provider, session callback, seed portfolio)
│   └── prices.ts             ← CoinGecko fetch + Redis price cache (60s TTL)
│
├── app/                      ← Next.js App Router root
│   ├── globals.css           ← Base styles, Google Fonts import, custom classes
│   ├── layout.tsx            ← Root HTML layout — wraps everything with <Providers>
│   ├── providers.tsx         ← Client component: wraps app with NextAuth SessionProvider
│   ├── page.tsx              ← Landing page (server component) — redirects to /dashboard if logged in
│   ├── landing-client.tsx    ← Client component for landing UI (sign-in button, ticker, hero)
│   │
│   ├── dashboard/
│   │   ├── layout.tsx        ← Auth guard — redirects to / if not logged in
│   │   ├── page.tsx          ← Dashboard server component — fetches portfolio/prices/history server-side
│   │   └── dashboard-client.tsx ← Main trading UI (DEX swap, CEX order, portfolio, history tabs)
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts  ← NextAuth handler (catches ALL /api/auth/* routes)
│       ├── prices/
│       │   └── route.ts      ← GET /api/prices → returns all token prices (from cache or CoinGecko)
│       ├── portfolio/
│       │   └── route.ts      ← GET /api/portfolio → returns portfolio, history, prices, totalUsd
│       ├── swap/
│       │   └── route.ts      ← POST /api/swap → DEX swap (deducts from, credits to, logs tx)
│       └── order/
│           └── route.ts      ← POST /api/order → CEX buy/sell (market or limit)
```

### Why Server Components vs Client Components?

**Server components** (`page.tsx`, `layout.tsx`) run on the server at request time. They can:
- Read env vars directly
- Fetch from Redis without exposing keys to the browser
- Call `getServerSession()` to check auth
- Pass data to client components as props

**Client components** (`dashboard-client.tsx`, `landing-client.tsx`, marked with `'use client'`) run in the browser. They:
- Manage interactive state (which tab is active, form inputs)
- Handle button clicks, form submissions
- Call API routes (`fetch('/api/swap', ...)`) from the browser
- Cannot use `getServerSession()` directly

This split is the core Next.js App Router pattern: **server fetches data, client handles interaction**.

---

## 5. How the Data Model Works (Redis)

Redis is a key-value store used here as both a **database** (portfolios, transaction history) and a **cache** (token prices).

### Key Schema

```
user:{userId}:portfolio    → Hash
  BTC  → "0.005"
  ETH  → "0.5"
  USDT → "9500.234"
  ...

user:{userId}:swaps        → List (newest first, capped at 100)
  [0] → '{"id":"uuid","type":"swap","fromSym":"USDT","toSym":"ETH","fromAmt":500,"toAmt":0.1234,...}'
  [1] → '{"id":"uuid","type":"buy",...}'
  ...

user:{userId}:registered   → String (Unix timestamp of first sign-in)

prices:cache               → Hash
  BTC  → "67234.50"
  ETH  → "3421.18"
  SOL  → "145.23"
  ...

prices:ts                  → String (Unix timestamp of last CoinGecko fetch)
```

### Why Redis Hashes for Portfolios?

A Redis **Hash** (like `user:abc:portfolio`) lets you:
- `HGET` — get one token balance: `redis.hget('user:abc:portfolio', 'ETH')`
- `HSET` — update one token: `redis.hset('user:abc:portfolio', { ETH: '0.6' })`
- `HGETALL` — get all balances: `redis.hgetall('user:abc:portfolio')`
- `HDEL` — remove a zero-balance token: `redis.hdel('user:abc:portfolio', 'ETH')`

This is O(1) per operation and very memory-efficient.

### Why Redis Lists for History?

A Redis **List** lets you:
- `LPUSH` — prepend (newest at index 0)
- `LTRIM` — cap the list at 100 items (auto-purge oldest)
- `LRANGE 0 49` — get latest 50 transactions

### Why Redis for Price Cache?

CoinGecko's free API has rate limits (~30 requests/minute). Caching prices in Redis means:
- All users share one cached response
- Cache is refreshed at most once per 60 seconds (regardless of how many users are online)
- If CoinGecko is down, the last known prices are still returned

---

## 6. API Reference — Every Endpoint

### `GET /api/prices`
Returns current prices for all 30+ tokens.

**Response:**
```json
{
  "prices": {
    "BTC": 67234.5,
    "ETH": 3421.18,
    "SOL": 145.23,
    "USDT": 1.0,
    ...
  }
}
```

**Logic:** Checks Redis for cached prices. If cache is < 60s old, returns it. Otherwise fetches from CoinGecko, updates cache, returns fresh data.

---

### `GET /api/portfolio`
Returns the logged-in user's full portfolio data. **Requires auth.**

**Response:**
```json
{
  "portfolio": { "ETH": 0.5, "USDT": 9500.0, "BTC": 0.005 },
  "history": [
    { "id": "...", "type": "swap", "fromSym": "USDT", "toSym": "ETH",
      "fromAmt": 500, "toAmt": 0.1462, "price": 3421.18, "fee": 1.502, "ts": 1718627400000 }
  ],
  "prices": { "BTC": 67234.5, "ETH": 3421.18, ... },
  "totalUsd": 15230.44
}
```

---

### `POST /api/swap`
Execute a DEX swap. **Requires auth.**

**Request body:**
```json
{
  "fromSym": "USDT",
  "toSym": "ETH",
  "fromAmt": 500
}
```

**Response (success):**
```json
{
  "success": true,
  "toAmt": 0.14608,
  "fee": 1.5,
  "rate": 0.000292
}
```

**Response (error):**
```json
{ "error": "Insufficient USDT balance" }
```

**Possible errors:** Unknown token, same token, invalid amount, insufficient balance, price unavailable.

---

### `POST /api/order`
Execute a CEX buy or sell order. **Requires auth.**

**Request body (buy):**
```json
{
  "side": "buy",
  "baseSym": "ETH",
  "quoteSym": "USDT",
  "amount": 500,
  "orderType": "market"
}
```
`amount` for a buy = USD amount to spend (in quote token units).

**Request body (sell):**
```json
{
  "side": "sell",
  "baseSym": "ETH",
  "quoteSym": "USDT",
  "amount": 0.1,
  "orderType": "limit",
  "limitPrice": 3500
}
```
`amount` for a sell = number of base tokens to sell.

**Response (buy success):**
```json
{ "success": true, "baseAmt": 0.14579, "fee": 0.5, "execPrice": 3428.12 }
```

**Response (sell success):**
```json
{ "success": true, "quoteAmt": 342.47, "fee": 0.3425, "execPrice": 3424.7 }
```

---

### `GET/POST /api/auth/[...nextauth]`
Handled entirely by NextAuth.js. Routes:
- `GET /api/auth/signin` — renders sign-in page (redirects to landing page `/`)
- `GET /api/auth/signout` — signs user out
- `GET /api/auth/callback/google` — Google OAuth callback (after Google redirects back)
- `GET /api/auth/session` — returns current session (used by frontend via `useSession()`)
- `GET /api/auth/csrf` — CSRF token

You never call these directly — NextAuth and the `signIn()`/`signOut()` functions handle it.

---

## 7. How Pricing Works

### CoinGecko API
We call the CoinGecko "simple price" endpoint:
```
GET https://api.coingecko.com/api/v3/simple/price
  ?ids=bitcoin,ethereum,solana,binancecoin,...
  &vs_currencies=usd
```

This returns:
```json
{
  "bitcoin": { "usd": 67234.5 },
  "ethereum": { "usd": 3421.18 },
  ...
}
```

Each token in `lib/tokens.ts` has a `geckoId` field that maps to CoinGecko's ID format.

### Cache Flow
```
Request comes in
       ↓
Check Redis: prices:ts (last fetch timestamp)
       ↓
 Is it < 60s ago?
  ├── YES → return prices:cache (hash)
  └── NO  → fetch from CoinGecko
              ↓
           Save to prices:cache (hash)
           Save timestamp to prices:ts
              ↓
           Return fresh prices
```

If CoinGecko is down, the last cached prices are returned (graceful degradation).

### Stablecoins
USDT, USDC, DAI, PYUSD are priced at $1.00 by default. CoinGecko does return actual prices (usually $0.999–$1.001), which we use.

---

## 8. How DEX Swaps Work (Math)

This models a **constant-product AMM** (like Uniswap v2) using current oracle prices.

### Swap Calculation

```
fromUsd  = fromAmt × price[fromSym]         // value of tokens being sold
fee      = fromUsd × 0.003                   // 0.3% fee in USD
netUsd   = fromUsd - fee                     // value after fee
slippage = 1 - random(0, 0.001)             // simulates tiny slippage (0–0.1%)
toAmt    = (netUsd / price[toSym]) × slippage
```

**Example:** Swap 500 USDT → ETH at ETH = $3,421.18
```
fromUsd  = 500 × 1.00        = $500.00
fee      = 500 × 0.003       = $1.50
netUsd   = 500 - 1.50        = $498.50
slippage ≈ 0.9995 (tiny)
toAmt    = (498.50 / 3421.18) × 0.9995 = 0.14577 ETH
```

### Minimum Received
The UI shows "Min received" = `toAmt × 0.995` (0.5% slippage tolerance). If the actual received is below this, the transaction would revert in a real DEX.

### Price Impact
Shown as `< 0.1%` — for small trades on a large pool this is realistic. Large trades would have higher price impact but we don't model pool depth.

---

## 9. How CEX Orders Work (Math)

### Market Buy
```
spendUsd   = amount (USD you want to spend)
spendQuote = spendUsd / price[quoteSym]     // convert to quote token (e.g. USDT)
fee        = spendUsd × 0.001               // 0.1% fee
baseAmt    = (spendUsd - fee) / execPrice   // base tokens you receive
```

**Example:** Buy ETH with 500 USDT at $3,421.18
```
spendQuote = 500 / 1.00    = 500 USDT
fee        = 500 × 0.001   = $0.50
baseAmt    = (500 - 0.50) / 3421.18 = 0.14579 ETH
```

### Market Sell
```
sellAmt    = amount (base tokens to sell)
totalUsd   = sellAmt × execPrice
fee        = totalUsd × 0.001
receiveUsd = totalUsd - fee
quoteAmt   = receiveUsd / price[quoteSym]
```

**Example:** Sell 0.1 ETH at $3,421.18
```
totalUsd   = 0.1 × 3421.18 = $342.118
fee        = 342.118 × 0.001 = $0.342
receiveUsd = 342.118 - 0.342 = $341.776
quoteAmt   = 341.776 / 1.00 = 341.776 USDT
```

### Limit Orders
For limit buy: if your limit price ≥ market price × 0.998 (within 0.2%), order fills at `min(limitPrice, marketPrice × 1.002)`.
For limit sell: if your limit price ≤ market price × 1.002, order fills at `max(limitPrice, marketPrice × 0.998)`.
This simulates partial fill behavior — in reality you'd queue the order if the price isn't met.

---

## 10. Authentication Flow (Google OAuth)

```
User clicks "Sign in with Google"
          ↓
signIn('google') → NextAuth redirects to Google
          ↓
User approves on Google's OAuth screen
          ↓
Google redirects to /api/auth/callback/google
          ↓
NextAuth receives the authorization code
          ↓
NextAuth exchanges code for access token + user info (email, name, picture)
          ↓
signIn() callback in lib/auth.ts fires:
  - Gets user.id (Google sub / unique identifier)
  - Checks Redis: does user:id:portfolio exist?
  - If NO → seeds initial portfolio (USDT, ETH, BTC, SOL, BNB)
  - If YES → skip (returning user)
          ↓
Session cookie set in browser
          ↓
User redirected to /dashboard
          ↓
Every API call: getServerSession(authOptions) reads the cookie
  - Returns session with user.id
  - Used as Redis key prefix: user:{id}:portfolio
```

### Security Notes
- `NEXTAUTH_SECRET` is used to sign/encrypt the JWT session cookie. Never expose it.
- `user.id` = Google's internal user sub (a long number string). It's stable (same user, same ID forever) and used as the Redis key.
- No passwords stored anywhere — authentication is fully delegated to Google.

---

## 11. Token List (30+)

| Symbol | Name | Type | CoinGecko ID |
|---|---|---|---|
| BTC | Bitcoin | crypto | bitcoin |
| ETH | Ethereum | crypto | ethereum |
| SOL | Solana | crypto | solana |
| BNB | BNB | crypto | binancecoin |
| XRP | XRP | crypto | ripple |
| ADA | Cardano | crypto | cardano |
| AVAX | Avalanche | crypto | avalanche-2 |
| DOGE | Dogecoin | crypto | dogecoin |
| DOT | Polkadot | crypto | polkadot |
| MATIC | Polygon | crypto | matic-network |
| ATOM | Cosmos | crypto | cosmos |
| NEAR | NEAR Protocol | crypto | near |
| SUI | Sui | crypto | sui |
| APT | Aptos | crypto | aptos |
| LTC | Litecoin | crypto | litecoin |
| HBAR | Hedera | crypto | hedera-hashgraph |
| OP | Optimism | crypto (L2) | optimism |
| ARB | Arbitrum | crypto (L2) | arbitrum |
| INJ | Injective | crypto | injective-protocol |
| LINK | Chainlink | defi | chainlink |
| UNI | Uniswap | defi | uniswap |
| AAVE | Aave | defi | aave |
| MKR | Maker | defi | maker |
| COMP | Compound | defi | compound-governance-token |
| LDO | Lido DAO | defi | lido-dao |
| CRV | Curve DAO | defi | curve-dao-token |
| JTO | Jito | defi (Solana) | jito-governance-token |
| USDT | Tether USD | stable | tether |
| USDC | USD Coin | stable | usd-coin |
| DAI | Dai | stable | dai |
| PYUSD | PayPal USD | stable | paypal-usd |

### To Add More Tokens
1. Open `lib/tokens.ts`
2. Add an entry to the `TOKENS` array following the same pattern
3. Find the `geckoId` by searching at coingecko.com/en/coins/all and copying the URL slug

---

## 12. Setup Guide — Local Development

### Prerequisites
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- A Google account
- A free Upstash account

### Step 1: Clone and install
```bash
git clone https://github.com/expediator/swapx-dex.git
cd swapx-dex
npm install
```

### Step 2: Set up Upstash Redis (free)
1. Go to [console.upstash.com](https://console.upstash.com)
2. Click **Create Database**
3. Name: `swapx` | Type: **Redis** | Region: pick closest to you | Plan: **Free**
4. Once created, click the database → **REST API** tab
5. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Set up Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google+ API** (or "People API")
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:3000/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

### Step 4: Create .env.local
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret
NEXTAUTH_SECRET=any_random_32+_character_string_here
NEXTAUTH_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=https://your-db-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
```

For `NEXTAUTH_SECRET`, you can use any random string. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 5: Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in with Google, and you're in.

---

## 13. Deployment — Free on Render.com

Render.com offers a free web service tier that runs Node.js apps. Cold starts take ~30 seconds after 15 minutes of inactivity (free tier limitation). Uptime otherwise is reliable.

### Step-by-step

**1. Sign up at [render.com](https://render.com)** — use GitHub login for easiest setup.

**2. Connect your repo:**
- Dashboard → **New** → **Web Service**
- Connect your GitHub account → select `expediator/swapx-dex`
- Render will auto-detect `render.yaml` and pre-fill settings

**3. Configure (if not auto-detected):**
- Name: `swapx-dex`
- Runtime: **Node**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Plan: **Free**

**4. Add environment variables** (in Render dashboard → Environment tab):
```
GOOGLE_CLIENT_ID         = your_client_id
GOOGLE_CLIENT_SECRET     = your_client_secret
NEXTAUTH_SECRET          = your_secret
NEXTAUTH_URL             = https://swapx-dex.onrender.com   ← your Render URL
UPSTASH_REDIS_REST_URL   = https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN = your_upstash_token
```

> ⚠️ **Important:** `NEXTAUTH_URL` must be your actual Render URL (`https://swapx-dex.onrender.com`). Get it from Render dashboard after first deploy.

**5. Update Google OAuth redirect URI:**
- Go back to Google Cloud Console → Credentials
- Edit your OAuth client
- Add: `https://swapx-dex.onrender.com/api/auth/callback/google`
- Save

**6. Redeploy** (Render does this automatically on every push to main).

### Free tier limitations on Render
- Spins down after 15 minutes of no traffic (first request after idle takes ~30s to warm up)
- 512MB RAM, shared CPU
- 750 hours/month free (enough for always-on if you have traffic)

---

## 14. Environment Variables Reference

| Variable | Required | Where to get it | Example value |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | ✅ Yes | Google Cloud Console → Credentials | `123456-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | Same as above | `GOCSPX-abcdef123456` |
| `NEXTAUTH_SECRET` | ✅ Yes | Generate randomly | `Kj3mN9pQ2rS8tU5vW1xY4zA6bC7dE0fG` |
| `NEXTAUTH_URL` | ✅ Yes | Your app's public URL | `https://swapx-dex.onrender.com` |
| `UPSTASH_REDIS_REST_URL` | ✅ Yes | Upstash console → REST API | `https://notable-ox-12345.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | Same Upstash database | `AXxxxxxxxxxxxxxx==` |

---

## 15. Common Issues & Troubleshooting

### "Error: NEXTAUTH_URL is not set"
Set `NEXTAUTH_URL` in your `.env.local` or deployment env vars.

### "OAuthCallbackError: redirect_uri_mismatch"
The redirect URI in Google Cloud Console doesn't match your app's URL.
- For local: add `http://localhost:3000/api/auth/callback/google`
- For production: add `https://your-domain.com/api/auth/callback/google`
Go to Google Cloud Console → Credentials → Edit your OAuth client → add the correct URI.

### "Error connecting to Redis"
- Check that `UPSTASH_REDIS_REST_URL` starts with `https://` (not `redis://`)
- Upstash Redis requires the REST URL, not the TCP connection string
- Check that the token is correct and hasn't expired

### "Price unavailable" when swapping
CoinGecko free tier has rate limits. This happens if the price cache expired and CoinGecko is rate-limiting you. Wait 60 seconds and try again. If it persists, check [status.coingecko.com](https://status.coingecko.com).

### Render cold start (first request is slow)
The free Render tier spins down after 15 minutes of inactivity. The first request after idle wakes it up — this takes ~25-35 seconds. Subsequent requests are fast. Upgrade to a paid tier ($7/month) to avoid this.

### TypeScript build errors
Run `npm run lint` to see type errors. The most common issue is calling `getServerSession()` in a client component — it only works in server components and API routes.

### User portfolio not seeding correctly
If you're not getting the starting portfolio, check if the `signIn` callback in `lib/auth.ts` is firing. Add `console.log` to debug. The portfolio is only seeded once (when `user:{id}:portfolio` doesn't exist in Redis).

---

## 16. What "Simulated" Means

**What IS real:**
- Token prices (fetched live from CoinGecko every 60 seconds)
- Your portfolio balances (stored per-user in Redis)
- Transaction history (stored per-user in Redis)
- The fee math and swap math (models actual DEX/CEX mechanics)
- Authentication (real Google accounts)

**What is NOT real:**
- The exchange itself (no smart contracts, no blockchain)
- Trading other users' funds (no shared liquidity pool)
- The order book (bids/asks are randomly generated around the real price)
- 24h price changes (randomly simulated in the market table)
- Recent trades in CEX view (randomly generated)
- Limit order queueing (fills immediately if price is close enough)

**This project is for educational and portfolio demonstration purposes only. Do not use it to make real financial decisions.**

---

## License

MIT — free to use, modify, and deploy.

Built by [Akshansh Yadav](https://expediator.github.io/resume/) · [GitHub](https://github.com/expediator)
