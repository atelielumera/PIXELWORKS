import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const comments = await prisma.taskComment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ data: comments })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  const comment = await prisma.taskComment.create({
    data: { taskId: id, userId: (session.user as any).id, content: content.trim() },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ data: comment }, { status: 201 })
}
