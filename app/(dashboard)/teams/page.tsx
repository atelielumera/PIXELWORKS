import { Header } from '@/components/layout/header'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

async function getTeams() {
  return prisma.team.findMany({
    orderBy: { name: 'asc' },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true, department: true } } },
      },
    },
  })
}

async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
  })
}

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700',
  ADMIN: 'bg-orange-50 text-orange-700',
  MANAGER: 'bg-blue-50 text-blue-700',
  MEMBER: 'bg-gray-50 text-gray-600',
  VIEWER: 'bg-gray-50 text-gray-500',
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', MANAGER: 'Gerente', MEMBER: 'Membro', VIEWER: 'Visualizador',
}

export default async function TeamsPage() {
  const [teams, users] = await Promise.all([getTeams(), getUsers()])

  return (
    <div>
      <Header title="Equipes" subtitle={`${teams.length} equipes • ${users.length} membros`} />
      <div className="p-6 space-y-6">
        {teams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Equipes Cadastradas</h3>
              <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">Gerenciar</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: team.color ?? '#3B82F6' }}>
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{team.name}</h4>
                      {team.description && <p className="text-xs text-gray-500 mt-0.5">{team.description}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {team.members.slice(0, 4).map(m => (
                      <div key={m.userId} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {m.user.name.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-700 flex-1 truncate">{m.user.name}</span>
                        <span className="text-xs text-gray-400">{m.role}</span>
                      </div>
                    ))}
                    {team.members.length > 4 && (
                      <p className="text-xs text-gray-400">+{team.members.length - 4} membros</p>
                    )}
                    {team.members.length === 0 && (
                      <p className="text-xs text-gray-400">Nenhum membro</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{team.members.length} membro{team.members.length !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={16} />Todos os Membros da PixelSAV
            </h3>
            <Link href="/admin/users" className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={13} />Novo membro
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Membro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Departamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Papel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">Nenhum usuário cadastrado.</td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-sm">{u.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role] ?? 'bg-gray-50 text-gray-600'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
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
    </div>
  )
}
