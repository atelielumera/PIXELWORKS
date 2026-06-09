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

  // Usuários reais PixelSAV
  const pixelsavHash = await bcrypt.hash('PixelSAV@123', 12)
  const pixelsavUsers = [
    { name: 'Flávio Dantas',  email: 'flaviodantas@pixelsav.com.br', role: 'ADMIN' },
    { name: 'Denise Dantas',  email: 'denisedantas@pixelsav.com.br', role: 'ADMIN' },
    { name: 'Emily',          email: 'emily@pixelsav.com.br',         role: 'ADMIN' },
    { name: 'Caron',          email: 'caron@pixelsav.com.br',         role: 'ADMIN' },
    { name: 'Fernando',       email: 'atendimento@pixelsav.com.br',   role: 'ADMIN' },
  ]
  const createdUsers: { id: string; name: string }[] = []
  for (const u of pixelsavUsers) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role as any },
      create: { name: u.name, email: u.email, password: pixelsavHash, role: u.role as any },
    })
    createdUsers.push({ id: created.id, name: created.name })
    console.log(`  ✓ Usuário: ${u.name} (${u.email})`)
  }
  console.log('✓ Usuários PixelSAV criados')

  // Equipe PixelSAV
  let team = await prisma.team.findFirst({ where: { name: 'PixelSAV' } })
  if (!team) {
    team = await prisma.team.create({ data: { name: 'PixelSAV', description: 'Equipe PixelSAV', color: '#3B82F6' } })
  }
  for (const u of createdUsers) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: u.id } },
      update: {},
      create: { teamId: team.id, userId: u.id, role: 'admin' },
    })
  }
  console.log('✓ Equipe PixelSAV criada com 5 membros')

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

  // ============================================================
  // PROJETOS REAIS DA PIXELSAV
  // ============================================================
  const solBySlug = Object.fromEntries(allSolutions.map(s => [s.slug, s]))
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@pixelsav.com.br' } })

  // Clientes reais
  const clientsData = [
    { name: 'Straub', email: 'contato@straub.com.br' },
    { name: 'Capra', email: 'contato@capra.com.br' },
    { name: 'Komm', email: 'contato@komm.com.br' },
    { name: 'Shopping Mueller', email: 'contato@shopMueller.com.br' },
    { name: 'Vale', email: 'contato@vale.com.br' },
    { name: 'DSM', email: 'contato@dsm.com.br' },
  ]
  const clientMap: Record<string, string> = {}
  for (const c of clientsData) {
    const existing = await prisma.client.findFirst({ where: { name: c.name } })
    if (existing) { clientMap[c.name] = existing.id }
    else {
      const created = await prisma.client.create({ data: { name: c.name, email: c.email } })
      clientMap[c.name] = created.id
    }
  }
  console.log('✓ Clientes reais criados')

  // Projetos reais com tarefas do Asana
  const realProjects = [
    {
      name: 'Straub - MPA Água e Cultura',
      clientName: 'Straub',
      solutionSlug: 'projecao-mapeada',
      status: 'IN_PROGRESS',
      tasks: [
        { section: 'Arquivos de Referência', title: 'Plantas Camila Novak 21.05.2026', prestador: 'Caron' },
        { section: 'Arquivos de Referência', title: 'Plantas Camila Novak 27.05.2026', prestador: 'Caron' },
        { section: 'Arquivos de Referência', title: 'Imagens 3D Straub', prestador: 'Caron' },
        { section: 'Arquivos de Referência', title: 'Vídeo 3D de apresentação do espaço', prestador: 'Caron' },
        { section: 'Arquivos de Referência', title: 'Estudo de distância dos projetores', prestador: 'Caron' },
        { section: 'Arquivos de Referência', title: 'Memorial Descritivo MPA Água e Cultura', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Projeção Indígena', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Mesa Interativa - Poço d\'água', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Teatro Holográfico Água e Purificação', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Display 24" Transparente', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Projeção Espiritualidade', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Projeção Contemplativa', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Dúvida Posição Projetor', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Projeção Gastronomia', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Projeção Esportes/Banho', prestador: 'Caron' },
        { section: 'Conteúdo', title: 'Mosaico Cinema e Música', prestador: 'Caron' },
        { section: 'Geral', title: 'Relatório Final' },
      ],
    },
    {
      name: 'Galeria Capra 2026',
      clientName: 'Capra',
      solutionSlug: 'experiencia-imersiva',
      status: 'IN_PROGRESS',
      tasks: [
        { section: 'Experiências', title: 'Minerador Holográfico' },
        { section: 'Experiências', title: 'Show de Sombras e Luzes' },
        { section: 'Experiências', title: 'Túnel Energize-se' },
        { section: 'Experiências', title: 'Olho da Terra' },
        { section: 'Experiências', title: 'Galeria dos Minerais' },
        { section: 'Experiências', title: 'Caverna Imersiva Capra' },
        { section: 'Geral', title: 'Relatório Final' },
      ],
    },
    {
      name: 'Komm - Positivo',
      clientName: 'Komm',
      solutionSlug: 'raio-x-interativo',
      status: 'IN_PROGRESS',
      tasks: [
        { section: 'Equipamentos', title: 'Frames Touchscreen', prestador: 'Caron' },
        { section: 'Equipamentos', title: 'Workstations', prestador: 'Caron' },
        { section: 'Equipamentos', title: 'Racks Servidor 44U', prestador: 'Caron' },
        { section: 'Equipamentos', title: 'Kits de Ventilação Duplo - Flex', prestador: 'Caron' },
        { section: 'Software/Design', title: 'Programação Interativa' },
        { section: 'Solução/Instalação', title: 'Montagem e Configuração dos Racks (Piloto)', prestador: 'Caron' },
        { section: 'Solução/Instalação', title: 'Entrega em Curitiba', prestador: 'Caron' },
        { section: 'Geral', title: 'Relatório Final' },
      ],
    },
    {
      name: 'Shopping Mueller - Jogo de Futebol',
      clientName: 'Shopping Mueller',
      solutionSlug: 'piso-interativo',
      status: 'IN_PROGRESS',
      tasks: [
        { section: 'Equipamentos', title: 'Tela de Led', prestador: 'Caron' },
        { section: 'Equipamentos', title: 'Suporte p/ Sensor Lidar', prestador: 'Caron' },
        { section: 'Equipamentos', title: 'Sensor Lidar', prestador: 'Caron' },
        { section: 'Equipamentos', title: 'Workstation', prestador: 'Caron' },
        { section: 'Software/Design', title: 'Programação Jogo de Futebol 1', prestador: 'Caron' },
        { section: 'Software/Design', title: 'Design', prestador: 'Caron' },
        { section: 'Solução/Instalação', title: 'Auxiliar Técnico', prestador: 'Caron' },
        { section: 'Solução/Instalação', title: 'Técnico Responsável', prestador: 'Caron' },
        { section: 'Geral', title: 'Relatório Final' },
      ],
    },
    {
      name: 'Vale - Sala Imersiva BH',
      clientName: 'Vale',
      solutionSlug: 'sala-imersiva-360',
      status: 'IN_PROGRESS',
      tasks: [
        { section: 'Arquivos de Referência', title: 'Plantas e dimensões da sala' },
        { section: 'Equipamentos', title: 'Projetores (quantidade/modelo)' },
        { section: 'Equipamentos', title: 'Servidores / Workstations' },
        { section: 'Software/Design', title: 'Conteúdo 360°' },
        { section: 'Software/Design', title: 'Programação Imersiva' },
        { section: 'Solução/Instalação', title: 'Montagem da estrutura' },
        { section: 'Solução/Instalação', title: 'Alinhamento dos projetores' },
        { section: 'Geral', title: 'Relatório Final' },
      ],
    },
    {
      name: 'Vale - Memorial Serra Sul',
      clientName: 'Vale',
      solutionSlug: 'museu-memorial',
      status: 'IN_PROGRESS',
      tasks: [
        { section: 'Arquivos de Referência', title: 'Plantas do espaço' },
        { section: 'Arquivos de Referência', title: 'Conceito expográfico' },
        { section: 'Arquivos de Referência', title: 'Memorial Descritivo' },
        { section: 'Equipamentos', title: 'Displays / Totens' },
        { section: 'Equipamentos', title: 'Workstations' },
        { section: 'Software/Design', title: 'Desenvolvimento do conteúdo' },
        { section: 'Software/Design', title: 'Programação interativa' },
        { section: 'Solução/Instalação', title: 'Montagem e configuração' },
        { section: 'Solução/Instalação', title: 'Testes e homologação' },
        { section: 'Geral', title: 'Relatório Final' },
      ],
    },
    {
      name: 'Estação Brasil - DSM Guatemala',
      clientName: 'DSM',
      solutionSlug: 'projecao-mapeada',
      status: 'DONE',
      tasks: [
        { section: 'Arquivos de Referência', title: 'Plantas do espaço', status: 'DONE' },
        { section: 'Equipamentos', title: 'Projetor(es)', status: 'DONE' },
        { section: 'Equipamentos', title: 'Servidor / Workstation', status: 'DONE' },
        { section: 'Software/Design', title: 'Conteúdo de Projeção', status: 'DONE' },
        { section: 'Software/Design', title: 'Programação / Mapping', status: 'DONE' },
        { section: 'Solução/Instalação', title: 'Entrega e Montagem', status: 'DONE' },
        { section: 'Geral', title: 'Relatório Final', status: 'DONE' },
      ],
    },
  ]

  for (const proj of realProjects) {
    const exists = await prisma.project.findFirst({ where: { name: proj.name } })
    if (!exists) {
      const sol = solBySlug[proj.solutionSlug]
      const created = await prisma.project.create({
        data: {
          name: proj.name,
          code: `PSV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          clientId: clientMap[proj.clientName] ?? null,
          solutionId: sol?.id ?? null,
          status: proj.status as any,
          createdById: adminUser?.id ?? null,
        },
      })
      for (const [i, t] of proj.tasks.entries()) {
        await prisma.task.create({
          data: {
            projectId: created.id,
            title: t.title,
            section: t.section,
            status: (t as any).status ?? 'TODO',
            priority: 'MEDIUM',
            prestador: (t as any).prestador ?? null,
            createdById: adminUser?.id ?? null,
          },
        })
      }
      console.log(`  ✓ Projeto criado: ${proj.name}`)
    }
  }
  console.log('✓ Projetos reais PixelSAV criados')
  console.log('✅ Seed concluído!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
