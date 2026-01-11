import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Delete related evaluation first (if exists)
    await prisma.evaluation.deleteMany({
      where: { sessionId }
    });

    // Delete the session
    await prisma.interviewSession.delete({
      where: { id: sessionId }
    });

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}