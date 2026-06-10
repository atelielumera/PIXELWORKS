'use client'
import { SessionProvider } from 'next-auth/react'
import { NotificationsProvider } from '@/components/notifications/notifications-provider'
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </SessionProvider>
  )
}
