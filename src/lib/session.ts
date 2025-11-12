import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'user_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string, email: string) {
    const sessionData = JSON.stringify({ userId, email, createdAt: Date.now() });
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    });
}

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

        if (!sessionCookie) {
            return null;
        }

        const session = JSON.parse(sessionCookie.value);

        // Check if session is expired (older than 7 days)
        if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
            await destroySession();
            return null;
        }

        return session;
    } catch (error) {
        return null;
    }
}

export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}
