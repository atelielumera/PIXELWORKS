import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { solution: true, responsible: true, client: true, deals: true },
  })
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: lead })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...body,
      budget: body.budget != null ? parseFloat(body.budget) : undefined,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : undefined,
    },
  })
  // Se virou WON, verificar se deve criar deal
  if (body.status === 'WON' || body.status === 'NEGOTIATION') {
    await prisma.automationLog.create({
      data: { automationId: 'system', status: 'triggered', entityType: 'lead', entityId: lead.id },
    }).catch(() => {})
  }
  return NextResponse.json({ data: lead })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.lead.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
