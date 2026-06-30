import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate, formatDateTime } from '@/lib/utils'

const EVENT_TYPE_LABELS: Record<string, string> = {
  EVENT: 'Evento', SETUP: 'Montagem', OPERATION: 'Operação', TEARDOWN: 'Desmontagem',
  MEETING: 'Reunião', DEADLINE: 'Prazo', FOLLOW_UP: 'Follow-up',
  CONTENT_DELIVERY: 'Entrega de Conteúdo', CONTRACT_EXPIRY: 'Venc. Contrato',
  PROJECT_MILESTONE: 'Marco de Projeto', OTHER: 'Outro',
}

const EVENT_COLORS: Record<string, string> = {
  EVENT: 'bg-blue-50 text-blue-700 border-blue-200',
  SETUP: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  OPERATION: 'bg-green-50 text-green-700 border-green-200',
  TEARDOWN: 'bg-orange-50 text-orange-700 border-orange-200',
  MEETING: 'bg-purple-50 text-purple-700 border-purple-200',
  DEADLINE: 'bg-red-50 text-red-700 border-red-200',
  FOLLOW_UP: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
}

async function getEvents() {
  try {
    return await prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      include: {
        project: { select: { id: true, name: true, solution: { select: { name: true, color: true } } } },
        task: { select: { id: true, title: true } },
      },
      take: 100,
    })
  } catch {
    return []
  }
}

async function getPastEvents() {
  try {
    return await prisma.event.findMany({
      where: { startDate: { lt: new Date() } },
      orderBy: { startDate: 'desc' },
      include: { project: { select: { id: true, name: true } } },
      take: 30,
    })
  } catch {
    return []
  }
}

export default async function AgendaPage() {
  const [upcoming, past] = await Promise.all([getEvents(), getPastEvents()])

  const grouped: Record<string, typeof upcoming> = {}
  for (const ev of upcoming) {
    const key = formatDate(ev.startDate)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ev)
  }

  return (
    <div>
      <Header title="Agenda Operacional" subtitle="Eventos, montagens, operações e prazos" />
      <div className="p-6 space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Nenhum evento próximo.</p>
          </div>
        )}
        {Object.entries(grouped).map(([date, events]) => (
          <div key={date}>
            <h3 className="font-semibold text-gray-900 mb-3">{date}</h3>
            <div className="space-y-2">
              {events.map(ev => (
                <div key={ev.id} className={`flex items-start gap-4 bg-white border rounded-xl p-4 ${EVENT_COLORS[ev.type] ?? EVENT_COLORS.OTHER}`}>
                  <div className="text-center min-w-16">
                    <div className="text-xs font-medium opacity-70">
                      {new Date(ev.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {ev.endDate && (
                      <div className="text-xs opacity-50">
                        {new Date(ev.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{ev.title}</p>
                    {ev.description && <p className="text-sm opacity-75 mt-0.5">{ev.description}</p>}
                    {ev.project && (
                      <p className="text-xs opacity-60 mt-1">
                        Projeto: {ev.project.name}
                        {ev.project.solution && ` • ${ev.project.solution.name}`}
                      </p>
                    )}
                    {ev.location && <p className="text-xs opacity-60">📍 {ev.location}</p>}
                  </div>
                  <span className="text-xs font-medium shrink-0 opacity-80">{EVENT_TYPE_LABELS[ev.type]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {past.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-600 mb-3">Eventos Passados</h3>
            <div className="space-y-1.5">
              {past.map(ev => (
                <div key={ev.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5">
                  <div>
                    <p className="text-sm text-gray-600">{ev.title}</p>
                    <p className="text-xs text-gray-400">{ev.project?.name}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(ev.startDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
