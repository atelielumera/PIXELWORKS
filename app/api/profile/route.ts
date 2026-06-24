import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true, phone: true, department: true, role: true },
  })
  return NextResponse.json({ data: user })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await req.json()

  if (body.currentPassword && body.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
    if (!user?.password) return NextResponse.json({ error: 'Usuário sem senha definida' }, { status: 400 })
    const valid = await bcrypt.compare(body.currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    const hash = await bcrypt.hash(body.newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { password: hash } })
    return NextResponse.json({ message: 'Senha atualizada' })
  }

  const { name, phone, department, avatar } = body
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name, phone, department, ...(avatar !== undefined ? { avatar } : {}) },
    select: { id: true, name: true, email: true, avatar: true, phone: true, department: true, role: true },
  })
  return NextResponse.json({ data: updated })
}
