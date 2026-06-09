import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const team = await prisma.team.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description !== undefined ? body.description : undefined,
      color: body.color !== undefined ? body.color : undefined,
    },
  })
  return NextResponse.json({ data: team })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
