'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseRequireAuthOptions {
  redirectTo?: string
  redirectIfFound?: boolean
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo = '/login', redirectIfFound = false } = options
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    // Redirect to login if not authenticated
    if (!session && !redirectIfFound) {
      const currentPath = window.location.pathname
      const callbackUrl = currentPath !== '/login' ? `?callbackUrl=${currentPath}` : ''
      router.push(`${redirectTo}${callbackUrl}`)
    }

    // Redirect away if found (useful for login page)
    if (session && redirectIfFound) {
      router.push('/dashboard')
    }
  }, [session, status, router, redirectTo, redirectIfFound])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: !!session
  }
}

// Usage examples:
// const { session, isLoading } = useRequireAuth()
// const { session } = useRequireAuth({ redirectTo: '/custom-login' })
// const { session } = useRequireAuth({ redirectIfFound: true }) // For login page