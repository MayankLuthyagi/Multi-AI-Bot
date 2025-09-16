'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const callbackUrl = searchParams.get('callbackUrl') || '/chat'

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result) {
        setError('Unexpected authentication response')
        return
      }

      if (result.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Invalid email or password')
            break
          default:
            setError('An error occurred during sign in')
        }
      } else {
        router.replace(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true)
    signIn(provider, { callbackUrl })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white pt-16 overflow-hidden">
      <div className="w-full h-full flex">
        {/* Left side - Features */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/3 items-center justify-center p-12">
          <div className="max-w-md space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold mb-4">
                Welcome to <span className="text-emerald-400">Multibot</span>
              </h1>
              <p className="text-xl xl:text-2xl text-gray-300 leading-relaxed">
                Smarter conversations, seamless productivity, and enterprise-grade privacy.
              </p>
            </div>

            <div className="space-y-6">
              <Feature iconColor="text-emerald-400" title="Multiple AI Models" desc="Switch between different AI brains instantly." />
              <Feature iconColor="text-indigo-400" title="Smart Assistance" desc="Get intelligent help with your projects and tasks." />
              <Feature iconColor="text-pink-400" title="Secure & Private" desc="Your conversations are encrypted and always yours." />
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 xl:w-1/3 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8 bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Use your credentials or sign in with a provider
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-2xl font-semibold text-lg bg-emerald-500/90 text-black hover:bg-emerald-400/90 transition transform hover:scale-105 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="px-3 text-sm text-gray-400">Or continue with</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* OAuth */}
            <div className="flex justify-center">
            <div className="w-full sm:w-1/2">
                <OAuthButton provider="google" onClick={() => handleOAuthSignIn('google')} disabled={isLoading} />
            </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ iconColor, title, desc }: { iconColor: string; title: string; desc: string }) {
  return (
    <div className="flex items-center space-x-4">
      <div className={`w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center ${iconColor}`}>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-400">{desc}</p>
      </div>
    </div>
  )
}

function OAuthButton({
  provider,
  onClick,
  disabled,
}: {
  provider: string
  onClick: () => void
  disabled?: boolean
}) {
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`Sign in with ${providerLabel}`}
      className="w-full inline-flex justify-center items-center py-3 px-4 rounded-2xl bg-gray-900/60 border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-800/90 hover:text-white transition transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {provider === 'google' && (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {providerLabel}
    </button>
  )
}
