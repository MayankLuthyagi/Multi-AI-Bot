import { getServerSession } from 'next-auth'
import { authOptions } from './authOptions'
import { redirect } from 'next/navigation'

// Get current session on server-side
export async function getAuthSession() {
  return await getServerSession(authOptions)
}

// Require authentication for server components
export async function requireAuth() {
  const session = await getAuthSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

// Check if user has specific role (extend as needed)
export async function requireRole(role: string) {
  const session = await requireAuth()
  
  // Add role checking logic here
  // if (session.user.role !== role) {
  //   redirect('/unauthorized')
  // }
  
  return session
}

// Get current user ID
export async function getCurrentUserId() {
  const session = await getAuthSession()
  return session?.user?.id || null
}