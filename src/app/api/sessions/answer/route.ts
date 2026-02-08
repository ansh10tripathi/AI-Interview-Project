import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InterviewStateMachine } from '@/lib/interview-state-machine';
import { InterviewConfig } from '@/types/interview';
import { InterviewSessionStateMachine, getSessionState } from '@/lib/session-state-machine';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, answer } = await request.json();
    
    if (!sessionId || !answer || typeof answer !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Session ID and answer are required' },
        { status: 400 }
      );
    }
    
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { interview: true }
    });
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or has been deleted' },
        { status: 404 }
      );
    }

    const sessionState = new InterviewSessionStateMachine(getSessionState(session.status));
    
    if (!sessionState.canAnswer()) {
      return NextResponse.json(
        { success: false, error: `Cannot submit answer in ${session.status} state` },
        { status: 400 }
      );
    }

    // Parse interview configuration
    let config: InterviewConfig;
    try {
      config = {
        role: session.interview.role,
        skills: JSON.parse(session.interview.skills),
        difficulty: session.interview.difficulty as any,
        rubric: JSON.parse(session.interview.rubric),
        redFlags: JSON.parse(session.interview.redFlags),
        style: session.interview.style as any
      };
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid interview configuration' },
        { status: 500 }
      );
    }

    // Restore state machine from session
    let stateMachine: InterviewStateMachine;
    try {
      if (session.evaluation) {
        // Try to deserialize from stored state
        stateMachine = InterviewStateMachine.deserialize(session.evaluation);
      } else {
        // Fallback: reconstruct from session data
        stateMachine = InterviewStateMachine.fromSession(config, {
          currentStep: session.currentStep,
          responses: session.responses,
          status: session.status,
          evaluation: session.evaluation
        });
      }
    } catch (error) {
      console.error('Error restoring state machine:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to restore interview state' },
        { status: 500 }
      );
    }

    // Check if we have an active question
    if (!stateMachine.getCurrentQuestion()) {
      return NextResponse.json(
        { success: false, error: 'No active question. Interview may need to be restarted.' },
        { status: 409 }
      );
    }

    // Submit answer and get result
    const result = await stateMachine.submitAnswer(answer.trim());
    
    // Update session in database
    const updatedData: any = {
      responses: JSON.stringify(stateMachine.getState().responses),
      currentStep: stateMachine.getState().currentStep,
      evaluation: stateMachine.serialize() // Always store current state
    };

    if (result.isComplete) {
      updatedData.status = 'completed';
      updatedData.completedAt = new Date();
      
      try {
        console.log('[Answer Submit] Generating evaluation...');
        const evaluation = await stateMachine.generateEvaluation();
        
        console.log('[Answer Submit] Evaluation generated:', {
          overallScore: evaluation?.overallScore,
          recommendation: evaluation?.recommendation,
          hasSkillBreakdown: !!evaluation?.skillBreakdown
        });
        
        if (!evaluation || typeof evaluation.overallScore !== 'number') {
          throw new Error('Invalid evaluation result');
        }
        
        await prisma.evaluation.create({
          data: {
            sessionId,
            scores: JSON.stringify(evaluation.skillBreakdown || {}),
            evidence: JSON.stringify([]),
            recommendation: evaluation.recommendation || 'review',
            confidence: evaluation.confidence || 0.5,
            redFlags: JSON.stringify(evaluation.redFlags || [])
          }
        });

        updatedData.evaluation = JSON.stringify(evaluation);
        
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: updatedData
        });

        return NextResponse.json({
          success: true,
          isComplete: true,
          evaluation
        });
      } catch (evalError) {
        console.error('Error generating evaluation:', evalError);
        
        const responses = stateMachine.getState().responses;
        const hasValidResponses = responses.length > 0 && responses.every(r => r.answer && r.answer.trim().length > 0);
        
        const fallbackEvaluation = {
          overallScore: hasValidResponses ? 50 : 0,
          recommendation: 'review' as const,
          skillBreakdown: {},
          redFlags: ['Evaluation generation failed'],
          summary: hasValidResponses 
            ? `Interview completed but evaluation encountered an error. ${responses.length} responses recorded. Manual review recommended.`
            : 'Evaluation could not be generated due to missing or invalid responses.',
          confidence: 0.1
        };
        
        try {
          await prisma.evaluation.create({
            data: {
              sessionId,
              scores: JSON.stringify({}),
              evidence: JSON.stringify([]),
              recommendation: fallbackEvaluation.recommendation,
              confidence: fallbackEvaluation.confidence,
              redFlags: JSON.stringify(fallbackEvaluation.redFlags)
            }
          });
        } catch (dbError) {
          console.error('Failed to store fallback evaluation:', dbError);
        }
        
        updatedData.evaluation = JSON.stringify(fallbackEvaluation);
        
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: updatedData
        });
        
        return NextResponse.json({
          success: true,
          isComplete: true,
          evaluation: fallbackEvaluation
        });
      }
    } else {
      // Interview continues
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: updatedData
      });

      return NextResponse.json({
        success: true,
        isComplete: false,
        nextQuestion: result.nextQuestion,
        progress: stateMachine.getProgress(),
        questionIndex: stateMachine.getState().currentStep,
        totalQuestions: 5,
        updatedStep: stateMachine.getState().currentStep
      });
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('No active question')) {
        return NextResponse.json(
          { success: false, error: 'Interview session is not properly initialized. Please restart.' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}