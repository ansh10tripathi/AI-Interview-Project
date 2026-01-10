import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const evaluations = await prisma.evaluation.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedEvaluations = evaluations.map(evaluation => {
      let scores = {};
      let redFlags = [];
      
      try {
        scores = JSON.parse(evaluation.scores);
      } catch {
        scores = {};
      }
      
      try {
        redFlags = JSON.parse(evaluation.redFlags);
      } catch {
        redFlags = [];
      }
      
      return {
        id: evaluation.id,
        sessionId: evaluation.sessionId,
        recommendation: evaluation.recommendation,
        confidence: evaluation.confidence,
        scores,
        redFlags,
        createdAt: evaluation.createdAt
      };
    });


    return NextResponse.json({ 
      success: true, 
      evaluations: formattedEvaluations 
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { sessionId }
    });

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    let scores = {};
    let redFlags = [];
    
    try {
      scores = JSON.parse(evaluation.scores);
    } catch {
      scores = {};
    }
    
    try {
      redFlags = JSON.parse(evaluation.redFlags);
    } catch {
      redFlags = [];
    }

    const formattedEvaluation = {
      id: evaluation.id,
      sessionId: evaluation.sessionId,
      recommendation: evaluation.recommendation,
      confidence: evaluation.confidence,
      scores,
      redFlags,
      createdAt: evaluation.createdAt
    };

    return NextResponse.json({ 
      success: true, 
      evaluation: formattedEvaluation 
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}