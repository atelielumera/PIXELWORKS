import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const projectId = searchParams.get('projectId')
  const userId = searchParams.get('userId')

  const tasks = await prisma.task.findMany({
    where: {
      parentId: null,
      ...(status ? { status: status as any } : {}),
      ...(projectId ? { projectId } : {}),
      ...(userId ? { assignees: { some: { userId } } } : {}),
    },
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    include: {
      project: { select: { id: true, name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { subtasks: true } },
    },
    take: 200,
  })
  return NextResponse.json({ data: tasks })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const task = await prisma.task.create({
    data: {
      projectId: body.projectId || null,
      parentId: body.parentId || null,
      title: body.title,
      description: body.description || null,
      status: body.status || 'TODO',
      priority: body.priority || 'MEDIUM',
      section: body.section || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      estimatedHours: body.estimatedHours ? parseFloat(body.estimatedHours) : null,
      tags: body.tags || [],
      createdById: (session?.user as any)?.id || null,
    },
  })

  // Se tarefa foi concluída, atualizar saúde do projeto
  if (task.projectId && body.status === 'DONE') {
    const overdue = await prisma.task.count({
      where: { projectId: task.projectId, status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: new Date() } },
    })
    const total = await prisma.task.count({ where: { projectId: task.projectId } })
    const health = total > 0 && overdue / total > 0.3 ? 'AT_RISK' : 'GOOD'
    await prisma.project.update({ where: { id: task.projectId }, data: { health } })
  }

  return NextResponse.json(task, { status: 201 })
}
