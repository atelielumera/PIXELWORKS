import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { File, FileText, Image } from 'lucide-react'

async function getFiles() {
  return prisma.file.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      attachments: {
        include: {
          client: { select: { name: true } },
          project: { select: { name: true } },
          task: { select: { title: true } },
          lead: { select: { contactName: true } },
        },
        take: 1,
      },
    },
    take: 100,
  })
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <Image size={16} className="text-blue-500" />
  return <FileText size={16} className="text-gray-500" />
}

export default async function FilesPage() {
  const files = await getFiles()
  return (
    <div>
      <Header title="Arquivos" subtitle={`${files.length} arquivos`} />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Arquivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Vinculado a</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {files.map(f => {
                const att = f.attachments[0]
                const linkedTo = att?.project?.name ?? att?.client?.name ?? att?.task?.title ?? att?.lead?.contactName ?? '—'
                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileIcon mime={f.mimeType} />
                        <span className="font-medium text-gray-900 truncate max-w-xs">{f.originalName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">{f.mimeType}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{linkedTo}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(f.createdAt)}</td>
                  </tr>
                )
              })}
              {files.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-gray-500 text-sm">Nenhum arquivo ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
