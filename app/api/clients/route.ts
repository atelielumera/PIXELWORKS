import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { projects: true, deals: true } } },
  })
  return NextResponse.json({ data: clients })
}

export async function POST(req: Request) {
  const body = await req.json()
  const client = await prisma.client.create({
    data: {
      name: body.name,
      company: body.company || null,
      cnpj: body.cnpj || null,
      email: body.email || null,
      phone: body.phone || null,
      whatsapp: body.whatsapp || null,
      city: body.city || null,
      state: body.state || null,
      website: body.website || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(client, { status: 201 })
}
