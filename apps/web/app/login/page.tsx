'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Mail, Lock, GitBranch, Monitor } from 'lucide-react'
import { signInWithProvider, signInWithEmail, signUpWithEmail } from '@/lib/auth/oauth'

const cardBg = '#3c454a'
const textColor = '#e2effa'
const accent = '#c2dbf0'
const accentHover = '#a8c8e8'
const inputBg = '#2d3748'
const inputBorder = '#4a5568'
const inputText = '#e2effa'
const placeholderColor = '#a0aec0'
const pageBg = '#1a202c'
const errorBg = '#742a2a'
const errorText = '#feb2b2'
const successBg = '#276749'
const successText = '#9ae6b4'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        const { error } = await signUpWithEmail(email, password)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm.')
      } else {
        const { error } = await signInWithEmail(email, password)
        if (error) throw error
        setSuccess('Signed in! Redirecting...')
        setTimeout(() => window.location.href = '/', 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null)
    setIsLoading(true)
    const { error } = await signInWithProvider(provider)
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const buttonStyle = {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: accent,
    color: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.6 : 1,
    transition: 'background-color 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: textColor,
    border: `1px solid ${inputBorder}`,
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px',
    color: inputText,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: textColor,
    marginBottom: '6px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: textColor, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            eLoop
          </h1>
          <p style={{ fontSize: '15px', color: placeholderColor }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{ backgroundColor: errorBg, color: errorText, padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: successBg, color: successText, padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>
            {success}
          </div>
        )}

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            style={buttonStyle}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = accentHover; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = accent; }}
          >
            <Monitor size={20} />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            disabled={isLoading}
            style={buttonStyle}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = accentHover; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = accent; }}
          >
            <GitBranch size={20} />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', color: placeholderColor, fontSize: '13px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: inputBorder }} />
          <span>or continue with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: inputBorder }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={labelStyle}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete={isSignUp ? 'email' : 'email'}
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {isSignUp && (
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="confirmPassword" style={labelStyle}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" disabled={isLoading} style={buttonStyle}>
            {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: placeholderColor }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
            style={{ background: 'none', border: 'none', color: accent, fontWeight: '600', cursor: 'pointer', fontSize: '14px', padding: 0 }}
            disabled={isLoading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}