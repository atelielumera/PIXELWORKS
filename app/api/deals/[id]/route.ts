import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      client: true,
      solution: true,
      lead: { select: { id: true, contactName: true, company: true } },
      responsible: { select: { id: true, name: true, email: true } },
      proposals: { orderBy: { createdAt: 'desc' } },
      project: { select: { id: true, name: true, status: true } },
    },
  })
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: deal })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...body,
      value: body.value != null ? parseFloat(body.value) : undefined,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : undefined,
      closedAt: (body.status === 'WON' || body.status === 'LOST') ? new Date() : undefined,
    },
  })
  return NextResponse.json({ data: deal })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.deal.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
