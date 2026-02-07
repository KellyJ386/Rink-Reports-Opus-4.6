import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Fixed header */}
      <Header />

      <div className="flex flex-1 pt-16">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background">
          <div className="px-4 pt-4 md:px-6">
            <Breadcrumbs className="mb-4" />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
