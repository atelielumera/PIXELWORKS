import { withAuth } from 'next-auth/middleware'

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET ?? 'pixelsav-workos-fallback-secret-2024',
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
