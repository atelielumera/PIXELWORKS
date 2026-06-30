import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import Link from 'next/link'

async function getContacts() {
  try {
    return await prisma.contact.findMany({
      orderBy: { name: 'asc' },
      include: { client: { select: { id: true, name: true } } },
      take: 200,
    })
  } catch {
    return []
  }
}

export default async function ContactsPage() {
  const contacts = await getContacts()
  return (
    <div>
      <Header title="Contatos" subtitle={`${contacts.length} contatos cadastrados`} />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa / Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">E-mail</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">WhatsApp / Tel.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Nenhum contato cadastrado. Adicione contatos a partir da página de Clientes.
                  </td>
                </tr>
              )}
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{c.name}</span>
                      {c.isPrimary && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">Principal</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.role ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.client ? (
                      <Link href={`/crm/clients/${c.client.id}`} className="text-blue-600 hover:underline text-sm">
                        {c.client.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-xs">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell text-xs">{c.whatsapp ?? c.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
