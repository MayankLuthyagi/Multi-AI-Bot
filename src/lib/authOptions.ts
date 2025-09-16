import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "./mongodb";
import { User } from "./models";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Demo credentials for testing
                if (credentials.email === "admin@example.com" && credentials.password === "password") {
                    try {
                        await dbConnect();

                        // Find or create admin user
                        let user = await User.findOne({ email: "admin@example.com" });
                        if (!user) {
                            user = await User.create({
                                email: "admin@example.com",
                                name: "Admin User",
                                isAdmin: true,
                            });
                            console.log('Created new admin user:', user);
                        } else {
                            console.log('Found existing admin user:', user);
                        }

                        return {
                            id: user._id.toString(),
                            email: user.email,
                            name: user.name,
                        };
                    } catch (error) {
                        console.error("Demo user creation error:", error);
                        return null;
                    }
                }

                return null;
            }
        })
    ],

    session: {
        strategy: "jwt"
    },

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await dbConnect();

                    let existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        existingUser = await User.create({
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            isAdmin: user.email === "mayankchandrajoshi@gmail.com"
                        });
                    } else {
                        existingUser.name = user.name || existingUser.name;
                        existingUser.image = user.image || existingUser.image;
                        await existingUser.save();
                    }

                    return true;
                } catch (error) {
                    console.error("SignIn error:", error);
                    return false;
                }
            }

            if (account?.provider === "credentials") {
                // Credentials sign-in handled in authorize method
                return true;
            }

            return true;
        },

        async jwt({ token, user, account }) {
            if (account && user) {
                console.log('JWT callback - account:', account.provider, 'user:', user);
                try {
                    await dbConnect();
                    const dbUser = await User.findOne({ email: user.email });

                    if (dbUser) {
                        token.userId = dbUser._id.toString();
                        token.isAdmin = dbUser.isAdmin;
                        console.log('JWT callback - dbUser found:', dbUser.email, 'isAdmin:', dbUser.isAdmin);
                    } else {
                        console.log('JWT callback - no dbUser found for:', user.email);
                    }
                } catch (error) {
                    console.error("JWT error:", error);
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.userId as string;
                session.user.isAdmin = token.isAdmin as boolean;
                console.log('Session callback - token.userId:', token.userId, 'token.isAdmin:', token.isAdmin);
                console.log('Session callback - session.user.id:', session.user.id, 'session.user.isAdmin:', session.user.isAdmin);
            }

            return session;
        }
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};
