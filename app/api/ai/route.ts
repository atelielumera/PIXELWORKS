import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AI_SYSTEM_PROMPT } from '@/lib/constants'
import { prisma } from '@/lib/db'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    // Coletar contexto do sistema quando relevante
    let systemContext = AI_SYSTEM_PROMPT
    if (context?.enrichData) {
      const [leadsCount, projectsActive, pendingApprovals] = await Promise.all([
        prisma.lead.count({ where: { status: { notIn: ['WON', 'LOST', 'NO_FIT'] } } }),
        prisma.project.count({ where: { status: { in: ['PLANNING', 'IN_PROGRESS'] } } }),
        prisma.approval.count({ where: { status: 'PENDING' } }),
      ])
      systemContext += `\n\nDados atuais do sistema:\n- Leads ativos: ${leadsCount}\n- Projetos ativos: ${projectsActive}\n- Aprovações pendentes: ${pendingApprovals}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemContext,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('AI error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
