import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const approvals = await prisma.approval.findMany({
    where: status ? { status: status as any } : {},
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      project: { select: { id: true, name: true } },
      requestedBy: { select: { name: true } },
      assignee: { select: { name: true } },
    },
    take: 100,
  })
  return NextResponse.json({ data: approvals })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const approval = await prisma.approval.create({
    data: {
      title: body.title,
      type: body.type || 'OTHER',
      projectId: body.projectId || null,
      taskId: body.taskId || null,
      requestedById: (session?.user as any)?.id || null,
      assigneeId: body.assigneeId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(approval, { status: 201 })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const approval = await prisma.approval.update({
    where: { id: body.id },
    data: {
      status: body.status,
      feedback: body.feedback || null,
      approvedAt: body.status === 'APPROVED' ? new Date() : undefined,
      rejectedAt: body.status === 'REJECTED' ? new Date() : undefined,
    },
  })
  // Se aprovado, atualizar status do projeto se necessário
  if (body.status === 'APPROVED' && approval.projectId) {
    await prisma.automationLog.create({
      data: { automationId: 'system', status: 'approval_approved', entityType: 'approval', entityId: approval.id },
    }).catch(() => {})
  }
  return NextResponse.json({ data: approval })
}
