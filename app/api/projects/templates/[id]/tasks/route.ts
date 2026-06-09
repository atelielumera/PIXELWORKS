import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tpl = await prisma.projectTemplate.findUnique({
    where: { id },
    include: {
      solution: true,
      tasks: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!tpl) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ data: tpl })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const count = await prisma.projectTemplateTask.count({ where: { templateId: id } })
  const task = await prisma.projectTemplateTask.create({
    data: {
      templateId: id,
      name: body.name.trim(),
      section: body.section?.trim() || 'Geral',
      isRequired: body.isRequired ?? false,
      sortOrder: count + 1,
    },
  })
  return NextResponse.json({ data: task }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId obrigatório' }, { status: 400 })

  await prisma.projectTemplateTask.deleteMany({ where: { id: taskId, templateId: id } })
  return NextResponse.json({ message: 'Removida' })
}
