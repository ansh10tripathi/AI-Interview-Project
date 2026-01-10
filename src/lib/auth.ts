import { NextRequest } from 'next/server';

export const MAX_ACTIVE_SESSIONS = 5;

export function isCandidate(request: NextRequest): boolean {
  const url = new URL(request.url);
  return url.pathname.startsWith('/interview') || url.searchParams.get('role') === 'candidate';
}

export function requireAdmin(request: NextRequest) {
  if (isCandidate(request)) {
    throw new Error('Admin access required');
  }
}