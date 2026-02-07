export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Navigation will be added here later */}
      <main>{children}</main>
    </div>
  )
}
