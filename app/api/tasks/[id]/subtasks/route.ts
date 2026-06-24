import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const subtasks = await prisma.task.findMany({
    where: { parentId: id },
    orderBy: { createdAt: 'asc' },
    include: {
      assignees: { include: { user: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json({ data: subtasks })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  const parent = await prisma.task.findUnique({ where: { id }, select: { projectId: true } })
  const subtask = await prisma.task.create({
    data: {
      parentId: id,
      projectId: parent?.projectId ?? null,
      title: title.trim(),
      status: 'TODO',
      priority: 'MEDIUM',
      createdById: (session.user as any).id,
    },
    include: {
      assignees: { include: { user: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json({ data: subtask }, { status: 201 })
}
