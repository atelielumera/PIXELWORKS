import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, Clock } from 'lucide-react'

async function getApprovals() {
  try {
    return await prisma.approval.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      take: 100,
    })
  } catch {
    return []
  }
}

const STATUS_CONFIG: Record<string, { label: string; style: string; Icon: React.ElementType }> = {
  PENDING: { label: 'Pendente', style: 'bg-yellow-50 text-yellow-700', Icon: Clock },
  APPROVED: { label: 'Aprovado', style: 'bg-green-50 text-green-700', Icon: ThumbsUp },
  REJECTED: { label: 'Rejeitado', style: 'bg-red-50 text-red-700', Icon: ThumbsDown },
  CANCELLED: { label: 'Cancelado', style: 'bg-gray-50 text-gray-600', Icon: Clock },
}

export default async function ApprovalsPage() {
  const approvals = await getApprovals()
  const pending = approvals.filter(a => a.status === 'PENDING').length

  return (
    <div>
      <Header title="Aprovações" subtitle={`${pending} pendente${pending !== 1 ? 's' : ''}`} />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Projeto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {approvals.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">Nenhuma aprovação.</td></tr>
              )}
              {approvals.map(ap => {
                const cfg = STATUS_CONFIG[ap.status] ?? STATUS_CONFIG.PENDING
                return (
                  <tr key={ap.id} className={`hover:bg-gray-50 transition-colors ${ap.status === 'PENDING' ? 'bg-yellow-50/20' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{ap.title}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-xs">{ap.type}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {ap.project ? <Link href={`/projects/${ap.project.id}`} className="text-blue-600 hover:underline text-xs">{ap.project.name}</Link> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.style}`}>
                        <cfg.Icon size={11} />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">{ap.assignee?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDate(ap.dueDate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
