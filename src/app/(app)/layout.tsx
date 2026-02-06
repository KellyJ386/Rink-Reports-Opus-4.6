import { AppShell } from "@/components/layout";
import { getUserProfile } from "@/lib/supabase/auth-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  return (
    <AppShell
      userName={profile?.full_name}
      userRole={profile?.role}
    >
      {children}
    </AppShell>
  );
}
