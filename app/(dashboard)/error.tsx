'use client'

import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white border border-red-200 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar</h2>
        <p className="text-sm text-gray-600 mb-6">
          Ocorreu um problema ao conectar com o banco de dados. Tente novamente em alguns segundos.
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={14} />Tentar novamente
        </button>
      </div>
    </div>
  )
}
