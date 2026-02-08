import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdminFromRequest } from '@/lib/auth'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    requireAdminFromRequest(request)
    
    const { interviewId } = await request.json()

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'Interview ID is required' },
        { status: 400 }
      )
    }

    await prisma.interview.delete({
      where: { id: interviewId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete interview' },
      { status: 500 }
    )
  }
}
