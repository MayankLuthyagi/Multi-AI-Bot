import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

// Extend NextAuth types to include our custom fields
declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role?: string
            isAdmin?: boolean
        } & DefaultSession['user']
    }

    interface User extends DefaultUser {
        id: string
        email: string
        name: string
        role?: string
        isAdmin?: boolean
    }
}

declare module 'next-auth/jwt' {
    interface JWT extends DefaultJWT {
        id: string
        email: string
        name: string
        role?: string
        provider?: string
        userId?: string
        isAdmin?: boolean
    }
}