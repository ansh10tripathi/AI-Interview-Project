import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { InterviewConfig } from '@/types/interview';
import { requireAdminFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    requireAdminFromRequest(request);
    const config: InterviewConfig = await request.json();
    
    const interview = await prisma.interview.create({
      data: {
        role: config.role,
        skills: JSON.stringify(config.skills),
        difficulty: config.difficulty,
        rubric: JSON.stringify(config.rubric),
        redFlags: JSON.stringify(config.redFlags),
        style: config.style
      }
    });

    return NextResponse.json({ 
      success: true, 
      interviewId: interview.id 
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    requireAdminFromRequest(request);
    const interviews = await prisma.interview.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          select: {
            id: true,
            candidateName: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, interviews });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}