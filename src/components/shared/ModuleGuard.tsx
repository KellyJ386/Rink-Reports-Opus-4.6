import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface ModuleGuardProps {
  module: string
  children: React.ReactNode
}

export default async function ModuleGuard({ module, children }: ModuleGuardProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, facility_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.facility_id) {
    redirect('/dashboard')
  }

  // Super admins bypass module checks
  if (profile.role === 'super_admin') {
    return <>{children}</>
  }

  const { data: moduleSetting } = await supabase
    .from('module_settings')
    .select('is_enabled, allowed_roles')
    .eq('facility_id', profile.facility_id)
    .eq('module_id', module)
    .single()

  if (!moduleSetting || !moduleSetting.is_enabled) {
    redirect('/dashboard')
  }

  // Check if the user's role is in the allowed_roles array
  if (
    moduleSetting.allowed_roles &&
    Array.isArray(moduleSetting.allowed_roles) &&
    !moduleSetting.allowed_roles.includes(profile.role)
  ) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
