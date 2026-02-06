'use client'

import { useState } from 'react'
import { resetPassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await resetPassword(formData)
    if (result?.error) {
      if (typeof result.error === 'string') {
        setError(result.error)
      } else if (result.error.confirmPassword) {
        setError(result.error.confirmPassword[0])
      } else if (result.error.password) {
        setError(result.error.password[0])
      }
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

        {/* Card */}
        <div className="bg-white dark:bg-navy rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-semibold text-navy dark:text-white mb-2">
            Set new password
          </h2>
          <p className="text-wolf-grey-dark dark:text-wolf-grey text-sm mb-6">
            Enter your new password below.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-alert-red/10 border border-alert-red/20 text-alert-red text-sm">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-navy dark:text-wolf-grey-light">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-navy dark:text-wolf-grey-light">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-action-green hover:bg-action-green-hover text-white font-medium text-base"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
