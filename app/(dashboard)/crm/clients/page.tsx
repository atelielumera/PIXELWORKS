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
        <div className="flex gap-3 mb-5">
          <Link href="/crm/clients/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} />Novo Cliente
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <Link key={client.id} href={`/crm/clients/${client.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${client.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                  {client.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mt-3">{client.name}</h3>
              {client.company && <p className="text-sm text-gray-500">{client.company}</p>}
              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                <span>{client._count.projects} projetos</span>
                <span>{client._count.deals} deals</span>
                <span>{client._count.leads} leads</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
