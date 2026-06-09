import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const leads = await prisma.lead.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: 'desc' },
    include: { solution: true, responsible: { select: { id: true, name: true } } },
    take: 200,
  })
  return NextResponse.json({ data: leads })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const lead = await prisma.lead.create({
    data: {
      contactName: body.contactName,
      company: body.company || null,
      whatsapp: body.whatsapp || null,
      email: body.email || null,
      city: body.city || null,
      state: body.state || null,
      origin: body.origin || null,
      solutionId: body.solutionId || null,
      type: body.type || null,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      eventLocation: body.eventLocation || null,
      rentalPeriod: body.rentalPeriod || null,
      budget: body.budget ? parseFloat(body.budget) : null,
      status: body.status || 'NEW',
      notes: body.notes || null,
      nextAction: body.nextAction || null,
      nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
      createdById: (session?.user as any)?.id || null,
    },
  })
  // Dispara automação de lead criado
  await triggerAutomation('LEAD_CREATED', 'lead', lead.id)
  return NextResponse.json(lead, { status: 201 })
}

async function triggerAutomation(trigger: string, entityType: string, entityId: string) {
  try {
    const automations = await prisma.automation.findMany({
      where: { trigger: trigger as any, isActive: true },
      include: { actions: true },
    })
    for (const auto of automations) {
      await prisma.automationLog.create({
        data: { automationId: auto.id, status: 'triggered', entityType, entityId },
      })
    }
  } catch {}
}
