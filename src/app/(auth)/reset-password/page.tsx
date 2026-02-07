'use client'

import { useState, useTransition } from 'react'
import { resetPassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    setClientError(null)

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 8) {
      setClientError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setClientError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await resetPassword(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  const displayError = clientError || error

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-4 pb-2">
          <div className="flex flex-col items-center space-y-2">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl',
                'bg-[#002244] text-white font-bold text-xl'
              )}
            >
              MF
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#002244]">
              Set New Password
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Choose a strong password for your account. Must be at least 8
              characters.
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form action={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {displayError && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 text-red-800"
              >
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter new password"
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
                className="h-11 focus-visible:ring-[#002244]/30"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11 focus-visible:ring-[#002244]/30"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full h-11 text-sm font-semibold',
                'bg-[#002244] hover:bg-[#003366] text-white',
                'transition-all duration-200'
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Updating password...
                </span>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
