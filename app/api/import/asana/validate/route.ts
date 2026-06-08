import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const { importId, mappings } = await req.json()
  const warnings: string[] = []

  const importRecord = await prisma.import.findUnique({
    where: { id: importId },
    include: { files: true },
  })

  if (!importRecord) return NextResponse.json({ error: 'Import not found' }, { status: 404 })

  const parsedData = importRecord.files[0]?.parsedData as any
  if (!parsedData) {
    warnings.push('Nenhum dado encontrado no arquivo.')
    return NextResponse.json({ warnings })
  }

  // Verificar usuários mapeados
  const userMappings = Object.entries(mappings).filter(([k]) => k.startsWith('user_'))
  for (const [key, email] of userMappings) {
    if (!email) {
      const asanaName = key.replace('user_', '')
      warnings.push(`Usuário "${asanaName}" não mapeado - será ignorado.`)
    } else {
      const user = await prisma.user.findUnique({ where: { email: email as string } })
      if (!user) warnings.push(`E-mail "${email}" não encontrado no sistema.`)
    }
  }

  // Verificar campos sem mapeamento
  if (parsedData.customFields?.length > 0) {
    const unmapped = parsedData.customFields.filter((f: string) => !mappings[f])
    if (unmapped.length > 0) {
      warnings.push(`${unmapped.length} campo(s) personalizado(s) sem mapeamento serão ignorados.`)
    }
  }

  // Verificar duplicatas
  if (parsedData.projects > 0) {
    warnings.push('Verificar manualmente se projetos já existem antes de importar.')
  }

  // Salvar mappings
  for (const [sourceKey, targetKey] of Object.entries(mappings)) {
    await prisma.importMapping.create({
      data: {
        importId,
        sourceType: 'asana',
        sourceKey,
        targetType: 'pixelsav',
        targetKey: targetKey as string,
      },
    }).catch(() => {})
  }

  return NextResponse.json({ warnings })
}
