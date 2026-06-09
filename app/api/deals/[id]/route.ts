import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      client: true,
      lead: true,
      solution: true,
      responsible: { select: { id: true, name: true, email: true } },
      proposals: { orderBy: { createdAt: 'desc' } },
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
      probability: body.probability != null ? parseInt(body.probability) : undefined,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : undefined,
    },
  })
  return NextResponse.json({ data: deal })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.deal.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
