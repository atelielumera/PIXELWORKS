import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getTemplates() {
  try {
    return await prisma.projectTemplate.findMany({
      include: { solution: true, _count: { select: { tasks: true } } },
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplates()
  return (
    <div>
      <Header title="Templates de Projeto" subtitle="Templates padrão por solução PixelSAV" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(tpl => (
            <Link key={tpl.id} href={`/projects/templates/${tpl.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer block">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{tpl.name}</h3>
                  {tpl.solution && (
                    <span className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${tpl.solution.color}20`, color: tpl.solution.color ?? undefined }}>
                      {tpl.solution.name}
                    </span>
                  )}
                </div>
                {tpl.isDefault && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Padrão</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">{tpl._count.tasks} tarefas</p>
                <span className="text-xs text-blue-600 font-medium">Ver tarefas →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
