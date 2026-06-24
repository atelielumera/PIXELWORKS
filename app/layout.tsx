import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PixelSAV WorkOS',
  description: 'Sistema interno de gestão operacional da PixelSAV',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
