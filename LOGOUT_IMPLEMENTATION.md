# Admin Logout Feature - Implementation Summary

## Overview
Added a complete logout system for admin users to properly end their session and prevent candidates from being incorrectly treated as admins.

## Files Modified/Created

### 1. **src/lib/logout.ts** (NEW)
Reusable logout utility function that:
- Calls `/api/auth/logout` API to clear server-side cookies
- Clears all localStorage data
- Redirects to home page (`/`)
- Handles errors gracefully with forced redirect

```typescript
export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/';
  }
}
```

### 2. **src/components/Navigation.tsx** (MODIFIED)
Added logout button to global navigation:
- Checks admin status via `/api/auth/check` API
- Shows red "Logout" button when user is admin
- Button appears in top-right navigation bar
- Only visible after component mounts (prevents hydration issues)

### 3. **src/app/dashboard/page.tsx** (MODIFIED)
Added logout button to dashboard header:
- Prominent "Logout" button in top-right of dashboard
- Uses destructive variant (red) for visibility
- Positioned next to page title

### 4. **src/app/create/page.tsx** (MODIFIED)
Added logout button to create interview page:
- Logout button in page header
- Consistent placement with dashboard page
- Ensures admins can logout from any admin page

### 5. **src/app/api/auth/check/route.ts** (MODIFIED)
Enhanced auth check API response:
- Added `isAdmin` boolean field
- Returns `isAdmin: true` when role is 'admin'
- Returns `isAdmin: false` for non-authenticated users

## How It Works

### Logout Flow:
1. User clicks "Logout" button
2. `logout()` function is called
3. API call to `/api/auth/logout` clears `auth_token` cookie
4. `localStorage.clear()` removes any client-side data
5. User is redirected to `/` (home page)
6. Middleware blocks access to admin routes (no auth cookie)
7. Admin banner disappears (no admin role detected)

### After Logout:
- ✅ Admin routes (`/dashboard`, `/create`) are inaccessible
- ✅ Middleware redirects to `/login?error=unauthorized`
- ✅ Candidate pages work normally
- ✅ Admin warning banner disappears
- ✅ Interview links work correctly for candidates

## Button Locations

### 1. Global Navigation (All Pages)
- Top-right corner of navigation bar
- Red button labeled "Logout"
- Visible on all pages when admin is logged in

### 2. Dashboard Page
- Top-right of page header
- Next to "Interview Dashboard" title
- Most prominent placement

### 3. Create Interview Page
- Top-right of page header
- Next to "Create Interview" title
- Consistent with dashboard placement

## Testing Checklist

- [ ] Admin can login via `/login`
- [ ] Logout button appears in navigation after login
- [ ] Logout button appears on dashboard page
- [ ] Logout button appears on create interview page
- [ ] Clicking logout clears cookies
- [ ] Clicking logout clears localStorage
- [ ] After logout, redirected to home page
- [ ] After logout, cannot access `/dashboard` without re-login
- [ ] After logout, cannot access `/create` without re-login
- [ ] After logout, admin banner disappears
- [ ] After logout, interview links work for candidates
- [ ] Candidates are not affected by admin logout

## Security Notes

- Logout clears server-side `auth_token` cookie
- Logout clears all client-side localStorage
- Middleware enforces authentication on protected routes
- No admin session persists after logout
- Candidates cannot accidentally inherit admin privileges

## Usage

Admin users can logout from any of these locations:
1. Click "Logout" in top navigation bar (any page)
2. Click "Logout" button on dashboard page
3. Click "Logout" button on create interview page

All methods use the same `logout()` utility function for consistency.
