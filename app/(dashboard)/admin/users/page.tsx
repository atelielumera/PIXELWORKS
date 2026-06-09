import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true, _count: { select: { taskAssignments: true } } },
  })
}

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700',
  ADMIN: 'bg-orange-50 text-orange-700',
  MANAGER: 'bg-blue-50 text-blue-700',
  MEMBER: 'bg-gray-50 text-gray-600',
  VIEWER: 'bg-gray-50 text-gray-500',
}

export default async function UsersPage() {
  const users = await getUsers()
  return (
    <div>
      <Header title="Usuários" subtitle={`${users.length} usuários`} />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Departamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Papel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{u.department ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
