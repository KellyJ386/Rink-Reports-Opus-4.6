'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// Helper: verify current user is an admin
// ============================================
async function getAdminContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null, error: 'Not authenticated' as const }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.facility_id) {
    return { supabase, user, profile: null, error: 'No facility assigned' as const }
  }

  if (!['facility_admin', 'super_admin'].includes(profile.role)) {
    return { supabase, user, profile: null, error: 'Unauthorized' as const }
  }

  return { supabase, user, profile, error: null }
}

// ============================================
// Invite User
// ============================================
const InviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['facility_admin', 'manager', 'supervisor', 'staff', 'read_only']),
})

export async function inviteUser(data: z.infer<typeof InviteUserSchema>) {
  const { profile, error: authError } = await getAdminContext()
  if (authError) return { success: false, error: authError }

  const parsed = InviteUserSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
        facility_id: profile!.facility_id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    }
  )

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

// ============================================
// Update User Role
// ============================================
const UpdateUserRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['facility_admin', 'manager', 'supervisor', 'staff', 'read_only']),
})

export async function updateUserRole(userId: string, role: string) {
  const { supabase, profile, error: authError } = await getAdminContext()
  if (authError) return { success: false, error: authError }

  const parsed = UpdateUserRoleSchema.safeParse({ userId, role })
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the target user belongs to the same facility
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', parsed.data.userId)
    .single()

  if (!targetProfile || targetProfile.facility_id !== profile!.facility_id) {
    return { success: false, error: 'User not found in your facility' }
  }

  // Prevent demoting a super_admin unless current user is also super_admin
  if (targetProfile.role === 'super_admin' && profile!.role !== 'super_admin') {
    return { success: false, error: 'Cannot modify a super admin' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      role: parsed.data.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.userId)
    .eq('facility_id', profile!.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

// ============================================
// Toggle User Active Status
// ============================================
const ToggleUserActiveSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  isActive: z.boolean(),
})

export async function toggleUserActive(userId: string, isActive: boolean) {
  const { supabase, profile, error: authError } = await getAdminContext()
  if (authError) return { success: false, error: authError }

  const parsed = ToggleUserActiveSchema.safeParse({ userId, isActive })
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  // Verify the target user belongs to the same facility
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', parsed.data.userId)
    .single()

  if (!targetProfile || targetProfile.facility_id !== profile!.facility_id) {
    return { success: false, error: 'User not found in your facility' }
  }

  // Prevent deactivating a super_admin
  if (targetProfile.role === 'super_admin') {
    return { success: false, error: 'Cannot deactivate a super admin' }
  }

  // Prevent admin from deactivating themselves
  const { user } = await (await createClient()).auth.getUser().then((r) => r.data)
  if (user && parsed.data.userId === user.id && !parsed.data.isActive) {
    return { success: false, error: 'Cannot deactivate your own account' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.userId)
    .eq('facility_id', profile!.facility_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}
