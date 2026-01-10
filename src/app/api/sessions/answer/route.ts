import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InterviewStateMachine } from '@/lib/interview-state-machine';
import { InterviewConfig } from '@/types/interview';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, answer } = await request.json();
    
    // Get session and interview
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { interview: true }
    });
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Reconstruct state machine
    const config: InterviewConfig = {
      role: session.interview.role,
      skills: JSON.parse(session.interview.skills),
      difficulty: session.interview.difficulty as any,
      rubric: JSON.parse(session.interview.rubric),
      redFlags: JSON.parse(session.interview.redFlags),
      style: session.interview.style as any
    };

    const stateMachine = new InterviewStateMachine(config);
    
    // Restore state from database
    const responses = JSON.parse(session.responses);
    stateMachine.getState().responses = responses;
    stateMachine.getState().currentStep = session.currentStep;

    // Submit answer and get next question
    const result = await stateMachine.submitAnswer(answer);
    
    // Update session in database
    const updatedResponses = stateMachine.getState().responses;
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        responses: JSON.stringify(updatedResponses),
        currentStep: stateMachine.getState().currentStep,
        status: result.isComplete ? 'completed' : 'active',
        completedAt: result.isComplete ? new Date() : null
      }
    });

    if (result.isComplete) {
      // Generate final evaluation
      const evaluation = await stateMachine.generateEvaluation();
      
      await prisma.evaluation.create({
        data: {
          sessionId,
          scores: JSON.stringify(evaluation.skillBreakdown),
          evidence: JSON.stringify([]),
          recommendation: evaluation.recommendation,
          confidence: evaluation.confidence,
          redFlags: JSON.stringify(evaluation.redFlags)
        }
      });

      return NextResponse.json({
        success: true,
        isComplete: true,
        evaluation
      });
    }

    return NextResponse.json({
      success: true,
      isComplete: false,
      nextQuestion: result.nextQuestion,
      progress: stateMachine.getProgress()
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}