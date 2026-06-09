import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const userId = searchParams.get('userId')

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { date: 'desc' },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    take: 100,
  })
  return NextResponse.json({ data: entries })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const hours = body.hours ? parseFloat(body.hours) : null
  const totalCost = hours && body.hourlyRate ? hours * parseFloat(body.hourlyRate) : null

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      projectId: body.projectId || null,
      taskId: body.taskId || null,
      description: body.description || null,
      startTime: body.startTime ? new Date(body.startTime) : new Date(),
      endTime: body.endTime ? new Date(body.endTime) : null,
      hours,
      billable: body.billable ?? false,
      hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
      totalCost,
      date: body.date ? new Date(body.date) : new Date(),
    },
  })

  // Atualizar custo real do projeto
  if (body.projectId && totalCost) {
    const totalProjectCost = await prisma.timeEntry.aggregate({
      where: { projectId: body.projectId },
      _sum: { totalCost: true },
    })
    await prisma.project.update({
      where: { id: body.projectId },
      data: { actualCosts: Number(totalProjectCost._sum.totalCost ?? 0) },
    })
  }

  return NextResponse.json(entry, { status: 201 })
}
