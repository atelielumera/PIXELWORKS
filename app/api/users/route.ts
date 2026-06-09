import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, department: true, avatar: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ data: users })
}

export async function POST(req: Request) {
  const body = await req.json()
  const hash = body.password ? await bcrypt.hash(body.password, 12) : undefined
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hash,
      role: body.role || 'MEMBER',
      department: body.department || null,
    },
    select: { id: true, name: true, email: true, role: true },
  })
  return NextResponse.json(user, { status: 201 })
}
