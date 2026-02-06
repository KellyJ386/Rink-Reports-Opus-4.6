"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await forgotPassword(formData);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-lg bg-card p-8 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold text-card-foreground">
          Check Your Email
        </h1>
        <p className="mb-6 text-center text-muted-foreground">
          If an account exists with that email, we sent a password reset link.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card p-8 shadow-lg">
      <h1 className="mb-2 text-center text-2xl font-bold text-card-foreground">
        Forgot Password
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Enter your email to receive a reset link.
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@facility.com"
            required
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="rounded-md bg-alert-red/10 p-3 text-sm text-alert-red">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
