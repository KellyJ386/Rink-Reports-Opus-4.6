'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Breadcrumbs from '@/components/layout/Breadcrumbs'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-wolf-grey-light/30 dark:bg-navy-dark">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-6">
            <Breadcrumbs />
            <div className="mt-4">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
