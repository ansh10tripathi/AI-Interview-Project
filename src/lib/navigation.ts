export async function getHomeRoute(): Promise<string> {
  try {
    const response = await fetch('/api/auth/check');
    const result = await response.json();
    
    if (result.authenticated && result.role === 'admin') {
      return '/dashboard';
    }
  } catch (error) {
    // Not authenticated or error
  }
  
  return '/';
}

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if on admin route
  return window.location.pathname.startsWith('/dashboard') || 
         window.location.pathname.startsWith('/create');
}
