import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined, fmt = 'dd/MM/yyyy') {
  if (!date) return '-'
  return format(new Date(date), fmt, { locale: ptBR })
}

export function formatDateTime(date: Date | string | null | undefined) {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })
}

export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return `${value.toFixed(1)}%`
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function generateCode(prefix: string) {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${year}${month}-${random}`
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
