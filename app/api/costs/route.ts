import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      projectId, category, description, estimated, actual,
      supplier, date, notes, paymentType, paymentDate, installments,
    } = body

    const cost = await prisma.projectCost.create({
      data: {
        projectId,
        category: category || 'Geral',
        description,
        estimated: estimated ? parseFloat(String(estimated).replace(/\./g, '').replace(',', '.')) : null,
        actual: actual ? parseFloat(String(actual).replace(/\./g, '').replace(',', '.')) : null,
        supplier: supplier || null,
        date: date ? new Date(date) : null,
        notes: notes || null,
        paymentType: paymentType || 'TOTAL',
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        installments: installments?.length
          ? {
              create: installments.map((inst: any, i: number) => ({
                number: i + 1,
                amount: parseFloat(String(inst.amount).replace(/\./g, '').replace(',', '.')),
                dueDate: new Date(inst.dueDate),
              })),
            }
          : undefined,
      },
      include: { installments: true },
    })

    return NextResponse.json({ data: cost })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
