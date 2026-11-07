/**
 * Supabase Client Configuration
 * Server-side and client-side instances for Next.js App Router
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local'
  );
}

// ============================================================================
// CLIENT-SIDE SINGLETON (Browser)
// ============================================================================

let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createBrowserClient() {
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

// ============================================================================
// SERVER-SIDE CLIENT (Server Components, Actions, Route Handlers)
// ============================================================================

export function createServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

// ============================================================================
// SERVICE ROLE CLIENT (Admin/Backend operations only)
// ============================================================================

let serviceClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for service client. ' +
      'Do not use this client in client-side code.'
    );
  }

  if (serviceClient) return serviceClient;

  serviceClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}

// ============================================================================
// MIDDLEWARE CLIENT (for session refresh)
// ============================================================================

export function createMiddlewareClient(request: Request) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.headers.get('cookie')?.split('; ').find(c => c.startsWith(`${name}=`))?.split('=')[1];
      },
      set(name: string, value: string, options: CookieOptions) {
        // Handled by NextResponse in middleware
      },
      remove(name: string, options: CookieOptions) {
        // Handled by NextResponse in middleware
      },
    },
  });
}

// ============================================================================
// TYPED QUERY HELPERS
// ============================================================================

/**
 * Type-safe query builder for assessments
 */
export const assessmentsQuery = {
  select: (columns = '*') => {
    const client = createServerClient();
    return client.from('assessments').select(columns);
  },

  byUser: (userId: string) => {
    const client = createServerClient();
    return client.from('assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  byId: (id: string) => {
    const client = createServerClient();
    return client.from('assessments').select('*').eq('id', id).single();
  },

  insert: (data: Database['public']['Tables']['assessments']['Insert']) => {
    const client = createServerClient();
    return client.from('assessments').insert(data).select().single();
  },

  update: (id: string, data: Database['public']['Tables']['assessments']['Update']) => {
    const client = createServerClient();
    return client.from('assessments').update(data).eq('id', id).select().single();
  },

  delete: (id: string) => {
    const client = createServerClient();
    return client.from('assessments').delete().eq('id', id);
  },
};

/**
 * Type-safe query builder for recycling_partners
 */
export const recyclingPartnersQuery = {
  select: (columns = '*') => {
    const client = createServerClient();
    return client.from('recycling_partners').select(columns);
  },

  active: () => {
    const client = createServerClient();
    return client.from('recycling_partners').select('*').eq('is_active', true).order('sort_order');
  },

  featured: () => {
    const client = createServerClient();
    return client.from('recycling_partners').select('*').eq('is_featured', true).eq('is_active', true).order('sort_order');
  },

  byRegion: (region: string) => {
    const client = createServerClient();
    return client.from('recycling_partners').select('*').eq('region', region).eq('is_active', true).order('sort_order');
  },

  byCountry: (countryCode: string) => {
    const client = createServerClient();
    return client.from('recycling_partners').select('*').eq('country_code', countryCode).eq('is_active', true).order('sort_order');
  },

  bySlug: (slug: string) => {
    const client = createServerClient();
    return client.from('recycling_partners').select('*').eq('slug', slug).eq('is_active', true).single();
  },

  nearby: (params: {
    latitude: number;
    longitude: number;
    radius_km?: number;
    device_category?: Database['public']['Enums']['device_category'];
    material?: string;
    limit?: number;
  }) => {
    const client = createServerClient();
    return client.rpc('get_nearby_recyclers', params);
  },

  search: (query: string) => {
    const client = createServerClient();
    return client
      .from('recycling_partners')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
      .order('sort_order');
  },

  // Admin operations (require service role)
  admin: {
    all: () => {
      const client = createServiceClient();
      return client.from('recycling_partners').select('*').order('sort_order');
    },
    insert: (data: Database['public']['Tables']['recycling_partners']['Insert']) => {
      const client = createServiceClient();
      return client.from('recycling_partners').insert(data).select().single();
    },
    update: (id: string, data: Database['public']['Tables']['recycling_partners']['Update']) => {
      const client = createServiceClient();
      return client.from('recycling_partners').update(data).eq('id', id).select().single();
    },
    delete: (id: string) => {
      const client = createServiceClient();
      return client.from('recycling_partners').delete().eq('id', id);
    },
  },
};

// ============================================================================
// AUTH HELPERS
// ============================================================================

export async function getUser() {
  const client = createServerClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function getSession() {
  const client = createServerClient();
  const { data: { session } } = await client.auth.getSession();
  return session;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { createSupabaseClient };
export type { CookieOptions };