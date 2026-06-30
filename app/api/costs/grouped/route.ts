import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { costs: { some: {} } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        solution: { select: { name: true, color: true } },
        costs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            description: true,
            category: true,
            estimated: true,
            actual: true,
            supplier: true,
            date: true,
            paymentType: true,
            paymentDate: true,
            installments: {
              orderBy: { number: 'asc' },
              select: { id: true, number: true, amount: true, dueDate: true, paid: true, paidDate: true },
            },
          },
        },
      },
    })

    const data = projects.map(p => ({
      ...p,
      costs: p.costs.map(c => ({
        ...c,
        estimated: c.estimated ? Number(c.estimated) : null,
        actual: c.actual ? Number(c.actual) : null,
        installments: c.installments.map(i => ({ ...i, amount: Number(i.amount) })),
      })),
    }))

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
