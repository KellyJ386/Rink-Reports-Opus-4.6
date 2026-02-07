'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(true)
      }
    })
  }

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
              Reset Your Password
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {success ? (
            <div className="space-y-4">
              <Alert className="border-[#69BE28]/30 bg-[#69BE28]/10 text-[#002244]">
                <AlertDescription className="font-medium">
                  Check your email for a reset link. It may take a few minutes
                  to arrive.
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#69BE28] hover:text-[#5AA822] transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 text-red-800"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@facility.com"
                  required
                  autoComplete="email"
                  autoFocus
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
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#69BE28] hover:text-[#5AA822] transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
