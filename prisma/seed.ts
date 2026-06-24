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

const defaultTasks = [
  'Briefing', 'Levantamento técnico', 'Medidas do espaço', 'Análise de viabilidade',
  'Lista de equipamentos', 'Conteúdo necessário', 'Orçamento', 'Proposta', 'Contrato',
  'Pré-produção', 'Logística', 'Montagem', 'Testes', 'Operação',
  'Desmontagem', 'Pós-evento', 'Relatório final',
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
      await prisma.projectTemplate.create({
        data: {
          name: tplName,
          solutionId: sol.id,
          isDefault: true,
          tasks: {
            create: defaultTasks.map((t, i) => ({ name: t, sortOrder: i + 1, isRequired: true })),
          },
        },
      })
    }
  }
  console.log('✓ Templates de projeto criados')
  console.log('✅ Seed concluído!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
