export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import Providers from './providers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session = null
  try { session = await getServerSession(authOptions) } catch {}
  if (!session) redirect('/login')

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </Providers>
  )
}
