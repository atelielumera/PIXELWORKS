import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true, solution: true, deal: true, contract: true,
      members: { include: { user: true } },
      tasks: { include: { assignees: { include: { user: true } } } },
      costs: true, timeEntries: true, approvals: true,
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: project })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const dateFields = [
      'eventDate', 'setupStartDate', 'setupEndDate',
      'operationStartDate', 'operationEndDate',
      'teardownStartDate', 'teardownEndDate',
    ]
    const data: Record<string, unknown> = {}

    const allowedFields = new Set([
      'name', 'status', 'scope', 'notes', 'approvedBudget',
      'eventDate', 'setupStartDate', 'setupEndDate',
      'operationStartDate', 'operationEndDate',
      'teardownStartDate', 'teardownEndDate',
      'eventLocation', 'code', 'solutionId', 'clientId',
    ])

    for (const [key, value] of Object.entries(body)) {
      if (!allowedFields.has(key)) continue
      if (dateFields.includes(key)) {
        data[key] = value ? new Date(value as string) : null
      } else if (key === 'approvedBudget') {
        if (value == null || value === '') {
          data[key] = null
        } else {
          // Accept Brazilian format: "50.000,64" → 50000.64
          const normalized = String(value).replace(/\./g, '').replace(',', '.')
          const num = parseFloat(normalized)
          data[key] = isNaN(num) ? null : num
        }
      } else if (key === 'notes') {
        // frontend uses 'notes', schema uses 'scope'
        data['scope'] = value
      } else {
        data[key] = value
      }
    }

    const project = await prisma.project.update({ where: { id }, data })

    const overdueTasks = await prisma.task.count({
      where: { projectId: id, status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: new Date() } },
    })
    const totalTasks = await prisma.task.count({ where: { projectId: id } })
    let health: 'GOOD' | 'AT_RISK' | 'CRITICAL' = 'GOOD'
    if (totalTasks > 0) {
      const ratio = overdueTasks / totalTasks
      if (ratio > 0.5) health = 'CRITICAL'
      else if (ratio > 0.2) health = 'AT_RISK'
    }
    await prisma.project.update({ where: { id }, data: { health } })
    return NextResponse.json({ data: project })
  } catch (err: any) {
    console.error('PATCH project error:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro ao salvar projeto' }, { status: 500 })
  }
}
