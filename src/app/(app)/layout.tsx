export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will be added in Phase 2 (Agent 04) */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
