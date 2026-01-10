'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function useRoleGuard(requiredRole: 'admin' | 'candidate') {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const isCandidate = window.location.pathname.startsWith('/interview') || 
                       searchParams.get('role') === 'candidate'
    
    if (requiredRole === 'admin' && isCandidate) {
      router.push('/interview')
    }
  }, [requiredRole, router, searchParams])
}