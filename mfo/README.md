# Max Facility Rink Reports (MFO)

Ice rink management and reporting system built with Next.js 16 and Supabase.

## Features

- 🏒 **Daily Reports**: Customizable checklists and operational logs
- 📏 **Ice Depth Management**: Visual measurement tracking with Bluetooth support
- ⛸️ **Ice Operations**: Zamboni logs, circle checks, blade changes, edging
- 👥 **Employee Scheduling**: Shift management, availability, swap requests
- 📋 **Incident Reporting**: Accident and incident tracking with body diagrams
- ❄️ **Refrigeration Monitoring**: Equipment readings with threshold alerts
- 💨 **Air Quality**: CO, CO2, humidity, and temperature monitoring
- 🔐 **Admin Control Center**: User management, facility configuration

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI Components**: Shadcn/ui (planned)
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Exports**: jsPDF, xlsx

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase CLI or Docker

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Rink-Reports-Opus-4.6/mfo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local Supabase** (applies migrations automatically)
   ```bash
   npx supabase start
   ```

   Copy the `API URL` and `anon key` from the output.

4. **Update environment variables**

   Copy `.env.local.example` to `.env.local` and update with your Supabase keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

## Project Structure

```
mfo/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Authentication pages
│   │   └── (app)/        # Main application pages
│   ├── components/       # React components
│   │   └── ui/           # Shadcn UI components
│   ├── lib/
│   │   ├── supabase/     # Supabase client configurations
│   │   ├── constants/    # Brand colors, roles, module names
│   │   └── utils.ts      # Utility functions
│   └── middleware.ts     # Auth middleware
├── supabase/
│   ├── migrations/       # 6 database migration files
│   └── config.toml       # Supabase configuration
└── public/               # Static assets
```

## Database Schema

The database includes 40+ tables organized into:
- **Core tables**: Facilities, profiles, rinks, machines, equipment
- **Configuration**: Module settings, daily report tabs, shift types
- **Operational data**: Ice depth readings, shifts, incident reports
- **Notifications**: Alerts, preferences, active notifications

All migrations are in `supabase/migrations/` and auto-apply on `supabase start`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- Setting up production Supabase
- Deploying to Vercel
- Environment variable configuration

Quick deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `mfo`
4. Add environment variables
5. Deploy!

## Brand Colors

- **Navy**: `#002244` - Primary brand color
- **Action Green**: `#69BE28` - CTAs and success states
- **Wolf Grey**: `#A5ACAF` - Secondary elements
- **Alert Yellow**: `#FFB800` - Warnings
- **Alert Red**: `#D32F2F` - Errors and alerts

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Authentication

The app uses Supabase Auth with middleware that:
- Automatically redirects unauthenticated users to `/login`
- Preserves session across page loads
- Supports password reset flows

## Contributing

This is a private facility management system. For internal development only.

## License

Proprietary - All rights reserved
