import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { solution: true, responsible: true, client: true, deals: true },
  })
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: lead })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...body,
      budget: body.budget != null ? parseFloat(body.budget) : undefined,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : undefined,
    },
  })
  if (body.status === 'WON' || body.status === 'NEGOTIATION') {
    await prisma.automationLog.create({
      data: { automationId: 'system', status: 'triggered', entityType: 'lead', entityId: lead.id },
    }).catch(() => {})
  }
  return NextResponse.json({ data: lead })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
