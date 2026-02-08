import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InterviewStateMachine } from '@/lib/interview-state-machine';
import { InterviewConfig } from '@/types/interview';
import { InterviewSessionStateMachine, getSessionState } from '@/lib/session-state-machine';

// Safe constant for max concurrent sessions
const MAX_ACTIVE_SESSIONS = 100;

export async function POST(request: NextRequest) {
  try {
    const { interviewId, candidateName, candidateEmail } = await request.json();
    
    if (!interviewId || !candidateName || !candidateEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const trimmedName = candidateName.trim();
    const trimmedEmail = candidateEmail.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        interviewId,
        candidateEmail: trimmedEmail
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existingSession) {
      const sessionState = new InterviewSessionStateMachine(getSessionState(existingSession.status));
      
      if (sessionState.isCompleted() || sessionState.isLocked()) {
        return NextResponse.json(
          { success: false, error: 'You have already completed this interview' },
          { status: 409 }
        );
      }
      
      if (sessionState.isActive()) {
        return NextResponse.json(
          { success: false, error: 'An active interview session already exists for this email' },
          { status: 409 }
        );
      }
    }
    
    // Check active session limit - only count truly active sessions
    const activeCount = await prisma.interviewSession.count({
      where: {
        status: 'active',
        completedAt: null
      }
    });
    
    console.log(`[Session Start] Active sessions: ${activeCount}/${MAX_ACTIVE_SESSIONS}`);
    
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

    // Parse interview configuration
    let config: InterviewConfig;
    try {
      config = {
        role: interview.role,
        skills: JSON.parse(interview.skills),
        difficulty: interview.difficulty as any,
        rubric: JSON.parse(interview.rubric),
        redFlags: JSON.parse(interview.redFlags),
        style: interview.style as any
      };
      
      console.log(`[Session Start] Interview config:`, {
        role: config.role,
        skills: config.skills,
        difficulty: config.difficulty
      });
    } catch (error) {
      console.error('[Session Start] Failed to parse interview config:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid interview configuration' },
        { status: 500 }
      );
    }

    // Initialize state machine and get first question
    console.log('[Session Start] Initializing state machine...');
    const stateMachine = new InterviewStateMachine(config);
    
    const firstQuestion = await stateMachine.start();
    
    // Validate first question was generated
    if (!firstQuestion || !firstQuestion.text || !firstQuestion.id) {
      console.error('[Session Start] Failed to generate first question:', firstQuestion);
      return NextResponse.json(
        { success: false, error: 'Failed to generate interview question. Please try again.' },
        { status: 500 }
      );
    }
    
    console.log(`[Session Start] First question generated:`, {
      id: firstQuestion.id,
      skill: firstQuestion.skill,
      textLength: firstQuestion.text.length
    });

    // Create session with initial state
    const session = await prisma.interviewSession.create({
      data: {
        interviewId,
        candidateName: trimmedName,
        candidateEmail: trimmedEmail,
        status: 'active',
        currentStep: 0,
        responses: JSON.stringify([]),
        evaluation: stateMachine.serialize()
      }
    });
    
    console.log(`[Session Start] Session created successfully:`, {
      sessionId: session.id,
      candidateEmail: trimmedEmail
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      question: firstQuestion,
      questionIndex: 0,
      totalQuestions: 5,
      progress: 0
    });
  } catch (error) {
    console.error('[Session Start] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start session. Please try again.' },
      { status: 500 }
    );
  }
}