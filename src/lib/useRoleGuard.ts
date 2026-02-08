'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useRoleGuard(requiredRole: 'admin' | 'candidate') {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    const checkAuth = async () => {
      if (requiredRole === 'admin') {
        try {
          const response = await fetch('/api/auth/check')
          const result = await response.json()
          
          if (!result.authenticated || result.role !== 'admin') {
            router.push('/login')
            return
          }
          setIsChecking(false)
        } catch (error) {
          router.push('/login')
        }
      } else {
        setIsChecking(false)
      }
    }
    
    checkAuth()
  }, [requiredRole, router])
  
  return isChecking
}