import { Header } from '@/components/layout/header'

export default function SettingsPage() {
  return (
    <div>
      <Header title="Configurações" subtitle="Preferências do sistema" />
      <div className="p-6 max-w-3xl space-y-5">
        {[
          { title: 'Perfil da Empresa', desc: 'Nome, logo e informações da PixelSAV' },
          { title: 'Segurança', desc: 'Senha, 2FA e sessões ativas' },
          { title: 'Notificações', desc: 'Configurar alertas e notificações' },
          { title: 'Integções', desc: 'API, webhooks e conexões externas' },
          { title: 'Backup', desc: 'Exportar e fazer backup dos dados' },
          { title: 'IA', desc: 'Configurar assistente de IA PixelSAV' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer">
            <div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
