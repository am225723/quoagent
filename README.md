# QuoAgent (OpenPhone + Perplexity + Supabase) — Vercel-ready

## Setup
1) Run `supabase/schema.sql` in Supabase SQL editor.
2) Create `.env.local` from `.env.example`.
3) `npm install && npm run dev`

## Push to your GitHub repo
From this folder:
```bash
git init
git remote add origin https://github.com/am225723/quoagent.git
git checkout -b main
git add .
git commit -m "QuoAgent MVP"
git push -u origin main
```


## Optional: blocklist responses
Set these environment variables to prevent drafting replies:
- RESPONSE_BLOCKLIST_PHONES (comma-separated E.164)
- RESPONSE_BLOCKLIST_PHRASES (comma-separated phrases)

Also run the updated SQL in `supabase/schema.sql` to create the `suppressions` table and new columns.
