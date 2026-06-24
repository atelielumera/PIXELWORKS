import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fields = await prisma.customField.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ data: fields })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, fieldType = 'TEXT' } = await req.json()
  const count = await prisma.customField.count({ where: { projectId: id } })
  const field = await prisma.customField.create({
    data: { projectId: id, name, fieldType, sortOrder: count },
  })
  return NextResponse.json({ data: field })
}
