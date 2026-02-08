import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateVerificationToken, generateVerificationLink, sendVerificationEmail } from '@/lib/email-verification';

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

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId }
    });
    
    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      );
    }

    const existingSession = await prisma.interviewSession.findFirst({
      where: {
        interviewId,
        candidateEmail: trimmedEmail,
        status: { in: ['active', 'completed'] }
      }
    });

    if (existingSession) {
      return NextResponse.json(
        { success: false, error: 'An interview session already exists for this email' },
        { status: 409 }
      );
    }

    const verificationToken = generateVerificationToken();
    
    const session = await prisma.interviewSession.create({
      data: {
        interviewId,
        candidateName: trimmedName,
        candidateEmail: trimmedEmail,
        status: 'pending',
        currentStep: 0,
        responses: JSON.stringify([]),
        evaluation: JSON.stringify({ verificationToken, verified: false })
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationLink = generateVerificationLink(baseUrl, verificationToken, interviewId);
    
    await sendVerificationEmail(trimmedEmail, trimmedName, verificationLink);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      requiresVerification: true
    });
  } catch (error) {
    console.error('Error requesting interview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
