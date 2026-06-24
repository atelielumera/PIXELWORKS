import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attachments = await prisma.fileAttachment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: 'desc' },
    include: { file: true },
  })
  return NextResponse.json({ data: attachments })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, mimeType, size, dataUrl } = await req.json()
  if (!name || !dataUrl) return NextResponse.json({ error: 'File data required' }, { status: 400 })

  const file = await prisma.file.create({
    data: {
      name,
      originalName: name,
      mimeType: mimeType || 'application/octet-stream',
      size: size || 0,
      url: dataUrl,
      storageKey: 'base64',
      uploadedById: (session.user as any).id,
    },
  })

  const attachment = await prisma.fileAttachment.create({
    data: {
      fileId: file.id,
      entityType: 'task',
      entityId: id,
      taskId: id,
    },
    include: { file: true },
  })

  return NextResponse.json({ data: attachment }, { status: 201 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const attachmentId = searchParams.get('attachmentId')
  if (!attachmentId) return NextResponse.json({ error: 'Missing attachmentId' }, { status: 400 })
  const attachment = await prisma.fileAttachment.findUnique({ where: { id: attachmentId } })
  if (attachment) {
    await prisma.fileAttachment.delete({ where: { id: attachmentId } })
    await prisma.file.delete({ where: { id: attachment.fileId } }).catch(() => {})
  }
  return NextResponse.json({ message: 'Deleted' })
}
