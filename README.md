# Max Facility Rink Reports (MFO)

Ice rink facility management SaaS platform built with Next.js, Supabase, and Shadcn/ui.

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL, Auth, RLS, Realtime, Storage)
- **UI:** Shadcn/ui, Tailwind CSS, Lucide icons
- **Forms:** React Hook Form + Zod
- **State:** Zustand

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for full architecture documentation.

## Agent Specs

Development specifications are in [`docs/agents/`](./docs/agents/).
