# Contract Tracker

Track contracts from the Mapping File (Google Sheet): dashboard, filters, monthly quota progress, and CSV export.

## Stack

- **Next.js 14** (App Router) + **Tailwind CSS**
- **Supabase** (PostgreSQL) for contracts and progress logs
- **shadcn/ui** + **Papa Parse** (CSV import)

---

## Quick start (run locally)

1. **Install dependencies** (from the project folder):

   ```bash
   cd "Contract Management - mapping"
   npm install
   ```

2. **Create a Supabase project**

   - Go to [supabase.com](https://supabase.com) and sign in (or create an account).
   - Click **New project**, pick an org, name the project, set a database password, and create.
   - Wait for the project to be ready.

3. **Run the database migration**

   - In the Supabase dashboard, open **SQL Editor**.
   - Copy the full contents of `supabase/migrations/001_contracts_and_progress.sql` from this repo.
   - Paste into the editor and click **Run**.

4. **Get your API keys**

   - In Supabase, go to **Project Settings** (gear icon) → **API**.
   - Note: **Project URL**, **anon public** key, and **service_role** key (keep the service_role key secret).

5. **Configure environment variables**

   - In the project folder, copy the example env file:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and replace the placeholders with your values:
     - `NEXT_PUBLIC_SUPABASE_URL` = Project URL from step 4
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
     - `SUPABASE_SERVICE_ROLE_KEY` = service_role key

6. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Use **Import** to upload your Mapping File as CSV, then **Dashboard**, **Contracts**, and **Reports**.

---

## Deploy on Vercel

1. **Push the project to GitHub**

   - Create a new repo on GitHub (if you don’t have one for this project).
   - In your project folder:
     ```bash
     git init
     git add .
     git commit -m "Contract Tracker app"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```

2. **Create a Vercel project**

   - Go to [vercel.com](https://vercel.com) and sign in (use “Continue with GitHub” if you use GitHub).
   - Click **Add New…** → **Project**.
   - Import the GitHub repo that contains this app (e.g. “Contract Management - mapping” or the repo name you used).
   - Leave **Framework Preset** as Next.js and **Root Directory** as `.` (or the folder that has `package.json`). Click **Deploy** (you can deploy once without env vars to confirm the repo is linked).

3. **Add environment variables on Vercel**

   - In the Vercel dashboard, open your project → **Settings** → **Environment Variables**.
   - Add these (use the same values as in your `.env.local`):

   | Name                         | Value                    |
   | --------------------------- | ------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`  | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |

   - Save. Then go to **Deployments**, open the **⋯** on the latest deployment, and choose **Redeploy** so the new env vars are used.

4. **Use your live app**

   - After the redeploy, open the deployment URL (e.g. `https://your-project.vercel.app`). That’s your live Contract Tracker. Future pushes to `main` will trigger new deployments automatically.

## Data model

- **contracts**: One row per contract–retailer (from Mapping File). Key: `(deal_id, retailer_simple)`.
- **progress_logs**: Monthly response counts per contract–retailer. Team updates via the contract detail page.

CSV import expects the Mapping File columns: A = Deal ID, B = Start, C = End, D = Category, E = Country, G = Suggested store list, H = Retailer, I = Retailer Simple, J = Monthly quota, K = Notes, L = Months of collection.
