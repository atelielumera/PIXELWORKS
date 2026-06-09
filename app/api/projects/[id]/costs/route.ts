import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const costs = await prisma.projectCost.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ data: costs })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const cost = await prisma.projectCost.create({
    data: {
      projectId: id,
      category: body.category || 'Outros',
      description: body.description,
      estimated: body.estimated ? parseFloat(body.estimated) : null,
      actual: body.actual ? parseFloat(body.actual) : null,
      supplier: body.supplier || null,
      date: body.date ? new Date(body.date) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ data: cost }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const costId = searchParams.get('costId')
  if (!costId) return NextResponse.json({ error: 'costId required' }, { status: 400 })
  await prisma.projectCost.delete({ where: { id: costId, projectId: id } })
  return NextResponse.json({ message: 'Deleted' })
}
