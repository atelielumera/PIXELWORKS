import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus } from 'lucide-react'

async function getClients() {
  return prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { projects: true, deals: true, leads: true } },
    },
  })
}

export default async function ClientsPage() {
  const clients = await getClients()
  return (
    <div>
      <Header title="Clientes" subtitle={`${clients.length} clientes cadastrados`} />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Link href="/crm/clients/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Novo Cliente
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[minmax(180px,2fr)_minmax(140px,1fr)_80px_70px_70px_70px_80px] px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div>Nome</div>
            <div>Empresa</div>
            <div>Status</div>
            <div className="text-center">Projetos</div>
            <div className="text-center">Deals</div>
            <div className="text-center">Leads</div>
            <div>Email</div>
          </div>

          {clients.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">
              Nenhum cliente cadastrado.{' '}
              <Link href="/crm/clients/new" className="text-blue-600 hover:underline">Criar primeiro cliente</Link>
            </div>
          )}

          {clients.map((client, idx) => (
            <Link
              key={client.id}
              href={`/crm/clients/${client.id}`}
              className={`grid grid-cols-[minmax(180px,2fr)_minmax(140px,1fr)_80px_70px_70px_70px_80px] px-4 py-3 items-center border-b border-gray-100 last:border-0 hover:bg-blue-50/40 transition-colors group ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600">{client.name}</span>
              </div>
              <div className="text-sm text-gray-500 truncate">{client.company ?? <span className="text-gray-300">—</span>}</div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${client.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                  {client.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="text-center text-xs text-gray-600 font-medium">{client._count.projects}</div>
              <div className="text-center text-xs text-gray-600 font-medium">{client._count.deals}</div>
              <div className="text-center text-xs text-gray-600 font-medium">{client._count.leads}</div>
              <div className="text-xs text-gray-400 truncate">{client.email ?? '—'}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
