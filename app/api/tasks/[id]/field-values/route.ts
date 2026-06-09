import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { fieldId, value } = await req.json()
  const record = await prisma.taskCustomFieldValue.upsert({
    where: { taskId_fieldId: { taskId: id, fieldId } },
    update: { value },
    create: { taskId: id, fieldId, value },
  })
  return NextResponse.json({ data: record })
}
