"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USER_ROLES } from '@/lib/constants/brand'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  role: string
  facility_id: string
  email: string
  avatar_url?: string | null
}

interface Facility {
  id: string
  name: string
  slug: string
  timezone: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  facility: Facility | null
  loading: boolean
  isAdmin: boolean
  isManager: boolean
  isSupervisor: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  facility: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  isSupervisor: false,
})

function hasRole(role: string | undefined, ...allowedRoles: string[]): boolean {
  if (!role) return false
  return allowedRoles.includes(role)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, facility_id, email, avatar_url')
      .eq('id', userId)
      .single()

    if (profileError || !profileData) {
      setProfile(null)
      setFacility(null)
      return
    }

    setProfile(profileData)

    if (profileData.facility_id) {
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('id, name, slug, timezone')
        .eq('id', profileData.facility_id)
        .single()

      setFacility(facilityData ?? null)
    } else {
      setFacility(null)
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const role = profile?.role

  const isAdmin = hasRole(
    role,
    USER_ROLES.FACILITY_ADMIN,
    USER_ROLES.SUPER_ADMIN
  )

  const isManager = hasRole(
    role,
    USER_ROLES.MANAGER,
    USER_ROLES.FACILITY_ADMIN,
    USER_ROLES.SUPER_ADMIN
  )

  const isSupervisor = hasRole(
    role,
    USER_ROLES.SUPERVISOR,
    USER_ROLES.MANAGER,
    USER_ROLES.FACILITY_ADMIN,
    USER_ROLES.SUPER_ADMIN
  )

  return (
    <AuthContext.Provider
      value={{ user, profile, facility, loading, isAdmin, isManager, isSupervisor }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
