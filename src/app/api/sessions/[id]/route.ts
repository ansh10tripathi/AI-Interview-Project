import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        interview: true,
        evaluationRecord: true
      }
    });
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or has been deleted' },
        { status: 404 }
      );
    }

    let currentQuestion = null;
    let progress = 0;
    
    if (session.evaluation && session.status === 'active') {
      try {
        const sessionState = JSON.parse(session.evaluation);
        currentQuestion = sessionState.activeQuestion;
        progress = Math.min((session.currentStep / 5) * 100, 100);
      } catch (error) {
        console.error('Error parsing session state:', error);
      }
    }

    if (session.status === 'active' && !currentQuestion) {
      return NextResponse.json(
        { success: false, error: 'Interview session is corrupted. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        candidateName: session.candidateName,
        candidateEmail: session.candidateEmail,
        status: session.status,
        currentStep: session.currentStep,
        currentQuestion,
        progress,
        evaluation: session.status === 'completed' ? session.evaluation : null
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}