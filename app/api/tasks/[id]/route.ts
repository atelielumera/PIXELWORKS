import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { assigneeIds, ...data } = body

  const updateData: Record<string, unknown> = { ...data }
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
  if (data.status === 'DONE') updateData.completedAt = new Date()
  else if (data.status) updateData.completedAt = null

  const task = await prisma.task.update({ where: { id }, data: updateData })

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
