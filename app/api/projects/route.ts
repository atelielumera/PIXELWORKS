import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCode } from '@/lib/utils'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const projects = await prisma.project.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      solution: true,
      _count: { select: { tasks: true } },
    },
    take: 100,
  })
  return NextResponse.json({ data: projects })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()

  const project = await prisma.project.create({
    data: {
      name: body.name,
      code: generateCode('PSV'),
      clientId: body.clientId || null,
      dealId: body.dealId || null,
      solutionId: body.solutionId || null,
      scope: body.scope || null,
      eventLocation: body.eventLocation || null,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      setupStartDate: body.setupStartDate ? new Date(body.setupStartDate) : null,
      setupEndDate: body.setupEndDate ? new Date(body.setupEndDate) : null,
      operationStartDate: body.operationStartDate ? new Date(body.operationStartDate) : null,
      operationEndDate: body.operationEndDate ? new Date(body.operationEndDate) : null,
      teardownStartDate: body.teardownStartDate ? new Date(body.teardownStartDate) : null,
      teardownEndDate: body.teardownEndDate ? new Date(body.teardownEndDate) : null,
      approvedBudget: body.approvedBudget ? parseFloat(body.approvedBudget) : null,
      createdById: (session?.user as any)?.id || null,
    },
  })

  // Se um template foi selecionado, criar tarefas a partir dele
  if (body.templateId) {
    const template = await prisma.projectTemplate.findUnique({
      where: { id: body.templateId },
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    })
    if (template) {
      for (const t of template.tasks) {
        await prisma.task.create({
          data: {
            projectId: project.id,
            title: t.name,
            description: t.description || null,
            section: t.section || 'Geral',
            status: 'TODO',
            priority: 'MEDIUM',
          },
        })
      }
    }
  }

  // Se veio de um deal, atualizar o deal com projectId
  if (body.dealId) {
    await prisma.deal.update({
      where: { id: body.dealId },
      data: { status: 'WON' },
    }).catch(() => {})
  }

  // Criar evento de agenda para o evento do projeto
  if (body.eventDate) {
    await prisma.event.create({
      data: {
        title: `[Evento] ${project.name}`,
        type: 'EVENT',
        projectId: project.id,
        startDate: new Date(body.eventDate),
        allDay: true,
      },
    })
  }

  return NextResponse.json(project, { status: 201 })
}
