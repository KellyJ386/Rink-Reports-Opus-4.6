# Agent 00: Project Scaffold

## Objective
Initialize the MFO project with Next.js, Supabase, Shadcn/ui, and Tailwind CSS. Establish the folder structure, brand configuration, and development environment.

## Prerequisites
- Node.js 18+
- Supabase CLI installed
- Vercel CLI installed (optional for local dev)

## Tasks

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest mfo --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mfo
```

### 2. Install Dependencies
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# State Management
npm install zustand

# UI
npx shadcn@latest init
# When prompted: style=default, baseColor=slate, css variables=yes

# Install Shadcn components (all commonly needed)
npx shadcn@latest add button card checkbox dialog dropdown-menu form input label select separator sheet tabs textarea toast badge calendar popover command table avatar switch toggle-group scroll-area tooltip alert alert-dialog

# Date handling
npm install date-fns

# PDF/Excel export (for Phase 13)
npm install jspdf jspdf-autotable xlsx

# Email
npm install resend

# Dev tools
npm install -D @types/node prettier
```

### 3. Configure Tailwind with Brand Colors
Update `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#002244',
          dark: '#001122',
          light: '#003366',
        },
        'action-green': {
          DEFAULT: '#69BE28',
          hover: '#5AA822',
        },
        'wolf-grey': {
          DEFAULT: '#A5ACAF',
          light: '#D1D5D8',
          dark: '#6B7280',
        },
        'alert-yellow': '#FFB800',
        'alert-red': '#D32F2F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 4. Configure globals.css
Replace `src/styles/globals.css` with brand-aware Tailwind config:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 210 100% 13%; /* Navy */
    --primary: 210 100% 13%; /* Navy #002244 */
    --primary-foreground: 0 0% 100%;
    --secondary: 207 5% 67%; /* Wolf Grey */
    --accent: 96 65% 45%; /* Action Green */
    --destructive: 0 72% 51%; /* Alert Red */
    --warning: 42 100% 50%; /* Alert Yellow */
    --radius: 0.5rem;
  }
  .dark {
    --background: 210 100% 7%; /* Navy Dark #001122 */
    --foreground: 210 20% 90%;
    --primary: 96 65% 45%; /* Action Green stays accent in dark */
    --primary-foreground: 210 100% 7%;
  }
}

/* Ensure minimum touch targets */
@layer utilities {
  .touch-target {
    @apply min-h-[48px] min-w-[48px];
  }
}
```

### 5. Create Folder Structure
Create all directories as specified in CLAUDE.md:
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── daily-reports/page.tsx
│   │   ├── ice-depth/page.tsx
│   │   ├── ice-operations/page.tsx
│   │   ├── scheduling/page.tsx
│   │   ├── incidents/page.tsx
│   │   ├── refrigeration/page.tsx
│   │   ├── air-quality/page.tsx
│   │   ├── admin/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           (populated by shadcn)
│   ├── layout/
│   ├── forms/
│   ├── diagrams/
│   ├── scheduling/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   └── middleware.ts
│   ├── bluetooth/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── constants/
│       └── brand.ts
└── styles/
    └── globals.css
```

### 6. Create Supabase Client Files

**`src/lib/supabase/client.ts`** — Browser client:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — Server client (for Server Components and Server Actions):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component read-only */ }
        },
      },
    }
  )
}
```

**`src/lib/supabase/admin.ts`** — Service role client (server-side only, bypasses RLS):
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

**`src/lib/supabase/middleware.ts`** — Auth middleware:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/forgot-password') &&
      !request.nextUrl.pathname.startsWith('/reset-password')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### 7. Create Brand Constants
**`src/lib/constants/brand.ts`**:
```typescript
export const BRAND = {
  name: 'Max Facility Rink Reports',
  shortName: 'Max Facility',
  colors: {
    navy: '#002244',
    navyDark: '#001122',
    navyLight: '#003366',
    actionGreen: '#69BE28',
    actionGreenHover: '#5AA822',
    wolfGrey: '#A5ACAF',
    wolfGreyLight: '#D1D5D8',
    wolfGreyDark: '#6B7280',
    alertYellow: '#FFB800',
    alertRed: '#D32F2F',
  },
} as const;

export const MODULE_NAMES = {
  DAILY_REPORTS: 'Daily Reports',
  ICE_DEPTH: 'Ice Depth Management',
  ICE_OPERATIONS: 'Ice Operations',
  SCHEDULING: 'Employee Scheduling',
  INCIDENTS: 'Incident Reporting',
  REFRIGERATION: 'Refrigeration Plant Logs',
  AIR_QUALITY: 'Air Quality Monitoring',
  ADMIN: 'Admin Control Center',
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  FACILITY_ADMIN: 'facility_admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  STAFF: 'staff',
  READ_ONLY: 'read_only',
} as const;
```

### 8. Create .env.local Template
**`.env.local.example`**:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 9. Initialize Supabase Locally
```bash
npx supabase init
npx supabase start
```

### 10. Create Root Middleware
**`src/middleware.ts`**:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 11. Create Placeholder Pages
Create minimal placeholder `page.tsx` for every route with just:
```typescript
export default function PageName() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Module Name</h1><p>Coming soon...</p></div>
}
```

## Completion Criteria
- [ ] `npm run dev` starts without errors
- [ ] All routes return placeholder pages
- [ ] Tailwind brand colors render correctly
- [ ] Shadcn components import and render
- [ ] Supabase local instance running
- [ ] Middleware redirects unauthenticated users to /login
- [ ] Folder structure matches CLAUDE.md specification
- [ ] Dark mode class toggle works on `<html>` element
