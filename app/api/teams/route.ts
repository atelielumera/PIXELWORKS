import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  })
  return NextResponse.json({ data: teams })
}

export async function POST(req: Request) {
  const body = await req.json()
  const team = await prisma.team.create({
    data: {
      name: body.name,
      description: body.description || null,
      color: body.color || '#3B82F6',
    },
  })
  return NextResponse.json({ data: team }, { status: 201 })
}
