import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const member = await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: id, userId: body.userId } },
    create: { teamId: id, userId: body.userId, role: body.role || 'member' },
    update: { role: body.role || 'member' },
  })
  return NextResponse.json({ data: member }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: id, userId } },
  })
  return NextResponse.json({ message: 'Removed' })
}
