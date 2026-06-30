import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { paid, paidDate } = body

    if (paid !== undefined) {
      const cost = await prisma.projectCost.findUnique({ where: { id }, include: { installments: true } })
      if (!cost) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      if (cost.paymentType === 'INSTALLMENT' && body.installmentId) {
        await prisma.costInstallment.update({
          where: { id: body.installmentId },
          data: { paid, paidDate: paidDate ? new Date(paidDate) : new Date() },
        })
      } else {
        await prisma.projectCost.update({
          where: { id },
          data: {
            actual: cost.estimated,
            paymentDate: paidDate ? new Date(paidDate) : new Date(),
          },
        })
      }
      return NextResponse.json({ ok: true })
    }

    const updated = await prisma.projectCost.update({
      where: { id },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.projectCost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
