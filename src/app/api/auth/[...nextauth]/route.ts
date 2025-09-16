import NextAuth from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Create the NextAuth handler with our configuration
const handler = NextAuth(authOptions)

// Export the handler for both GET and POST requests
// GET: For OAuth redirects, session checks
// POST: For credential login, logout
export { handler as GET, handler as POST }