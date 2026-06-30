'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function ProjectError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={36} />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Erro ao carregar projeto</h2>
        <p className="text-sm text-gray-600 mb-6">
          Ocorreu um problema ao carregar os dados. Tente novamente ou volte para a lista de projetos.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={14} />Tentar novamente
          </button>
          <Link
            href="/projects"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={14} />Voltar
          </Link>
        </div>
      </div>
    </div>
  )
}
