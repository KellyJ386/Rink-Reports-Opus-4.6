'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await forgotPassword(formData)
    if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : 'Something went wrong')
      setLoading(false)
    } else if (result?.success) {
      setSuccess(true)
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
            Forgot your password?
          </h2>
          <p className="text-wolf-grey-dark dark:text-wolf-grey text-sm mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {success ? (
            <div className="text-center py-4">
              <div className="mb-4 p-3 rounded-md bg-action-green/10 border border-action-green/20 text-action-green text-sm">
                Check your email for a reset link.
              </div>
              <Link
                href="/login"
                className="text-sm text-action-green hover:text-action-green-hover"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-action-green hover:bg-action-green-hover text-white font-medium text-base"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-action-green hover:text-action-green-hover"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
