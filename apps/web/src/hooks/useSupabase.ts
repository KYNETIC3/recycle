'use client';

/**
 * React Hooks for Supabase Client
 * Client-side hooks for use in React components
 */

import { useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hook to get the Supabase browser client
 * Returns a memoized singleton client instance
 */
export function useSupabase(): SupabaseClient<Database> {
  const client = useMemo(() => createBrowserClient(), []);
  return client;
}

/**
 * Hook for authentication state
 * Provides user, session, and loading states
 */
export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, session, loading };
}

/**
 * Hook for realtime subscriptions
 * Automatically cleans up on unmount
 */
export function useRealtime<T>(
  table: string,
  filter: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  dependencies: React.DependencyList = []
) {
  const supabase = useSupabase();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, filter, ...dependencies]);
}

// Import React types
import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';