import crypto from 'crypto';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationLink(baseUrl: string, token: string, interviewId: string): string {
  return `${baseUrl}/interview/verify?token=${token}&id=${interviewId}`;
}

export async function sendVerificationEmail(email: string, name: string, verificationLink: string): Promise<boolean> {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`
    Verification Email:
    To: ${email}
    Subject: Verify Your Interview Session
    
    Hi ${name},
    
    Click the link below to start your interview:
    ${verificationLink}
    
    This link expires in 24 hours.
  `);
  
  return true;
}

export function isTokenExpired(createdAt: Date, expiryHours: number = 24): boolean {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + expiryHours * 60 * 60 * 1000);
  return now > expiryTime;
}
