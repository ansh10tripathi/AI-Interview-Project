import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export type UserRole = 'admin' | 'candidate';

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
}

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-in-production';

export const MAX_ACTIVE_SESSIONS = 100;

export async function getServerAuth(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  
  if (!authToken) {
    return null;
  }

  if (authToken === ADMIN_SECRET) {
    return {
      id: 'admin',
      role: 'admin'
    };
  }

  return null;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getServerAuth();
  
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}

export function getAuthFromRequest(request: NextRequest): AuthUser | null {
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (!authToken) {
    return null;
  }

  if (authToken === ADMIN_SECRET) {
    return {
      id: 'admin',
      role: 'admin'
    };
  }

  return null;
}

export function requireAdminFromRequest(request: NextRequest): AuthUser {
  const user = getAuthFromRequest(request);
  
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}
