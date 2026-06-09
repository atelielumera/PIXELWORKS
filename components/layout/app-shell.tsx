'use client'

import { createContext, useContext, useState } from 'react'
import { Sidebar } from './sidebar'

const SidebarCtx = createContext({ open: false, toggle: () => {}, close: () => {} })
export const useSidebar = () => useContext(SidebarCtx)

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ctx = { open, toggle: () => setOpen(v => !v), close: () => setOpen(false) }

  return (
    <SidebarCtx.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile overlay */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Sidebar — slides in on mobile, always visible on md+ */}
        <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <Sidebar onClose={() => setOpen(false)} />
        </div>

        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    </SidebarCtx.Provider>
  )
}
