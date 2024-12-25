import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'
import { AgentMessageType } from '@prisma/client'
import { getServerSession } from "next-auth"
import { authOptions } from '../auth/[...nextauth]/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      messages: true,
    },
  })

  return NextResponse.json(conversations, { status: 200 })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, initialMessage } = await req.json()
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  
  const conversation = await prisma.conversation.create({
    data: {
      title,
      userId: session.user.id,
      messages: {
        create: initialMessage ? {
          order: 0,
          type: AgentMessageType.human,
          content: initialMessage,
        } : undefined
      }
    },
    include: {
      messages: true,
    }
  })

  return NextResponse.json(conversation, { status: 201 })
}