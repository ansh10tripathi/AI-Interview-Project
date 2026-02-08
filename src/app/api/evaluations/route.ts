import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminFromRequest } from '@/lib/auth'

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  try {
    if (!value) return fallback
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  try {
    requireAdminFromRequest(request)

    const evaluations = await prisma.evaluation.findMany({
      include: {
        session: {
          include: {
            interview: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formatted = evaluations.map(e => ({
      id: e.id,
      sessionId: e.sessionId,
      candidateName: e.session.candidateName,
      candidateEmail: e.session.candidateEmail,
      role: e.session.interview.role,
      recommendation: e.recommendation,
      confidence: e.confidence,
      scores: safeParse(e.scores, {}),
      redFlags: safeParse(e.redFlags, []),
      createdAt: e.createdAt
    }))

    return NextResponse.json({ success: true, evaluations: formatted })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdminFromRequest(request)

    const sessionId = new URL(request.url).searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      )
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            interview: true
          }
        }
      }
    })

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: 'Evaluation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        id: evaluation.id,
        sessionId: evaluation.sessionId,
        candidateName: evaluation.session.candidateName,
        candidateEmail: evaluation.session.candidateEmail,
        role: evaluation.session.interview.role,
        recommendation: evaluation.recommendation,
        confidence: evaluation.confidence,
        scores: safeParse(evaluation.scores, {}),
        redFlags: safeParse(evaluation.redFlags, []),
        responses: safeParse(evaluation.session.responses, []),
        createdAt: evaluation.createdAt
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluation' },
      { status: 500 }
    )
  }
}
