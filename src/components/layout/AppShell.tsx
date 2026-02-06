"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Breadcrumbs } from "./Breadcrumbs";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function AppShell({ children, userName, userRole }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar userRole={userRole} />
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userRole={userRole}
      />

      <div className="flex flex-1 flex-col">
        <Header
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
