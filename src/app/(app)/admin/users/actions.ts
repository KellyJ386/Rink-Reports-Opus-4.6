'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['facility_admin', 'manager', 'supervisor', 'staff', 'read_only']),
})

export async function inviteUser(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get the inviting user's profile to determine facility_id
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('facility_id, role')
    .eq('id', user.id)
    .single()

  if (!inviterProfile) return { success: false, error: 'Profile not found' }

  // Only facility_admin can invite users
  if (inviterProfile.role !== 'facility_admin' && inviterProfile.role !== 'super_admin') {
    return { success: false, error: 'Insufficient permissions' }
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      full_name: parsed.data.fullName,
      role: parsed.data.role,
      facility_id: inviterProfile.facility_id,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deactivateUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}
