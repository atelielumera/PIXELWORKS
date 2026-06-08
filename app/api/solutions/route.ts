import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const solutions = await prisma.solution.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ data: solutions })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const sol = await prisma.solution.update({ where: { id: body.id }, data: body })
  return NextResponse.json({ data: sol })
}
