'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await login(formData)
    if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy dark:bg-navy-dark px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Max Facility</h1>
          <p className="text-wolf-grey mt-1 text-sm">Rink Reports</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-navy rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-semibold text-navy dark:text-white mb-6">
            Sign in to your account
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-alert-red/10 border border-alert-red/20 text-alert-red text-sm">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-navy dark:text-wolf-grey-light">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@facility.com"
                required
                autoComplete="email"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-navy dark:text-wolf-grey-light">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="h-12"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" name="remember" />
                <Label
                  htmlFor="remember"
                  className="text-sm text-wolf-grey-dark dark:text-wolf-grey cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-action-green hover:text-action-green-hover"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-action-green hover:bg-action-green-hover text-white font-medium text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-wolf-grey text-xs mt-6">
          Max Facility Rink Reports
        </p>
      </div>
    </div>
  )
}
