# Intentional Ministries Accountability

A group-based weekly accountability PWA. See `Intentional Ministries Accountability App - Blueprint.md` in the repo root for the full product spec this was built from.

Stack: Next.js (App Router, TypeScript) + Tailwind CSS + Supabase (Postgres, Auth, RLS). Deployed on Vercel.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need a `.env.local` (copy `.env.local.example`) with your Supabase project's URL and anon/publishable key.

## Database

The full schema — tables, RLS policies, week/deadline logic, triggers, and RPCs — lives in `supabase/migrations/0001_init.sql`. It's meant to be run once, in full, against a fresh Supabase project via the SQL Editor (Supabase dashboard → SQL Editor → New query → paste the file → Run).

## Deploying for the first time

1. **Create the Supabase project** at [supabase.com](https://supabase.com) → New project. Once it's provisioned, go to **Project Settings → API** and copy the **Project URL** and **anon/publishable key**.
2. **Apply the schema**: paste `supabase/migrations/0001_init.sql` into the Supabase SQL Editor and run it.
3. **Set local env vars**: copy `.env.local.example` to `.env.local` and fill in the two values from step 1. Confirm `npm run dev` works end-to-end (sign up, create a group, submit a check-in).
4. **Push to GitHub**: create a new repo on GitHub, then from this directory:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
5. **Import into Vercel**: [vercel.com/new](https://vercel.com/new) → import the GitHub repo. Under **Environment Variables**, add the same two Supabase values from step 1 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Deploy.
6. **Domain**: by default you'll get a free `*.vercel.app` URL. To use a custom subdomain off intentionalministries.com, add it under the Vercel project's **Domains** tab and follow the DNS instructions it gives you.

## Future schema changes

Add new files as `supabase/migrations/0002_*.sql`, `0003_*.sql`, etc., and run each one in the SQL Editor when you're ready to apply it — same as the first one.

## Known placeholders worth revisiting

- The app icon (`public/icons/`, `src/app/icon.png`, `src/app/apple-icon.png`) is a generic placeholder — swap in real Intentional Ministries branding before a public launch.
- "Confirm email" is currently **off** in Supabase Auth settings (Authentication → Sign In / Providers → Email) to make testing easier. Turn it back on before real users sign up, or leave it off if you'd rather keep signup frictionless — either is a reasonable call.
