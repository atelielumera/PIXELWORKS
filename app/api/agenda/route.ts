import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: from ? new Date(from) : new Date(),
        ...(to ? { lte: new Date(to) } : {}),
      },
    },
    orderBy: { startDate: 'asc' },
    include: { project: { select: { id: true, name: true, solution: true } } },
    take: 200,
  })
  return NextResponse.json({ data: events })
}

export async function POST(req: Request) {
  const body = await req.json()
  const event = await prisma.event.create({
    data: {
      title: body.title,
      type: body.type || 'OTHER',
      description: body.description || null,
      projectId: body.projectId || null,
      taskId: body.taskId || null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      allDay: body.allDay ?? false,
      location: body.location || null,
      color: body.color || null,
    },
  })
  return NextResponse.json(event, { status: 201 })
}
