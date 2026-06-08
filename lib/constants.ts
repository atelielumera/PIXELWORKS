export const PIXELSAV_SOLUTIONS = [
  { name: 'Projeção Mapeada', slug: 'projecao-mapeada', category: 'Projeção', color: '#3B82F6' },
  { name: 'Sala Imersiva 360°', slug: 'sala-imersiva-360', category: 'Imersão', color: '#8B5CF6' },
  { name: 'Domo 360°', slug: 'domo-360', category: 'Imersão', color: '#6366F1' },
  { name: 'Holografia', slug: 'holografia', category: 'Holografia', color: '#F59E0B' },
  { name: 'DOOH 3D Anamórfico', slug: 'dooh-3d-anamrofico', category: 'Digital OOH', color: '#EF4444' },
  { name: 'Realidade Aumentada', slug: 'realidade-aumentada', category: 'AR/VR', color: '#10B981' },
  { name: 'Realidade Virtual', slug: 'realidade-virtual', category: 'AR/VR', color: '#14B8A6' },
  { name: 'Piso Interativo', slug: 'piso-interativo', category: 'Interativo', color: '#F97316' },
  { name: 'Parede Interativa', slug: 'parede-interativa', category: 'Interativo', color: '#EC4899' },
  { name: 'Raio-X Interativo', slug: 'raio-x-interativo', category: 'Interativo', color: '#84CC16' },
  { name: 'Museu & Memorial', slug: 'museu-memorial', category: 'Instalação Fixa', color: '#78716C' },
  { name: 'Instalação Fixa', slug: 'instalacao-fixa', category: 'Instalação Fixa', color: '#6B7280' },
  { name: 'Ativação Interativa', slug: 'ativacao-interativa', category: 'Eventos', color: '#F59E0B' },
  { name: 'Experiência Imersiva', slug: 'experiencia-imersiva', category: 'Imersão', color: '#8B5CF6' },
  { name: 'Conteúdo Motion', slug: 'conteudo-motion', category: 'Conteúdo', color: '#3B82F6' },
  { name: 'Operação Técnica', slug: 'operacao-tecnica', category: 'Operação', color: '#64748B' },
  { name: 'Locação de Equipamentos', slug: 'locacao-equipamentos', category: 'Locação', color: '#94A3B8' },
  { name: 'Desenvolvimento Sob Medida', slug: 'desenvolvimento-sob-medida', category: 'Desenvolvimento', color: '#06B6D4' },
] as const

export const PIPELINE_STAGES = [
  { key: 'NEW', label: 'Novo Lead', color: '#6B7280' },
  { key: 'WAITING_RESPONSE', label: 'Aguardando Respostas', color: '#3B82F6' },
  { key: 'QUALIFIED', label: 'Qualificado', color: '#8B5CF6' },
  { key: 'SEND_TO_TECHNICAL', label: 'Enviar p/ Técnica', color: '#F59E0B' },
  { key: 'TECHNICAL_ANALYSIS', label: 'Em Análise Técnica', color: '#F97316' },
  { key: 'PRICING', label: 'Precificação', color: '#EF4444' },
  { key: 'PROPOSAL_DRAFTING', label: 'Proposta em Elaboração', color: '#10B981' },
  { key: 'PROPOSAL_SENT', label: 'Proposta Enviada', color: '#14B8A6' },
  { key: 'NEGOTIATION', label: 'Negociação', color: '#6366F1' },
  { key: 'WON', label: 'Fechado Ganho', color: '#22C55E' },
  { key: 'LOST', label: 'Fechado Perdido', color: '#EF4444' },
  { key: 'NO_FIT', label: 'Sem Fit / Orçamento Incompatível', color: '#9CA3AF' },
] as const

export const PROJECT_STATUSES = [
  { key: 'DRAFT', label: 'Rascunho', color: '#9CA3AF' },
  { key: 'PLANNING', label: 'Planejamento', color: '#3B82F6' },
  { key: 'IN_PROGRESS', label: 'Em Andamento', color: '#10B981' },
  { key: 'ON_HOLD', label: 'Em Pausa', color: '#F59E0B' },
  { key: 'AT_RISK', label: 'Em Risco', color: '#EF4444' },
  { key: 'COMPLETED', label: 'Concluído', color: '#22C55E' },
  { key: 'CANCELLED', label: 'Cancelado', color: '#6B7280' },
] as const

export const TASK_STATUSES = [
  { key: 'TODO', label: 'A Fazer', color: '#9CA3AF' },
  { key: 'IN_PROGRESS', label: 'Em Andamento', color: '#3B82F6' },
  { key: 'IN_REVIEW', label: 'Em Revisão', color: '#F59E0B' },
  { key: 'DONE', label: 'Concluído', color: '#22C55E' },
  { key: 'CANCELLED', label: 'Cancelado', color: '#6B7280' },
] as const

export const LEAD_ORIGINS = [
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'LINKEDIN', label: 'LinkedIn' },
  { key: 'REFERRAL', label: 'Indicação' },
  { key: 'GOOGLE', label: 'Google' },
  { key: 'COLD_OUTREACH', label: 'Prospecção Ativa' },
  { key: 'INBOUND_SITE', label: 'Site' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'EXHIBITION', label: 'Feira / Evento' },
  { key: 'PARTNERSHIP', label: 'Parceria' },
  { key: 'OTHER', label: 'Outro' },
] as const

export const DEFAULT_TEMPLATE_TASKS = [
  'Briefing', 'Levantamento técnico', 'Medidas do espaço', 'Análise de viabilidade',
  'Lista de equipamentos', 'Conteúdo necessário', 'Orçamento', 'Proposta', 'Contrato',
  'Pré-produção', 'Logística', 'Montagem', 'Testes', 'Operação',
  'Desmontagem', 'Pós-evento', 'Relatório final',
] as const

export const AI_SYSTEM_PROMPT = `Você é o assistente de IA do PixelSAV WorkOS, sistema interno de gestão da PixelSAV.

A PixelSAV é especializada em: Projeção Mapeada, Sala Imersiva 360°, Domo 360°, Holografia,
DOOH 3D Anamórfico, Realidade Aumentada/Virtual, Piso e Parede Interativa, Raio-X Interativo,
Museu & Memorial, Instalação Fixa, Ativação Interativa, Experiência Imersiva, Conteúdo Motion,
Operação Técnica, Locação de Equipamentos e Desenvolvimento Sob Medida.

Funções: resumir leads, gerar perguntas de qualificação, sugerir viabilidade de projetos,
identificar orçamentos incompatíveis, gerar escopos preliminares, sugerir templates de tarefas,
analisar pipeline, gerar relatórios pós-evento, sugerir próximas ações comerciais,
identificar riscos técnicos e criar checklists operacionais.

Sempre responda em português do Brasil. Seja objetivo e técnico.`
