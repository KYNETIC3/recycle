'use client';

/**
 * Client-side Supabase Browser Client
 * Only safe for Client Components ('use client')
 * No cookies, no next/headers imports
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local'
  );
}

// Browser singleton
let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Get or create the browser Supabase client (singleton)
 * Safe for use in Client Components only
 */
export function createBrowserClient(): ReturnType<typeof createSupabaseClient<Database>> {
  if (browserClient) return browserClient;

  browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return browserClient;
}

/**
 * Export the singleton instance directly for convenience
 * Use this in Client Components: import { supabase } from '@/lib/supabase/client'
 */
export const supabase = createBrowserClient();