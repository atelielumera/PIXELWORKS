import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCode } from '@/lib/utils'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const deals = await prisma.deal.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: 'desc' },
    include: { client: true, solution: true, responsible: { select: { id: true, name: true } } },
    take: 200,
  })
  return NextResponse.json({ data: deals })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const deal = await prisma.deal.create({
    data: {
      title: body.title,
      clientId: body.clientId || null,
      leadId: body.leadId || null,
      solutionId: body.solutionId || null,
      value: body.value ? parseFloat(body.value) : null,
      status: body.status || 'OPEN',
      stage: body.stage || 'NEW',
      probability: body.probability ? parseInt(body.probability) : null,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
      responsibleId: body.responsibleId || (session?.user as any)?.id || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(deal, { status: 201 })
}
