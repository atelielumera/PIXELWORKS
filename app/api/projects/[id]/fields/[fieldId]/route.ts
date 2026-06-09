import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; fieldId: string }> }) {
  const { fieldId } = await params
  await prisma.customField.delete({ where: { id: fieldId } })
  return NextResponse.json({ message: 'Deleted' })
}
