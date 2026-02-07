# Deploying to Vercel

## Prerequisites

1. You need a production Supabase project
2. A Vercel account (free tier works fine)
3. GitHub repository access

## Step 1: Create a Production Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: mfo-production (or your preferred name)
   - **Database Password**: Generate a secure password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

## Step 2: Run Migrations on Production Database

Once your Supabase project is ready:

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Push migrations to production
npx supabase db push
```

## Step 3: Get Your Production Credentials

From your Supabase dashboard (Project Settings > API):
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

## Step 4: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `mfo`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-production-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=your-vercel-domain
   ```

6. Click "Deploy"

### Option B: Via CLI (Alternative)

```bash
cd mfo
vercel login
vercel --prod
```

Follow prompts and add environment variables when asked.

## Step 5: Verify Deployment

1. Visit your Vercel URL
2. Test the login page
3. Check database connectivity

## Important Notes

- The `mfo/` directory is your deployable application
- Vercel will automatically detect it's a Next.js app
- Your migrations are already prepared in `supabase/migrations/`
- All routes and authentication are configured

## Troubleshooting

If you get build errors:
- Ensure all environment variables are set in Vercel
- Check that the root directory is set to `mfo`
- Verify your Supabase project is active

Need help? The deployment logs in Vercel will show any issues.
