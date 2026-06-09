import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    },
  })
  return NextResponse.json({ data: cost }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const { searchParams } = new URL(req.url)
  const costId = searchParams.get('costId')
  if (!costId) return NextResponse.json({ error: 'costId required' }, { status: 400 })
  await prisma.projectCost.delete({ where: { id: costId } })
  return NextResponse.json({ message: 'Deleted' })
}
