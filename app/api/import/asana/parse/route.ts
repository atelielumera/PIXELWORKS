import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const fileType = formData.get('fileType') as string

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const content = await file.text()
  let parsedData = { projects: 0, tasks: 0, users: [] as string[], customFields: [] as string[], sections: [] as string[] }

  try {
    if (fileType === 'json') {
      const json = JSON.parse(content)
      // Estrutura do JSON do Asana
      if (json.data) {
        parsedData.tasks = Array.isArray(json.data) ? json.data.length : 0
        const assignees = new Set<string>()
        if (Array.isArray(json.data)) {
          for (const task of json.data) {
            if (task.assignee?.name) assignees.add(task.assignee.name)
          }
        }
        parsedData.users = Array.from(assignees)
      }
    } else if (fileType === 'csv') {
      const lines = content.split('\n').filter(Boolean)
      if (lines.length > 0) {
        const headers = lines[0].split(',')
        parsedData.tasks = lines.length - 1
        const assigneeIdx = headers.findIndex(h => h.toLowerCase().includes('assignee'))
        const assignees = new Set<string>()
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',')
          if (assigneeIdx >= 0 && cols[assigneeIdx]) assignees.add(cols[assigneeIdx].trim())
        }
        parsedData.users = Array.from(assignees).filter(Boolean)
        parsedData.customFields = headers.filter(h =>
          !['Name', 'Task ID', 'Assignee', 'Due Date', 'Start Date', 'Section/Column', 'Completed', 'Created At', 'Last Modified', 'Tags'].includes(h.trim())
        ).map(h => h.trim())
      }
    }
  } catch (e) {
    console.error('Parse error:', e)
  }

  // Criar registro de import no banco
  const importRecord = await prisma.import.create({
    data: {
      sourcePlatform: 'asana',
      status: 'PENDING',
      createdById: (session?.user as any)?.id || null,
      totalItems: parsedData.tasks + parsedData.projects,
    },
  })

  // Salvar arquivo
  await prisma.importFile.create({
    data: {
      importId: importRecord.id,
      fileName: file.name,
      fileType,
      size: file.size,
      content: content.slice(0, 50000), // Limitar para 50KB
      parsedData,
    },
  })

  return NextResponse.json({ importId: importRecord.id, data: parsedData })
}
