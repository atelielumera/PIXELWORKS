import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const now = new Date()
  const weekFromNow = new Date(Date.now() + 7 * 86400000)

  const [leadsNew, leadsWaiting, proposalsOpen, dealsWon, dealsLost,
    projectsActive, projectsAtRisk, tasksOverdue, approvalsPending,
    upcomingEvents, wonRevenue, openPipeline,
    solutionsByDeal, leadsByOrigin] = await Promise.all([
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.lead.count({ where: { status: 'WAITING_RESPONSE' } }),
    prisma.proposal.count({ where: { status: { in: ['DRAFT', 'SENT', 'VIEWED'] } } }),
    prisma.deal.count({ where: { status: 'WON' } }),
    prisma.deal.count({ where: { status: 'LOST' } }),
    prisma.project.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
    prisma.project.count({ where: { health: 'AT_RISK' } }),
    prisma.task.count({ where: { status: { notIn: ['DONE', 'CANCELLED'] }, dueDate: { lt: now } } }),
    prisma.approval.count({ where: { status: 'PENDING' } }),
    prisma.event.count({ where: { startDate: { gte: now, lte: weekFromNow } } }),
    prisma.deal.aggregate({ where: { status: 'WON' }, _sum: { value: true } }),
    prisma.deal.aggregate({ where: { status: 'OPEN' }, _sum: { value: true } }),
    prisma.deal.groupBy({ by: ['solutionId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    prisma.lead.groupBy({ by: ['origin'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
  ])

  return NextResponse.json({
    data: {
      leads: { new: leadsNew, waiting: leadsWaiting },
      proposals: { open: proposalsOpen },
      deals: { won: dealsWon, lost: dealsLost },
      projects: { active: projectsActive, atRisk: projectsAtRisk },
      tasks: { overdue: tasksOverdue },
      approvals: { pending: approvalsPending },
      upcomingEvents,
      revenue: { closed: Number(wonRevenue._sum.value ?? 0), pipeline: Number(openPipeline._sum.value ?? 0) },
      analytics: { solutionsByDeal, leadsByOrigin },
    },
  })
}
