export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { ProjectDetailClient } from './ProjectDetailClient'

async function getProject(id: string) {
  try {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        solution: true,
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        tasks: {
          where: { parentId: null },
          orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
          include: { assignees: { include: { user: { select: { id: true, name: true } } } }, _count: { select: { subtasks: true } } },
          take: 200,
        },
        costs: { orderBy: { createdAt: 'desc' } },
        sections: { orderBy: { sortOrder: 'asc' } },
      },
    })
  } catch (err) {
    console.error('Error loading project:', err)
    return null
  }
}

async function getUsers() {
  try {
    return await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, department: true, avatar: true },
    })
  } catch {
    return []
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, users] = await Promise.all([getProject(id), getUsers()])
  if (!project) notFound()

  // Prisma Decimal fields are not serializable across the server→client boundary.
  // JSON round-trip converts them to plain strings/numbers.
  const projectData = JSON.parse(JSON.stringify(project))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title={project.name} subtitle={project.client?.name ?? 'Projeto'} />
      <div className="flex-1 overflow-hidden">
        <ProjectDetailClient project={projectData} users={users} />
      </div>
    </div>
  )
}
