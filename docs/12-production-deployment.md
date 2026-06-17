# 12 — Production Deployment Guide

Complete, from-scratch instructions for deploying Proper Rent to production. No prior knowledge assumed. Every term is explained.

---

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Prerequisites — accounts to create](#2-prerequisites--accounts-to-create)
3. [How DNS works (plain English)](#3-how-dns-works-plain-english)
4. [Phase 1 — Supabase setup](#4-phase-1--supabase-setup)
5. [Phase 2 — OpenRouter setup](#5-phase-2--openrouter-setup)
6. [Phase 3 — Resend setup](#6-phase-3--resend-setup)
7. [Phase 4 — Railway (backend)](#7-phase-4--railway-backend)
8. [Phase 5 — Vercel (frontend)](#8-phase-5--vercel-frontend)
9. [Phase 6 — Namecheap DNS](#9-phase-6--namecheap-dns)
10. [Phase 7 — Database migrations](#10-phase-7--database-migrations)
11. [Phase 8 — Verification checklist](#11-phase-8--verification-checklist)
12. [Environment variable reference](#12-environment-variable-reference)
13. [How CI/CD works](#13-how-cicd-works)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Architecture Overview

```
User's browser
      │
      ▼
properrent.co.uk          ← Vercel serves the Next.js frontend
      │
      │  API calls (HTTPS)
      ▼
api.properrent.co.uk      ← Railway runs the FastAPI backend
      │
      ├──► Supabase        ← PostgreSQL database + admin auth
      ├──► OpenRouter      ← AI chat (routes to LLM models)
      └──► Resend          ← Transactional email
```

**What each piece does:**

| Service | Role | Plan |
|---|---|---|
| **Vercel** | Hosts the Next.js 15 frontend. Auto-deploys when you push to `main`. | Free |
| **Railway** | Runs the FastAPI Python backend 24/7. Handles all business logic. | Hobby ($5/mo) |
| **Supabase** | PostgreSQL database + admin authentication (JWT). | Free |
| **OpenRouter** | Routes AI requests to LLM models (DeepSeek, GPT-4o-mini, etc.). | Pay-per-token |
| **Resend** | Sends transactional emails from `hello@properrent.co.uk`. | Free tier |
| **Namecheap** | Holds the domain `properrent.co.uk`. Controls where traffic goes. | Paid domain |
| **GitHub** | Stores code. Triggers Vercel and Railway deploys on push to `main`. | Free |

---

## 2. Prerequisites — Accounts to Create

Before starting, create accounts at these services. All are free to sign up:

| Service | URL |
|---|---|
| GitHub | github.com |
| Supabase | supabase.com |
| Railway | railway.app |
| Vercel | vercel.com |
| OpenRouter | openrouter.ai |
| Resend | resend.com |
| Namecheap | namecheap.com (domain purchase required) |

---

## 3. How DNS Works (Plain English)

DNS (Domain Name System) is the internet's phonebook. When someone types `properrent.co.uk` into a browser, DNS translates that into an IP address (a number like `76.76.21.21`) so the browser knows which server to connect to.

**Namecheap** is where you buy and manage your domain. Under "Advanced DNS" you add **records** that tell the world where to send traffic.

### DNS Record Types Explained

#### A Record — "This domain points to this IP address"

```
Type: A
Host: @          ← @ means the root domain (properrent.co.uk itself)
Value: 76.76.21.21
```

An A record maps a domain name directly to an IPv4 address. `76.76.21.21` is Vercel's global IP — when someone visits `properrent.co.uk`, traffic goes to Vercel.

You never need to know Vercel's IP in advance — Vercel tells you what to put here when you add your domain in their dashboard.

#### CNAME Record — "This subdomain is an alias for another domain"

```
Type: CNAME
Host: api        ← means api.properrent.co.uk
Value: 1h5ovhg6.up.railway.app
```

A CNAME (Canonical Name) says "for this subdomain, go wherever *that other domain* points." Instead of a fixed IP, you point to Railway's dynamic hostname. Railway can then update their servers without you needing to change your DNS.

```
Type: CNAME
Host: www        ← means www.properrent.co.uk
Value: cname.vercel-dns.com
```

Same idea — `www.properrent.co.uk` follows wherever Vercel's `cname.vercel-dns.com` points.

#### TXT Record — "Prove you own this domain"

```
Type: TXT
Host: _railway-verify.api
Value: railway-verify=5ead8f270959ef2dd...
```

TXT records store arbitrary text. Services like Railway and Resend use them to verify you actually own the domain before they issue SSL certificates. You add the text they give you; their system checks for it.

#### URL Redirect Record — AVOID

Namecheap offers a "URL Redirect Record" that forwards traffic to another URL. **Do not use this alongside an A record on the same host.** It creates a hidden `192.64.119.200` A record that conflicts with Vercel's IP and breaks HTTPS. Delete any URL redirect on `@` — use Vercel's built-in `www` redirect instead.

#### MX Record — Email routing

MX records tell the internet where to deliver email for your domain. Resend gives you an MX record so their servers can handle sending from `hello@properrent.co.uk`.

### TTL (Time to Live)

TTL is how long other servers cache your DNS record (in seconds). Namecheap's "Automatic" setting uses 1800 seconds (30 minutes). This means after you change a DNS record, it can take up to 30 minutes to fully propagate worldwide. During propagation some users may still see old settings — this is normal.

---

## 4. Phase 1 — Supabase Setup

### 4.1 Create a project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `proper-rent`
3. Choose a strong database password — save it somewhere safe, you'll need it in `DATABASE_URL`
4. Region: **EU West** (Ireland) — closest to your users in the UK

### 4.2 Understanding Supabase credentials

Once the project is created, go to **Settings → API** in your Supabase dashboard.

You will see several keys. Here is what each one does:

---

**`SUPABASE_URL`**

```
https://ipxbbjphirgejszyjqmb.supabase.co
```

The base URL of your Supabase project. Used by both the frontend and backend to know *which* Supabase project to talk to. Safe to share publicly — it's just an address, not a secret.

---

**`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (also called `anon` key)

```
sb_publishable_7gOIPM6sHY5GdlaofMg9Lw_qcNvIOYL
```

A browser-safe public key. Used by the Next.js frontend to interact with Supabase (e.g. admin login). It is intentionally safe to expose in client-side code — Supabase's Row Level Security (RLS) controls what this key can actually read or write. In this project, RLS is locked down so the anon key can't read any data tables directly.

---

**`SUPABASE_SERVICE_ROLE_KEY`**

```
sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← get from Supabase → Settings → API → service_role key
```

A **server-side secret**. This key bypasses Row Level Security entirely — it can read and write everything in the database. Only used by the FastAPI backend on Railway. **Never expose this in frontend code or commit it to git.**

---

**`SUPABASE_JWT_SECRET`**

```
BYH2rOgKX13QiaOff...==
```

The secret key Supabase uses to sign JWT (JSON Web Token) authentication tokens. When an admin logs in, Supabase issues a JWT signed with this secret. The FastAPI backend uses this same secret to verify that the JWT is genuine and hasn't been tampered with. **Keep this private — anyone with it can forge admin sessions.**

---

**`DATABASE_URL`** (from Settings → Database)

```
postgresql+asyncpg://postgres.ipxbbjphirgejszyjqmb:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

The full database connection string. Breaking it down:

| Part | Meaning |
|---|---|
| `postgresql+asyncpg://` | Use PostgreSQL with the async asyncpg driver |
| `postgres.ipxbbjphirgejszyjqmb` | Username (project-specific format for the pooler) |
| `:[PASSWORD]` | Your database password from project creation |
| `@aws-0-eu-west-1.pooler.supabase.com` | Supabase's session pooler hostname |
| `:5432` | Port 5432 = session pooler (supports all PostgreSQL features) |
| `/postgres` | Database name |

**Why the session pooler (port 5432) and not the direct connection?**
Supabase's free tier allows ~20 direct connections. Railway keeps a persistent process running that holds connections open. Using the session pooler (`pooler.supabase.com:5432`) avoids hitting that limit. Port 6543 (transaction pooler) does NOT support prepared statements used by SQLAlchemy — don't use it.

### 4.3 Configure auth redirect URLs

Go to **Authentication → URL Configuration** in Supabase:

- **Site URL**: `https://properrent.co.uk`
- **Redirect URLs** (add both):
  - `https://properrent.co.uk/**`
  - `https://www.properrent.co.uk/**`

This tells Supabase which URLs are allowed after an admin login. Without this, the auth redirect fails with an error.

---

## 5. Phase 2 — OpenRouter Setup

OpenRouter is a gateway that lets you switch between AI models (DeepSeek, GPT-4o-mini, Claude, etc.) by changing a single environment variable.

1. Sign in at [openrouter.ai](https://openrouter.ai)
2. Go to **Keys → Create Key**
3. Copy the key — this is `OPENROUTER_API_KEY`

**Choosing a model (`LLM_MODEL`):**

| Model | Cost | Use case |
|---|---|---|
| `openai/gpt-4o-mini` | Very cheap | Testing, early users |
| `deepseek/deepseek-chat` | Very cheap, high quality | Production (DeepSeek V4 Flash) |
| `anthropic/claude-3-5-haiku` | Cheap | High-quality fallback |

The `LLM_MODEL` env var on Railway can be changed at any time without redeploying — the backend reads it on every request. Changing it triggers a Railway restart automatically.

---

## 6. Phase 3 — Resend Setup

Resend sends emails from `hello@properrent.co.uk`.

### 6.1 Get an API key

1. Sign in at [resend.com](https://resend.com)
2. Go to **API Keys → Create API Key**
3. Copy the key — this is `RESEND_API_KEY`

### 6.2 Verify your domain

1. In Resend → **Domains → Add Domain** → enter `properrent.co.uk`
2. Resend gives you three DNS records to add to Namecheap (see Phase 6)
3. After adding them in Namecheap, return to Resend and click **Verify**

Until the domain is verified, Resend will not send emails. The app still starts and runs — email failures are logged but non-fatal.

---

## 7. Phase 4 — Railway (Backend)

Railway hosts the FastAPI backend. It builds from the `backend/` directory of the GitHub repo.

### 7.1 Create the project

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Select `moalimir/Proper-Rent`
3. When asked for **Root Directory**, enter `backend`
4. Railway detects Nixpacks automatically from `backend/nixpacks.toml`

### 7.2 How Railway builds and runs the backend

Railway uses **Nixpacks** — a build system that detects your language (Python 3.12) and installs dependencies from `requirements.txt` automatically. You don't write a Dockerfile.

The `backend/railway.toml` controls deployment behaviour:

```toml
[build]
builder = "nixpacks"          # Use Nixpacks to build

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/v1/health"   # Railway calls this to check if app is alive
healthcheckTimeout = 30              # Seconds to wait for health check
restartPolicyType = "on_failure"     # Auto-restart if it crashes
restartPolicyMaxRetries = 3
```

`$PORT` is a variable Railway injects automatically — it assigns an internal port and your app must listen on it.

### 7.3 Set environment variables

In Railway → your service → **Variables** tab, set these:

```
APP_ENV=production
DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[from Phase 1.2]
SUPABASE_JWT_SECRET=[from Phase 1.2]
OPENROUTER_API_KEY=[from Phase 2]
LLM_MODEL=openai/gpt-4o-mini
RESEND_API_KEY=[from Phase 3]
RESEND_FROM_EMAIL=Proper Rent <hello@properrent.co.uk>
ADMIN_ALERT_EMAIL=your@email.com
CORS_ALLOWED_ORIGINS=["https://properrent.co.uk","https://www.properrent.co.uk"]
CONSENT_VERSION=2026-06-13
PUBLIC_RATE_LIMIT_ENABLED=true
```

**Why `APP_ENV=production` matters:**

`backend/app/config.py` has a validator that runs at startup when `APP_ENV` is `production` or `staging`. It checks that all required secrets are non-empty. If any are missing, the app refuses to start — this prevents running in production with placeholder credentials.

**Why `CORS_ALLOWED_ORIGINS` must be exact JSON:**

CORS (Cross-Origin Resource Sharing) is a browser security feature. Your frontend is on `properrent.co.uk` and the backend is on `api.properrent.co.uk` — these are different origins. The browser will block the request unless the backend explicitly says which origins are allowed. The value must be a valid JSON array with exact domain strings including `https://`, no trailing slash.

### 7.4 Add the custom domain

1. Railway → your service → **Settings → Networking → Custom Domain**
2. Add `api.properrent.co.uk` — **no port number**
3. Railway gives you a CNAME target (e.g. `1h5ovhg6.up.railway.app`) — copy it
4. Railway also gives you a TXT record for domain verification — copy both

> Railway does not allow port numbers in custom domains. It handles routing to `$PORT` internally.

After adding DNS records (Phase 6), Railway automatically issues an SSL certificate via Let's Encrypt. This can take 5–10 minutes after DNS propagates.

### 7.5 Automatic deploys

Railway is connected to your GitHub repo. Every push to `main` triggers a new Railway build and deploy. Zero downtime — Railway runs the new version alongside the old until the healthcheck passes, then cuts over.

---

## 8. Phase 5 — Vercel (Frontend)

Vercel hosts the Next.js 15 frontend.

### 8.1 Import the project

1. Go to [vercel.com](https://vercel.com) → **Add New Project → Import Git Repository**
2. Select `moalimir/Proper-Rent`
3. **Root Directory**: `frontend`
4. Framework Preset: Next.js (auto-detected)

### 8.2 Set environment variables

In Vercel → your project → **Settings → Environment Variables**, add all of these for the **Production** environment:

```
NEXT_PUBLIC_API_BASE_URL=https://api.properrent.co.uk/api/v1
NEXT_PUBLIC_SITE_URL=https://properrent.co.uk
NEXT_PUBLIC_CONSENT_VERSION=2026-06-13
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[from Phase 1.2]
```

**Why `NEXT_PUBLIC_*` variables are different from regular ones:**

Next.js builds a static bundle at deploy time. Variables prefixed `NEXT_PUBLIC_` are baked into that bundle during the build — they become part of the JavaScript the browser downloads. Regular (non-prefixed) variables are only available server-side.

This means:
- `NEXT_PUBLIC_API_BASE_URL` is in the browser bundle — the browser reads it to know where to send API calls
- If you change a `NEXT_PUBLIC_*` variable, you **must redeploy** for the change to take effect
- Never put secrets (passwords, service role keys) in `NEXT_PUBLIC_*` variables — they end up in the browser

### 8.3 Add custom domains

In Vercel → your project → **Settings → Domains**:

1. Add `properrent.co.uk` — Vercel gives you an A record IP (e.g. `76.76.21.21`)
2. Add `www.properrent.co.uk` — Vercel gives you a CNAME target (`cname.vercel-dns.com`)

After DNS propagates, Vercel automatically issues SSL certificates for both. Both domains serve the same frontend.

### 8.4 Automatic deploys

Every push to `main` triggers a Vercel rebuild. `NEXT_PUBLIC_*` variables are baked in fresh at each build.

---

## 9. Phase 6 — Namecheap DNS

Go to [namecheap.com](https://namecheap.com) → Domain List → `properrent.co.uk` → **Manage → Advanced DNS**.

Delete any default parking records and add exactly these:

| Type | Host | Value | Notes |
|---|---|---|---|
| A Record | `@` | `76.76.21.21` | Apex domain → Vercel |
| CNAME Record | `www` | `cname.vercel-dns.com` | www → Vercel |
| CNAME Record | `api` | `1h5ovhg6.up.railway.app` | API subdomain → Railway |
| TXT Record | `_railway-verify.api` | `railway-verify=5ead8f...` | Railway domain ownership proof |

If you set up Resend email, add these too (Resend gives you the exact values):

| Type | Host | Value | Notes |
|---|---|---|---|
| TXT Record | `@` | `v=spf1 include:amazonses.com ~all` | SPF — authorises Resend to send email from your domain |
| TXT Record | `resend._domainkey` | `p=MIGfMA0GCSq...` | DKIM — cryptographically signs outgoing email |
| MX Record | `@` | `feedback-smtp.eu-west-1.amazonses.com` | Routes bounces back to Resend |

**Critical: Do not add a URL Redirect Record on `@`**

Namecheap's "URL Redirect Record" creates a hidden A record pointing to `192.64.119.200` (Namecheap's redirect server). This conflicts with the Vercel A record on the same host and breaks HTTPS for half of all visitors. Use only the A record + CNAME records above.

### Verifying DNS propagation

After saving changes, DNS takes up to 30 minutes to propagate globally. To check:

```bash
# Check apex domain (should return only 76.76.21.21)
dig A properrent.co.uk +short @1.1.1.1

# Check www (should return cname.vercel-dns.com)
dig CNAME www.properrent.co.uk +short @1.1.1.1

# Check API subdomain (should return your Railway CNAME target)
dig CNAME api.properrent.co.uk +short @1.1.1.1
```

Using `@1.1.1.1` (Cloudflare) bypasses your local DNS cache and gives the freshest result.

---

## 10. Phase 7 — Database Migrations

The database schema (tables, indexes, constraints) must be applied to Supabase before the backend can serve real data. This uses **Alembic**, a Python migration tool.

### What are migrations?

Migrations are versioned SQL scripts stored in `backend/alembic/versions/`. Each file describes a change to the database schema. Alembic tracks which migrations have been applied and runs only the new ones.

Current migrations:
- `0001_initial_schema.py` — creates all tables (`renters`, `landlords`, `agents`, `conversations`, `properties`, `transactions`) with Row Level Security enabled
- `0002_unique_renter_email.py` — adds a case-insensitive unique index on `renters.email`

### Running migrations

Do this once, locally, pointing at the Supabase production database:

```bash
# From the repo root
cd backend

# Activate the virtual environment
source .venv/bin/activate      # macOS/Linux
# or: .venv\Scripts\activate   # Windows

# Export production credentials temporarily
export DATABASE_URL="postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
export APP_ENV=staging   # "staging" triggers the validator but doesn't need all secrets

# Apply all pending migrations
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 0001_initial_schema
INFO  [alembic.runtime.migration] Running upgrade 0001_initial_schema -> 0002_unique_renter_email
```

### Verify in Supabase

Go to Supabase → **Table Editor** — you should see all tables listed.

### Future migrations

When the schema needs to change, create a new migration file:

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "describe the change"
# Review the generated file in alembic/versions/
alembic upgrade head   # apply locally first, then run against production
```

Never edit existing migration files — create new ones.

---

## 11. Phase 8 — Verification Checklist

Run these checks in order after completing all phases:

### Backend health

```bash
curl https://api.properrent.co.uk/api/v1/health
# Expected: {"status":"ok","version":"0.1.0"}
```

### CORS check (confirms frontend can call backend)

```bash
curl -H "Origin: https://properrent.co.uk" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.properrent.co.uk/api/v1/chat
# Expected: 200 with header "Access-Control-Allow-Origin: https://properrent.co.uk"
```

### Frontend

- Visit `https://properrent.co.uk` — marketing homepage should load
- Visit `https://www.properrent.co.uk` — should load identically
- Open browser DevTools → Network tab — no failed requests to `localhost:8000`

### Admin login

- Visit `https://properrent.co.uk/admin/login`
- Log in with Supabase admin credentials
- Should redirect to `/admin` dashboard

### Check Railway logs

```bash
cd backend
railway logs --lines 50
# Look for: "Application startup complete."
# No errors about missing settings
```

---

## 12. Environment Variable Reference

### Backend (set in Railway)

| Variable | Required | Description |
|---|---|---|
| `APP_ENV` | Yes | Must be `production`. Enables startup validator and production behaviour. |
| `DATABASE_URL` | Yes | Full Supabase session pooler connection string (asyncpg format). |
| `SUPABASE_URL` | Yes | Your Supabase project URL. Used to construct API calls to Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin key. Bypasses RLS. Backend only. Never expose. |
| `SUPABASE_JWT_SECRET` | Yes | Signs/verifies JWT tokens for admin authentication. Keep private. |
| `OPENROUTER_API_KEY` | Yes | API key for the OpenRouter LLM gateway. |
| `LLM_MODEL` | No | Which model to use. Default: `openai/gpt-4o-mini`. Changeable without redeploy. |
| `RESEND_API_KEY` | Yes | API key for Resend email service. |
| `RESEND_FROM_EMAIL` | No | Sender name + address. Default: `Proper Rent <hello@properrent.co.uk>`. |
| `ADMIN_ALERT_EMAIL` | Yes | Email address for operational alerts. |
| `CORS_ALLOWED_ORIGINS` | No | JSON array of allowed frontend origins. Default includes localhost. |
| `CONSENT_VERSION` | No | Version string for GDPR consent tracking. Default: `2026-06-13`. |
| `PUBLIC_RATE_LIMIT_ENABLED` | No | Enable/disable rate limiting. Default: `true`. |

### Frontend (set in Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Full URL to the backend API. Must be `https://api.properrent.co.uk/api/v1`. Baked into the build. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL. Use `https://www.properrent.co.uk` because the apex domain redirects to `www`. Used for metadata and og:url tags. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. Used by the browser Supabase client for admin auth. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Public anon key. Safe to expose in browser code. |
| `NEXT_PUBLIC_CONSENT_VERSION` | No | Must match `CONSENT_VERSION` on the backend. |

---

## 13. How CI/CD Works

Every push to `main` on GitHub runs the full pipeline automatically.

### GitHub Actions (`.github/workflows/ci.yml`)

Runs on every push and pull request. Three parallel jobs:

**Backend job:**
1. Spins up a temporary PostgreSQL database in the CI runner
2. Installs Python 3.12 dependencies from `requirements-dev.txt`
3. Runs `ruff check` (linting) and `ruff format --check` (formatting)
4. Runs `mypy` (type checking)
5. Runs `pytest` (unit + integration tests against the temp database)
6. Runs `pip-audit` (checks for known security vulnerabilities in dependencies)

**Frontend job:**
1. Installs Node.js 22 and npm dependencies
2. Runs `npm run lint` (ESLint)
3. Runs `npm run typecheck` (TypeScript)
4. Runs `npm run build` (Next.js production build — catches build-time errors)
5. Runs `npm audit --audit-level=high` (security audit)

**Secret scan job:**
- Runs `gitleaks` to scan the entire git history for accidentally committed secrets

If any job fails, the push is blocked from deploying. Vercel and Railway will still deploy if CI is not set as a required check — configure branch protection rules on GitHub if you want to enforce this.

### Auto-deploy flow after CI passes

```
git push origin main
        │
        ├──► GitHub Actions CI runs (2–3 minutes)
        │
        ├──► Vercel detects push → builds frontend → deploys if build succeeds
        │
        └──► Railway detects push → builds backend → deploys if healthcheck passes
```

---

## 14. Troubleshooting

### "Missing required deployment settings" in Railway logs

`APP_ENV=production` triggers the startup validator in `backend/app/config.py`. It checks these 7 variables are non-empty: `database_url`, `openrouter_api_key`, `supabase_url`, `supabase_service_role_key`, `supabase_jwt_secret`, `resend_api_key`, `admin_alert_email`.

Fix: Go to Railway → Variables and fill in the missing ones. Railway will auto-redeploy.

### Frontend shows "Network Error" or calls `localhost:8000`

`NEXT_PUBLIC_API_BASE_URL` is either missing or set incorrectly in Vercel. Because it's baked at build time, you must set it in Vercel → Settings → Environment Variables and then **trigger a redeploy** (Vercel dashboard → Deployments → Redeploy).

### HTTPS timeout on `properrent.co.uk`

Most likely cause: conflicting DNS records. Check:
```bash
dig A properrent.co.uk +short @1.1.1.1
```
Should return only `76.76.21.21`. If you see `192.64.119.200`, you have a URL Redirect Record in Namecheap — delete it.

### SSL certificate error on `api.properrent.co.uk`

Railway's cert is still being issued. After adding DNS records, wait 5–10 minutes then check:
```bash
cd backend
railway domain status api.properrent.co.uk --json
```
Look for `"status": "CERTIFICATE_STATUS_TYPE_VALID"`.

### Admin login redirects to blank page or fails

Supabase auth redirect URLs are not configured. Go to Supabase → Authentication → URL Configuration and add:
- Site URL: `https://properrent.co.uk`
- Redirect URLs: `https://properrent.co.uk/**` and `https://www.properrent.co.uk/**`

### Database tables don't exist (500 errors on form submissions)

Migrations haven't been run. Follow Phase 7. Verify in Supabase → Table Editor that all tables are present.

### Railway deploy succeeds but app crashes on first request

The `DATABASE_URL` is using the transaction pooler (port 6543) instead of the session pooler (port 5432). SQLAlchemy with asyncpg uses prepared statements which the transaction pooler doesn't support. Change the port in the `DATABASE_URL` variable on Railway from `6543` to `5432`.

### CORS error in browser DevTools

The `CORS_ALLOWED_ORIGINS` variable on Railway doesn't match the frontend origin exactly. Check:
- It must be valid JSON: `["https://properrent.co.uk","https://www.properrent.co.uk"]`
- No trailing slashes on the URLs
- Must include `https://` — HTTP origins are rejected in production

---

## Current production values (for reference)

| Setting | Value |
|---|---|
| Supabase project | `ipxbbjphirgejszyjqmb` |
| Supabase region | EU West (Ireland) |
| Railway project | `Proper-Rent` |
| Railway region | Europe West 4 (Netherlands) |
| Railway internal domain | `proper-rent-production.up.railway.app` |
| Railway API CNAME target | `1h5ovhg6.up.railway.app` |
| Vercel team | `lead-agent-s-projects` |
| Vercel Anycast IP | `76.76.21.21` |
| Vercel www CNAME | `cname.vercel-dns.com` |
| Domain registrar | Namecheap |
| Domain | `properrent.co.uk` |
