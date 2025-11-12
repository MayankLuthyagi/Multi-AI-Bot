import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { createSession } from '@/src/lib/session';
import bcrypt from 'bcryptjs';

export async function login(name: string, email: string, password: string, requestUrl?: string) {
    const { db } = await connectToDatabase();

    const user = await db.collection('admin').findOne({ email });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('auth: found user:', { name: user.name, email: user.email });

    // Compare using bcrypt in case passwords in DB are hashed.
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session
    await createSession(user._id.toString(), user.email);

    // Next.js requires absolute URLs for redirects in some runtimes (middleware/edge).
    // Build an absolute URL from the incoming request URL when available.
    const redirectUrl = new URL('/dashboard', requestUrl || 'http://localhost:3000');
    return NextResponse.redirect(redirectUrl);
}

// HTTP POST handler so clients can POST JSON to /api/auth
export async function POST(req: NextRequest) {
    try {
        // Log incoming request for easier debugging
        const body = await req.json();
        console.log('auth POST body:', body);

        // For login we only need email + password. Name is optional for sign-in.
        const { name, email, password } = body || {};

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        // `login` returns a NextResponse (either JSON error or redirect)
        // pass the request URL so the login function can construct an absolute redirect URL
        return await login(name, email, password, req.url);
    } catch (err: any) {
        // Log the full error server-side so we can inspect the cause
        console.error('auth POST error:', err?.message ?? err);
        return NextResponse.json({ error: err?.message || 'Bad request' }, { status: 400 });
    }
}
