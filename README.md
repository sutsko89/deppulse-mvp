# DepPulse MVP

Dependency vulnerability scanner for GitHub repositories.

## Stack
- **Next.js 15** (App Router)
- **Supabase** (Auth + PostgreSQL)
- **GitHub App** (OAuth + Issues notifications)
- **OSV.dev** (Vulnerability database, free)
- **OpenRouter** (AI analysis)
- **Vercel** (Hosting)

## Week 1 Status
- [x] Project structure initialized
- [x] Database schema normalized (RLS, github_issue_notifications, indexes)
- [x] Supabase SSR auth configured
- [x] GitHub OAuth via Supabase
- [x] Middleware (protected routes)
- [x] Database types generated
- [x] Core lib modules: supabase client/server, OSV service, GitHub service
- [x] Scan engine (parser → OSV → persist)
- [x] GitHub Issues notification service
- [x] GitHub Actions: CI workflow

## Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

## Required Secrets (GitHub Actions)

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App PEM private key |
| `GITHUB_APP_INSTALLATION_ID` | Installation ID |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
