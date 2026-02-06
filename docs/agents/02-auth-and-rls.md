# Agent 02: Authentication & Row-Level Security

## Objective
Implement Supabase Auth flows (login, logout, forgot/reset password), create RLS policies on ALL tables, and build the auth UI pages.

## Prerequisites
- Agent 00 (scaffold) and Agent 01 (schema) completed

---

## Tasks

### 1. RLS Policies Migration
**File:** `supabase/migrations/20260101000010_create_rls_policies.sql`

**Design Principles:**
- Enable RLS on EVERY table
- All users can only see data for their own `facility_id`
- `super_admin` role handled server-side via service role client (bypasses RLS)
- Write permissions cascade by role hierarchy: `facility_admin` > `manager` > `supervisor` > `staff`
- `read_only` users can SELECT only

```sql
-- Enable RLS on all tables
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_depth_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_depth_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_reading_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_report_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_depth_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blade_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edging_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_reading_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_reading_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_alerts ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's facility_id
CREATE OR REPLACE FUNCTION get_user_facility_id()
RETURNS UUID AS $$
  SELECT facility_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user has admin-level access
CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('facility_admin', 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user has manager-level access (manager+)
CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('facility_admin', 'super_admin', 'manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user has supervisor-level access (supervisor+)
CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('facility_admin', 'super_admin', 'manager', 'supervisor');
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Now create policies for each table. The pattern is:
- **SELECT**: all authenticated users within facility
- **INSERT**: role-appropriate users within facility
- **UPDATE**: role-appropriate users within facility
- **DELETE**: admin only within facility

Create policies for ALL tables following this pattern. Key examples:

```sql
-- PROFILES: Users see profiles in their facility
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (is_admin_role() AND facility_id = get_user_facility_id());

-- OPERATIONAL DATA: Staff can insert, see own facility
CREATE POLICY ice_makes_select ON ice_makes
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY ice_makes_insert ON ice_makes
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id()
    AND get_user_role() NOT IN ('read_only')
  );

-- ADMIN CONFIG: Only facility_admin can modify
CREATE POLICY module_settings_select ON module_settings
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY module_settings_modify ON module_settings
  FOR ALL USING (is_admin_role() AND facility_id = get_user_facility_id());

-- NOTIFICATIONS: Users see only their own
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- SHIFTS: All facility members can view, managers+ can modify
CREATE POLICY shifts_select ON shifts
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY shifts_insert ON shifts
  FOR INSERT WITH CHECK (
    facility_id = get_user_facility_id()
    AND is_manager_or_above()
  );

-- AVAILABILITY: employees manage their own
CREATE POLICY availability_select ON employee_availability
  FOR SELECT USING (facility_id = get_user_facility_id());

CREATE POLICY availability_insert_own ON employee_availability
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY availability_update_own ON employee_availability
  FOR UPDATE USING (employee_id = auth.uid());
```

**IMPORTANT:** Create policies for EVERY table listed above. Follow the same SELECT (facility), INSERT (role check), UPDATE (role or ownership check), DELETE (admin only) pattern.

### 2. Auth Trigger — Auto-create Profile
**File:** `supabase/migrations/20260101000011_auth_trigger.sql`

```sql
-- When a new user signs up or is invited, auto-create their profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, facility_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff'),
    (NEW.raw_user_meta_data->>'facility_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 3. Build Auth UI Pages

**Login Page** (`src/app/(auth)/login/page.tsx`):
- Max Facility logo centered above form
- Email input, Password input
- "Remember me" checkbox
- "Forgot password?" link
- Login button (Navy background, full width)
- Error display for invalid credentials
- Redirect to /dashboard on success

**Forgot Password Page** (`src/app/(auth)/forgot-password/page.tsx`):
- Logo centered
- Email input
- "Send Reset Link" button
- Success message: "Check your email for a reset link"
- Back to login link

**Reset Password Page** (`src/app/(auth)/reset-password/page.tsx`):
- Logo centered
- New password input
- Confirm password input
- Submit button
- Redirect to login on success

**Loading/Splash Screen** (`src/app/loading.tsx`):
- Full-screen Navy background
- Centered Max Facility logo
- Subtle loading animation (pulse or spinner)

### 4. Auth Server Actions
**File:** `src/app/(auth)/actions.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password` }
  )
  if (error) return { error: error.message }
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/login')
}
```

### 5. User Invitation Flow (Admin)
Create a server action for admins to invite users:

```typescript
// src/app/(app)/admin/users/actions.ts
'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function inviteUser(data: {
  email: string;
  fullName: string;
  role: string;
  facilityId: string;
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.inviteUserByEmail(data.email, {
    data: {
      full_name: data.fullName,
      role: data.role,
      facility_id: data.facilityId,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

### 6. Auth Hook — Session Context
**File:** `src/lib/hooks/useAuth.ts`

Create a hook/context that provides:
- Current user profile (with role and facility_id)
- Loading state
- isAdmin, isManager, isSupervisor helper booleans
- Facility info (name, settings)

### 7. Route Protection
Update the middleware (`src/middleware.ts`) to:
- Redirect unauthenticated users to /login
- Redirect authenticated users away from /login to /dashboard
- Allow /forgot-password and /reset-password without auth

## Completion Criteria
- [ ] All RLS policies created and tested
- [ ] Login flow works end-to-end
- [ ] Forgot/reset password flow works
- [ ] New user invitation creates profile via trigger
- [ ] Users can only see their own facility's data
- [ ] read_only users cannot insert/update/delete
- [ ] staff users can submit forms but not access admin
- [ ] facility_admin can access admin features
- [ ] Auth pages match brand guidelines (Navy, logo, Action Green CTA)
- [ ] Dark mode works on auth pages
