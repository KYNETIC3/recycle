'use client'

import { createBrowserClient } from '@/lib/supabase/client'

/**
 * Initiate OAuth sign-in with the specified provider
 * Redirects to the auth callback route after provider authorization
 */
export function signInWithProvider(provider: 'google' | 'github') {
  const supabase = createBrowserClient()
  const redirectTo = `${window.location.origin}/auth/callback`

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  })
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createBrowserClient()
  return supabase.auth.signOut()
}

/**
 * Get the current user session
 */
export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get the current user
 */
export async function getUser() {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  return supabase.auth.signUp({ email, password })
}