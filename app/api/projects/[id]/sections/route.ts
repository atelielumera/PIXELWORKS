import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const count = await prisma.projectSection.count({ where: { projectId: id } })
  const section = await prisma.projectSection.create({
    data: {
      projectId: id,
      name: body.name || 'Nova Seção',
      startDate: body.startDate ? new Date(body.startDate) : null,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      sortOrder: count,
    },
  })
  return NextResponse.json({ data: section }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params
  const { searchParams } = new URL(req.url)
  const sectionId = searchParams.get('sectionId')
  if (!sectionId) return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
  await prisma.projectSection.delete({ where: { id: sectionId } })
  return NextResponse.json({ message: 'Deleted' })
}
