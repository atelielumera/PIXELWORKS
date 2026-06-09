import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { metrics: true } } },
  })
  return NextResponse.json({ data: goals })
}

export async function POST(req: Request) {
  const body = await req.json()
  const goal = await prisma.goal.create({
    data: {
      title: body.title,
      description: body.description || null,
      status: body.status || 'ACTIVE',
      period: body.period || 'QUARTERLY',
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      targetValue: body.targetValue ? parseFloat(body.targetValue) : null,
      unit: body.unit || null,
    },
  })
  return NextResponse.json(goal, { status: 201 })
}
