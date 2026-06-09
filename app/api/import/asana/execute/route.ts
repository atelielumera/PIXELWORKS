import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCode } from '@/lib/utils'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const { importId, mappings } = await req.json()

  const importRecord = await prisma.import.findUnique({
    where: { id: importId },
    include: { files: { take: 1 } },
  })
  if (!importRecord) return NextResponse.json({ error: 'Import not found' }, { status: 404 })

  await prisma.import.update({ where: { id: importId }, data: { status: 'PROCESSING', startedAt: new Date() } })

  const result = { imported: 0, skipped: 0, errors: 0, warnings: [] as string[], projectIds: [] as string[] }
  const file = importRecord.files[0]
  const parsedData = file?.parsedData as any

  try {
    const content = file?.content ?? ''
    const lines = content.split('\n').filter(Boolean)

    if (lines.length > 1) {
      const headers = lines[0].split(',')
      const nameIdx = headers.findIndex(h => h.trim() === 'Name')
      const sectionIdx = headers.findIndex(h => h.trim().includes('Section'))
      const dueDateIdx = headers.findIndex(h => h.trim().includes('Due Date'))
      const assigneeIdx = headers.findIndex(h => h.trim().includes('Assignee'))
      const completedIdx = headers.findIndex(h => h.trim().includes('Completed'))

      // Criar um projeto genérico para agrupar tarefas importadas
      const project = await prisma.project.create({
        data: {
          name: `[Asana] Import ${new Date().toLocaleDateString('pt-BR')}`,
          code: generateCode('ASN'),
          status: 'PLANNING',
          createdById: (session?.user as any)?.id || null,
        },
      })
      result.projectIds.push(project.id)

      // Preservar ID externo
      await prisma.externalId.create({
        data: {
          importId,
          sourcePlatform: 'asana',
          externalId: `import_${importId}`,
          mappedEntityType: 'project',
          mappedEntityId: project.id,
          originalDataJson: parsedData,
          importBatchId: importId,
        },
      }).catch(() => {})

      // Importar tarefas linha a linha
      for (let i = 1; i < Math.min(lines.length, 1001); i++) {
        const cols = lines[i].split(',')
        const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : null
        if (!name) { result.skipped++; continue }

        const isCompleted = completedIdx >= 0 && (cols[completedIdx]?.trim().toLowerCase() === 'true' || cols[completedIdx]?.trim() === '1')
        const dueDateStr = dueDateIdx >= 0 ? cols[dueDateIdx]?.trim() : null
        const section = sectionIdx >= 0 ? cols[sectionIdx]?.trim() : null

        try {
          const task = await prisma.task.create({
            data: {
              projectId: project.id,
              title: name,
              status: isCompleted ? 'DONE' : 'TODO',
              section: section || 'Importado do Asana',
              dueDate: dueDateStr ? new Date(dueDateStr) : null,
              completedAt: isCompleted ? new Date() : null,
            },
          })

          // Preservar GID original se existir
          await prisma.externalId.create({
            data: {
              importId,
              sourcePlatform: 'asana',
              externalId: `task_${i}_${importId}`,
              mappedEntityType: 'task',
              mappedEntityId: task.id,
              originalDataJson: { row: i, name },
              importBatchId: importId,
            },
          }).catch(() => {})

          await prisma.importLog.create({
            data: { importId, level: 'info', message: `Tarefa importada: ${name}`, entityType: 'task', entityId: task.id },
          })
          result.imported++
        } catch (e: any) {
          result.errors++
          await prisma.importLog.create({
            data: { importId, level: 'error', message: e.message, entityType: 'task' },
          })
        }
      }
    }

    await prisma.import.update({
      where: { id: importId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        importedItems: result.imported,
        skippedItems: result.skipped,
        errorItems: result.errors,
      },
    })
  } catch (e: any) {
    await prisma.import.update({ where: { id: importId }, data: { status: 'FAILED' } })
    result.errors++
    result.warnings.push(e.message)
  }

  return NextResponse.json({ result })
}
