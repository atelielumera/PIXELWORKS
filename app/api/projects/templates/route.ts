import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const templates = await prisma.projectTemplate.findMany({
    include: { solution: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ data: templates })
}
