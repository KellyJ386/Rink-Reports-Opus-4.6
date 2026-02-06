'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'facility_admin' | 'manager' | 'supervisor' | 'staff' | 'read_only'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  facility_id: string | null
  phone: string | null
  is_active: boolean
  last_active_at: string | null
}

export interface FacilityInfo {
  id: string
  name: string
  time_zone: string
  logo_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [facility, setFacility] = useState<FacilityInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data as UserProfile)

      if (data.facility_id) {
        const { data: facilityData } = await supabase
          .from('facilities')
          .select('id, name, time_zone, logo_url')
          .eq('id', data.facility_id)
          .single()

        if (facilityData) {
          setFacility(facilityData as FacilityInfo)
        }
      }
    }
  }, [supabase])

  useEffect(() => {
    const getSession = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      }

      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
          setFacility(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const role = profile?.role ?? null

  return {
    user,
    profile,
    facility,
    loading,
    role,
    isAdmin: role === 'facility_admin' || role === 'super_admin',
    isManager: role === 'facility_admin' || role === 'super_admin' || role === 'manager',
    isSupervisor: role === 'facility_admin' || role === 'super_admin' || role === 'manager' || role === 'supervisor',
    isStaff: role !== 'read_only' && role !== null,
    isReadOnly: role === 'read_only',
    isSuperAdmin: role === 'super_admin',
  }
}
