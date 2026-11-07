/**
 * Supabase Configuration - Client-Safe Exports Only
 * Safe to import in Client Components ('use client')
 * Server Components should import directly from '@/lib/supabase/server'
 * 
 * Client Components: import { createBrowserClient, supabase, validateSupabaseEnv } from '@/lib/supabase'
 * Server Components: import { createServerClient, assessmentsQuery } from '@/lib/supabase/server'
 */

import type { Database } from '@/types/database';

// Re-export types
export type { Database };

// Environment validation (safe for both client and server)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function validateSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local'
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}

// Re-export ONLY client-safe exports
export { createBrowserClient, supabase } from './supabase/client';

export { createSupabaseClient } from '@supabase/supabase-js';
export type { CookieOptions } from '@supabase/ssr';