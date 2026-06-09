'use client'

import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Send, Bot, User, Zap } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  'Resumir os leads mais recentes',
  'Analisar o pipeline comercial',
  'Quais projetos estão em risco?',
  'Gerar checklist para Projeção Mapeada',
  'Sugerir perguntas de qualificação de lead',
  'Quais tarefas estão atrasadas?',
  'Gerar escopo preliminar para Sala Imersiva 360°',
  'Sugerir próximas ações comerciais',
]

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Olá! Sou o assistente de IA do PixelSAV WorkOS. Posso ajudar com análise de leads, escopos de projeto, checklists operacionais, análise de pipeline e muito mais. O que você precisa?',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    setLoading(true)
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content ?? 'Erro ao processar resposta.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA. Verifique a chave da API.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="IA PixelSAV" subtitle="Assistente inteligente para operações e comercial" />
      <div className="flex flex-1 overflow-hidden">
        {/* Quick prompts sidebar */}
        <div className="w-56 bg-gray-50 border-r border-gray-200 p-3 overflow-y-auto hidden lg:block">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ações Rápidas</p>
          <div className="space-y-1">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => sendMessage(p)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all">
                <Zap size={11} className="inline mr-1.5 text-blue-500" />{p}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                    <User size={16} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={e => { e.preventDefault(); sendMessage() }} className="flex gap-2">
              <input
                value={input} onChange={e => setInput(e.target.value)}
                placeholder="Pergunte sobre leads, projetos, pipeline, checklists..."
                disabled={loading}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
