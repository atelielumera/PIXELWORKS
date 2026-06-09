import type { User, Lead, Client, Deal, Project, Task, Proposal, Contract, Solution } from '@prisma/client'

export type SafeUser = Omit<User, 'password'>

export type LeadWithRelations = Lead & {
  solution?: Solution | null
  responsible?: SafeUser | null
  client?: Client | null
  _count?: { deals: number; files: number }
}

export type DealWithRelations = Deal & {
  client?: Client | null
  lead?: Lead | null
  solution?: Solution | null
  responsible?: SafeUser | null
}

export type ProjectWithRelations = Project & {
  client?: Client | null
  solution?: Solution | null
  members?: Array<{ user: SafeUser; role: string }>
  _count?: { tasks: number }
}

export type TaskWithRelations = Task & {
  project?: Project | null
  assignees?: Array<{ user: SafeUser }>
  _count?: { subtasks: number }
}

export interface DashboardStats {
  leads: { total: number; new: number; waiting: number }
  deals: { open: number; won: number; lost: number; totalValue: number }
  projects: { active: number; atRisk: number; completed: number }
  tasks: { overdue: number; dueToday: number; pending: number }
  approvals: { pending: number }
  upcomingEvents: number
  revenue: { forecast: number; closed: number }
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
