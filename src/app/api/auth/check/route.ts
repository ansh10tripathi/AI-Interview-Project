import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getAuthFromRequest(request);
  
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      isAdmin: false,
      role: null
    });
  }
  
  return NextResponse.json({
    authenticated: true,
    isAdmin: user.role === 'admin',
    role: user.role,
    id: user.id
  });
}
