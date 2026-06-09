import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const { importId } = await req.json()

  const externalIds = await prisma.externalId.findMany({
    where: { importId, sourcePlatform: 'asana' },
  })

  let deleted = 0
  for (const ext of externalIds) {
    try {
      if (ext.mappedEntityType === 'task') {
        await prisma.task.delete({ where: { id: ext.mappedEntityId } })
        deleted++
      } else if (ext.mappedEntityType === 'project') {
        // Deletar tarefas primeiro
        await prisma.task.deleteMany({ where: { projectId: ext.mappedEntityId } })
        await prisma.project.delete({ where: { id: ext.mappedEntityId } })
        deleted++
      }
    } catch {}
  }

  await prisma.externalId.deleteMany({ where: { importId } })
  await prisma.import.update({
    where: { id: importId },
    data: { status: 'ROLLED_BACK', rolledBackAt: new Date() },
  })

  return NextResponse.json({ message: `Rollback concluído: ${deleted} registros removidos.` })
}
