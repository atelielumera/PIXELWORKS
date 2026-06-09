import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true, solution: true, deal: true, contract: true,
      members: { include: { user: true } },
      tasks: { include: { assignees: { include: { user: true } } } },
      costs: true, timeEntries: true, approvals: true,
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: project })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...body,
      approvedBudget: body.approvedBudget != null ? parseFloat(body.approvedBudget) : undefined,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
    },
  })
  const overdueTasks = await prisma.task.count({
    where: { projectId: id, status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: new Date() } },
  })
  const totalTasks = await prisma.task.count({ where: { projectId: id } })
  let health: 'GOOD' | 'AT_RISK' | 'CRITICAL' = 'GOOD'
  if (totalTasks > 0) {
    const ratio = overdueTasks / totalTasks
    if (ratio > 0.5) health = 'CRITICAL'
    else if (ratio > 0.2) health = 'AT_RISK'
  }
  await prisma.project.update({ where: { id }, data: { health } })
  return NextResponse.json({ data: project })
}
