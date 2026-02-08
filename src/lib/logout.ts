export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    
    // Clear any localStorage items
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    // Redirect to home
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
    // Force redirect anyway
    window.location.href = '/';
  }
}
