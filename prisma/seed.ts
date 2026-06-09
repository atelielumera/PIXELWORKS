import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const solutions = [
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
]

// Estrutura real dos projetos PixelSAV baseada nos modelos do Asana
const templatesBySlug: Record<string, { section: string; name: string; isRequired?: boolean }[]> = {
  'projecao-mapeada': [
    { section: 'Arquivos de Referência', name: 'Plantas do espaço', isRequired: true },
    { section: 'Arquivos de Referência', name: 'Imagens 3D / Render' },
    { section: 'Arquivos de Referência', name: 'Vídeo de apresentação do espaço' },
    { section: 'Arquivos de Referência', name: 'Estudo de distância dos projetores', isRequired: true },
    { section: 'Arquivos de Referência', name: 'Memorial Descritivo', isRequired: true },
    { section: 'Equipamentos', name: 'Projetor(es)', isRequired: true },
    { section: 'Equipamentos', name: 'Servidor / Workstation', isRequired: true },
    { section: 'Equipamentos', name: 'Cabos e Infraestrutura' },
    { section: 'Equipamentos', name: 'Estrutura de fixação' },
    { section: 'Software/Design', name: 'Conteúdo de Projeção', isRequired: true },
    { section: 'Software/Design', name: 'Programação / Mapping', isRequired: true },
    { section: 'Software/Design', name: 'Testes e Calibração', isRequired: true },
    { section: 'Solução/Instalação', name: 'Auxiliar Técnico' },
    { section: 'Solução/Instalação', name: 'Técnico Responsável', isRequired: true },
    { section: 'Solução/Instalação', name: 'Entrega e Montagem', isRequired: true },
    { section: 'Solução/Instalação', name: 'Desmontagem' },
    { section: 'Geral', name: 'Relatório Final' },
  ],
  'sala-imersiva-360': [
    { section: 'Arquivos de Referência', name: 'Plantas e dimensões da sala', isRequired: true },
    { section: 'Arquivos de Referência', name: 'Especificação Técnica do Cliente' },
    { section: 'Equipamentos', name: 'Projetores (quantidade/modelo)', isRequired: true },
    { section: 'Equipamentos', name: 'Servidores / Workstations', isRequired: true },
    { section: 'Equipamentos', name: 'Sistema de som' },
    { section: 'Equipamentos', name: 'Tela / Estrutura' },
    { section: 'Software/Design', name: 'Conteúdo 360°', isRequired: true },
    { section: 'Software/Design', name: 'Programação Imersiva', isRequired: true },
    { section: 'Software/Design', name: 'Sistema de Controle' },
    { section: 'Solução/Instalação', name: 'Montagem da estrutura', isRequired: true },
    { section: 'Solução/Instalação', name: 'Alinhamento dos projetores', isRequired: true },
    { section: 'Solução/Instalação', name: 'Testes técnicos', isRequired: true },
    { section: 'Solução/Instalação', name: 'Operação do evento' },
    { section: 'Geral', name: 'Relatório Final' },
  ],
  'holografia': [
    { section: 'Arquivos de Referência', name: 'Plantas do espaço', isRequired: true },
    { section: 'Arquivos de Referência', name: 'Conceito criativo aprovado' },
    { section: 'Equipamentos', name: 'Display Holográfico / Hologauze', isRequired: true },
    { section: 'Equipamentos', name: 'Projetor / LED de alta luminosidade', isRequired: true },
    { section: 'Equipamentos', name: 'Workstation' },
    { section: 'Software/Design', name: 'Conteúdo Holográfico', isRequired: true },
    { section: 'Software/Design', name: 'Programação de Controle' },
    { section: 'Solução/Instalação', name: 'Instalação do display', isRequired: true },
    { section: 'Solução/Instalação', name: 'Testes e ajustes', isRequired: true },
    { section: 'Solução/Instalação', name: 'Operação' },
    { section: 'Geral', name: 'Relatório Final' },
  ],
  'museu-memorial': [
    { section: 'Arquivos de Referência', name: 'Plantas do espaço', isRequired: true },
    { section: 'Arquivos de Referência', name: 'Conceito expográfico' },
    { section: 'Arquivos de Referência', name: 'Textos e conteúdos curatoriais' },
    { section: 'Arquivos de Referência', name: 'Memorial Descritivo', isRequired: true },
    { section: 'Proposta', name: 'Proposta Técnica', isRequired: true },
    { section: 'Proposta', name: 'Proposta Comercial' },
    { section: 'Soluções Interativas', name: 'Linha do Tempo Interativa' },
    { section: 'Soluções Interativas', name: 'Realidade Aumentada p/ Maquetes' },
    { section: 'Soluções Interativas', name: 'Painel Interativo' },
    { section: 'Soluções Interativas', name: 'Projeção Mapeada' },
    { section: 'Equipamentos', name: 'Displays / Totens', isRequired: true },
    { section: 'Equipamentos', name: 'Frames Touchscreen' },
    { section: 'Equipamentos', name: 'Workstations', isRequired: true },
    { section: 'Software/Design', name: 'Desenvolvimento do conteúdo', isRequired: true },
    { section: 'Software/Design', name: 'Programação interativa', isRequired: true },
    { section: 'Solução/Instalação', name: 'Montagem e configuração', isRequired: true },
    { section: 'Solução/Instalação', name: 'Testes e homologação', isRequired: true },
    { section: 'Geral', name: 'Relatório Final' },
  ],
  'raio-x-interativo': [
    { section: 'Arquivos de Referência', name: 'Plantas e dimensões', isRequired: true },
    { section: 'Arquivos de Referência', name: 'Conceito aprovado' },
    { section: 'Equipamentos', name: 'Display Touchscreen', isRequired: true },
    { section: 'Equipamentos', name: 'Frame / Estrutura', isRequired: true },
    { section: 'Equipamentos', name: 'Workstation / Mini PC' },
    { section: 'Software/Design', name: 'Interface / UX Design', isRequired: true },
    { section: 'Software/Design', name: 'Desenvolvimento interativo', isRequired: true },
    { section: 'Solução/Instalação', name: 'Instalação física', isRequired: true },
    { section: 'Solução/Instalação', name: 'Testes de usabilidade', isRequired: true },
    { section: 'Geral', name: 'Relatório Final' },
  ],
}

// Template padrão para soluções sem estrutura específica
const defaultTemplateTasks = (solutionName: string) => [
  { section: 'Arquivos de Referência', name: 'Plantas e dimensões do espaço', isRequired: true },
  { section: 'Arquivos de Referência', name: 'Especificação técnica do cliente' },
  { section: 'Arquivos de Referência', name: 'Memorial descritivo' },
  { section: 'Equipamentos', name: `Equipamentos principais — ${solutionName}`, isRequired: true },
  { section: 'Equipamentos', name: 'Cabos e infraestrutura' },
  { section: 'Equipamentos', name: 'Workstation / Servidor' },
  { section: 'Software/Design', name: 'Conteúdo / Programação', isRequired: true },
  { section: 'Software/Design', name: 'Design das peças' },
  { section: 'Software/Design', name: 'Testes técnicos', isRequired: true },
  { section: 'Solução/Instalação', name: 'Auxiliar Técnico' },
  { section: 'Solução/Instalação', name: 'Técnico Responsável', isRequired: true },
  { section: 'Solução/Instalação', name: 'Montagem e configuração', isRequired: true },
  { section: 'Solução/Instalação', name: 'Desmontagem' },
  { section: 'Geral', name: 'Briefing', isRequired: true },
  { section: 'Geral', name: 'Proposta', isRequired: true },
  { section: 'Geral', name: 'Contrato', isRequired: true },
  { section: 'Geral', name: 'Relatório final' },
]

async function main() {
  console.log('🌱 Seeding PixelSAV WorkOS...')

  for (const [i, sol] of solutions.entries()) {
    await prisma.solution.upsert({
      where: { slug: sol.slug },
      update: {},
      create: { ...sol, sortOrder: i + 1, isActive: true },
    })
  }
  console.log('✓ Soluções PixelSAV criadas')

  const hash = await bcrypt.hash('pixelsav2025!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@pixelsav.com.br' },
    update: {},
    create: { name: 'Admin PixelSAV', email: 'admin@pixelsav.com.br', password: hash, role: 'SUPER_ADMIN' },
  })
  console.log('✓ Usuário admin criado: admin@pixelsav.com.br / pixelsav2025!')

  const allSolutions = await prisma.solution.findMany()
  for (const sol of allSolutions) {
    const tplName = `Template ${sol.name}`
    const exists = await prisma.projectTemplate.findFirst({ where: { name: tplName } })
    if (!exists) {
      const tasks = templatesBySlug[sol.slug] ?? defaultTemplateTasks(sol.name)
      await prisma.projectTemplate.create({
        data: {
          name: tplName,
          solutionId: sol.id,
          isDefault: true,
          tasks: {
            create: tasks.map((t, i) => ({
              name: t.name,
              section: t.section,
              sortOrder: i + 1,
              isRequired: t.isRequired ?? false,
            })),
          },
        },
      })
    }
  }
  console.log('✓ Templates de projeto criados com seções reais')
  console.log('✅ Seed concluído!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
