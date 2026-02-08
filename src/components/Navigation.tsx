'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/logout'

export default function Navigation() {
  const [mounted, setMounted] = useState(false)
  const [isCandidate, setIsCandidate] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const candidateMode = pathname.startsWith('/interview') || 
                         window.location.search.includes('id=')
    setIsCandidate(candidateMode)
    
    // Check if user is admin
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsAdmin(data.isAdmin))
      .catch(() => setIsAdmin(false))
  }, [pathname])

  // Always render the same structure initially
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">InterviewOS</h1>
          </div>
          <div className="flex items-center space-x-4">
            {mounted && !isCandidate && (
              <>
                <a href="/" className="text-gray-700 hover:text-gray-900">Home</a>
                <a href="/create" className="text-gray-700 hover:text-gray-900">Create Interview</a>
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</a>
              </>
            )}
            {mounted && isAdmin && (
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}