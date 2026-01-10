import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InterviewStateMachine } from '@/lib/interview-state-machine';
import { InterviewConfig } from '@/types/interview';
import { MAX_ACTIVE_SESSIONS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { interviewId, candidateName, candidateEmail } = await request.json();
    
    // Check active session limit
    const activeCount = await prisma.interviewSession.count({
      where: {
        OR: [
          { status: 'active' },
          { completedAt: null }
        ]
      }
    });
    
    if (activeCount >= MAX_ACTIVE_SESSIONS) {
      return NextResponse.json(
        { success: false, error: 'Maximum interview capacity reached. Please try later.' },
        { status: 429 }
      );
    }
    
    // Get interview config
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId }
    });
    
    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Create session
    const session = await prisma.interviewSession.create({
      data: {
        interviewId,
        candidateName,
        candidateEmail,
        status: 'active',
        responses: JSON.stringify([])
      }
    });

    // Initialize state machine and get first question
    const config: InterviewConfig = {
      role: interview.role,
      skills: JSON.parse(interview.skills),
      difficulty: interview.difficulty as any,
      rubric: JSON.parse(interview.rubric),
      redFlags: JSON.parse(interview.redFlags),
      style: interview.style as any
    };

    const stateMachine = new InterviewStateMachine(config);
    const firstQuestion = await stateMachine.start();

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      question: firstQuestion
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start session' },
      { status: 500 }
    );
  }
}