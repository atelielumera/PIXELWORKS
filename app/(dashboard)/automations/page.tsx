import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { Zap, CheckCircle, XCircle } from 'lucide-react'

async function getAutomations() {
  try {
    return await prisma.automation.findMany({
      include: { actions: true, _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead Criado', LEAD_STATUS_CHANGED: 'Status do Lead Alterado',
  DEAL_WON: 'Deal Ganho', DEAL_LOST: 'Deal Perdido',
  PROJECT_CREATED: 'Projeto Criado', TASK_COMPLETED: 'Tarefa Concluída',
  TASK_OVERDUE: 'Tarefa Atrasada', APPROVAL_APPROVED: 'Aprovação Aprovada',
  APPROVAL_REJECTED: 'Aprovação Rejeitada', PROPOSAL_APPROVED: 'Proposta Aprovada',
  CONTRACT_SIGNED: 'Contrato Assinado', BUDGET_EXCEEDED: 'Orçamento Excedido',
  SCHEDULE: 'Agendado', MANUAL: 'Manual',
}

export default async function AutomationsPage() {
  const automations = await getAutomations()
  return (
    <div>
      <Header title="Automações" subtitle="Regras automáticas entre CRM, projetos, tarefas e notificações" />
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-700">
          <p className="font-medium mb-1">⚡ Automações disponíveis</p>
          <p>As automações conectam automaticamente: CRM → Projetos, Tarefas → Agenda, Tarefas → Saúde do Projeto, Time Tracking → Custos e muito mais.</p>
        </div>
        <div className="space-y-3">
          {automations.map(auto => (
            <div key={auto.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${auto.isActive ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <Zap size={16} className={auto.isActive ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{auto.name}</h3>
                    {auto.description && <p className="text-sm text-gray-500">{auto.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        Gatilho: {TRIGGER_LABELS[auto.trigger] ?? auto.trigger}
                      </span>
                      <span className="text-xs text-gray-500">{auto._count.logs} execuções</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {auto.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={11} />Ativa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                      <XCircle size={11} />Inativa
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {automations.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Zap size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma automação configurada.</p>
              <p className="text-xs text-gray-400 mt-1">As automações do sistema são disparadas automaticamente pelos gatilhos definidos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
