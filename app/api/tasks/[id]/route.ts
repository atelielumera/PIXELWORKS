import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { assigneeIds, ...data } = body

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      completedAt: data.status === 'DONE' ? new Date() : data.status ? null : undefined,
      estimatedHours: data.estimatedHours != null ? parseFloat(data.estimatedHours) : undefined,
    },
  })

  if (assigneeIds !== undefined) {
    await prisma.taskAssignee.deleteMany({ where: { taskId: id } })
    if (assigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map((userId: string) => ({ taskId: id, userId })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json({ data: task })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
