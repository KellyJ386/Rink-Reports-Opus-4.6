import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-navy)] px-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        {/* Brand mark */}
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/10 text-white font-bold text-2xl">
          MF
        </div>

        {/* 404 heading */}
        <h1 className="text-5xl font-bold tracking-tight text-white">404</h1>
        <h2 className="text-xl font-semibold text-white/80">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="max-w-md text-sm text-white/50">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Back to dashboard */}
        <Link href="/dashboard">
          <Button
            className="mt-2 bg-white text-[var(--color-navy)] hover:bg-white/90 font-semibold"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
