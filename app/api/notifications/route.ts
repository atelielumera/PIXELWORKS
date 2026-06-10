import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ overdue: [], dueSoon: [], newAssignments: [] })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in48h = new Date(today.getTime() + 48 * 60 * 60 * 1000)
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  const taskSelect = {
    id: true, title: true, dueDate: true,
    project: { select: { id: true, name: true } },
  }

  const [overdue, dueSoon, recentAssignments] = await Promise.all([
    prisma.task.findMany({
      where: { assignees: { some: { userId } }, status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: today } },
      select: taskSelect, orderBy: { dueDate: 'asc' }, take: 10,
    }),
    prisma.task.findMany({
      where: { assignees: { some: { userId } }, status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { gte: today, lte: in48h } },
      select: taskSelect, orderBy: { dueDate: 'asc' }, take: 10,
    }),
    prisma.taskAssignee.findMany({
      where: { userId, assignedAt: { gte: yesterday } },
      include: { task: { select: taskSelect } },
      orderBy: { assignedAt: 'desc' }, take: 10,
    }),
  ])

  return NextResponse.json({
    overdue,
    dueSoon,
    newAssignments: recentAssignments.map(a => ({ ...a.task, assignedAt: a.assignedAt })),
  })
}
