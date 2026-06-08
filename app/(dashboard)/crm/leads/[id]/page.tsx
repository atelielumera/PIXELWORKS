import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { PIPELINE_STAGES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowLeft, Edit, Users, Calendar, MapPin, DollarSign } from 'lucide-react'

async function getLead(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      solution: true,
      responsible: { select: { id: true, name: true, email: true } },
      client: true,
      deals: { include: { solution: true } },
      files: { include: { file: true } },
    },
  })
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await getLead(id)
  if (!lead) notFound()

  const stage = PIPELINE_STAGES.find(s => s.key === lead.status)

  return (
    <div>
      <Header title={lead.contactName} subtitle={lead.company ?? 'Lead'} />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/crm/leads" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} />Leads
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{lead.contactName}</h2>
                  <p className="text-gray-500">{lead.company}</p>
                </div>
                {stage && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: `${stage.color}20`, color: stage.color ?? undefined }}>
                    {stage.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon={Users} label="WhatsApp" value={lead.whatsapp} />
                <InfoRow icon={Users} label="E-mail" value={lead.email} />
                <InfoRow icon={MapPin} label="Localização" value={[lead.city, lead.state].filter(Boolean).join(', ')} />
                <InfoRow icon={Calendar} label="Data do Evento" value={formatDate(lead.eventDate)} />
                <InfoRow icon={MapPin} label="Local" value={lead.eventLocation} />
                <InfoRow icon={DollarSign} label="Orçamento" value={formatCurrency(lead.budget ? Number(lead.budget) : null)} />
                <InfoRow icon={Calendar} label="Período" value={lead.rentalPeriod} />
                <InfoRow icon={Users} label="Tipo" value={lead.type === 'TEMPORARY_EVENT' ? 'Evento Temporário' : lead.type === 'FIXED_INSTALLATION' ? 'Instalação Fixa' : null} />
              </div>
              {lead.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Observações</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Deals */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Deals ({lead.deals.length})</h3>
                <Link href={`/crm/deals/new?leadId=${lead.id}`} className="text-xs text-blue-600 hover:underline">+ Criar Deal</Link>
              </div>
              {lead.deals.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum deal associado.</p>
              ) : lead.deals.map(deal => (
                <Link key={deal.id} href={`/crm/deals/${deal.id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:text-blue-600">
                  <span className="text-sm">{deal.title}</span>
                  <span className="text-sm font-medium">{formatCurrency(deal.value ? Number(deal.value) : null)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Solução PixelSAV</p>
              {lead.solution ? (
                <span className="inline-block text-sm px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${lead.solution.color}20`, color: lead.solution.color ?? undefined }}>
                  {lead.solution.name}
                </span>
              ) : <p className="text-sm text-gray-500">Não definida</p>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Responsável</p>
              <p className="text-sm text-gray-900">{lead.responsible?.name ?? 'Não atribuído'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Próxima Ação</p>
              <p className="text-sm text-gray-900">{lead.nextAction ?? '—'}</p>
              {lead.nextActionDate && (
                <p className="text-xs text-gray-500 mt-1">{formatDate(lead.nextActionDate)}</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Datas</p>
              <p className="text-xs text-gray-500">Criado: {formatDateTime(lead.createdAt)}</p>
              <p className="text-xs text-gray-500">Atualizado: {formatDateTime(lead.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  )
}
