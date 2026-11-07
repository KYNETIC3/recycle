/**
 * Server-side Supabase Client
 * Only safe for Server Components, Server Actions, Route Handlers, Middleware
 * Uses cookies from next/headers
 */

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Environment validation
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
// SERVER-SIDE CLIENT (Server Components, Actions, Route Handlers)
// ============================================================================

/**
 * Create a Supabase client for Server Components, Server Actions, Route Handlers
 * Uses cookies from next/headers for session management
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Safe to ignore if called from a Server Component
        }
      },
    },
  });
}

// ============================================================================
// SERVICE ROLE CLIENT (Admin/Backend operations only)
// ============================================================================

let serviceClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Create a Supabase service client with admin privileges
 * ONLY use in Server Components, Server Actions, Route Handlers
 * NEVER use in Client Components
 */
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

/**
 * Create a Supabase client for Next.js Middleware
 * Uses request headers for cookie access
 */
export function createMiddlewareClient(request: Request) {
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
// TYPED QUERY HELPERS (Server-only)
// ============================================================================

/**
 * Type-safe query builder for assessments
 */
export const assessmentsQuery = {
  select: async (columns = '*') => {
    const client = await createServerClient();
    return client.from('assessments').select(columns);
  },

  byUser: async (userId: string) => {
    const client = await createServerClient();
    return client.from('assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  byId: async (id: string) => {
    const client = await createServerClient();
    return client.from('assessments').select('*').eq('id', id).single();
  },

  insert: async (data: Database['public']['Tables']['assessments']['Insert']) => {
    const client = await createServerClient();
    return client.from('assessments').insert(data).select().single();
  },

  update: async (id: string, data: Database['public']['Tables']['assessments']['Update']) => {
    const client = await createServerClient();
    return client.from('assessments').update(data).eq('id', id).select().single();
  },

  delete: async (id: string) => {
    const client = await createServerClient();
    return client.from('assessments').delete().eq('id', id);
  },
};

/**
 * Type-safe query builder for recycling_partners
 */
export const recyclingPartnersQuery = {
  select: async (columns = '*') => {
    const client = await createServerClient();
    return client.from('recycling_partners').select(columns);
  },

  active: async () => {
    const client = await createServerClient();
    return client.from('recycling_partners').select('*').eq('is_active', true).order('sort_order');
  },

  featured: async () => {
    const client = await createServerClient();
    return client.from('recycling_partners').select('*').eq('is_featured', true).eq('is_active', true).order('sort_order');
  },

  byRegion: async (region: string) => {
    const client = await createServerClient();
    return client.from('recycling_partners').select('*').eq('region', region).eq('is_active', true).order('sort_order');
  },

  byCountry: async (countryCode: string) => {
    const client = await createServerClient();
    return client.from('recycling_partners').select('*').eq('country_code', countryCode).eq('is_active', true).order('sort_order');
  },

  bySlug: async (slug: string) => {
    const client = await createServerClient();
    return client.from('recycling_partners').select('*').eq('slug', slug).eq('is_active', true).single();
  },

  nearby: async (params: {
    latitude: number;
    longitude: number;
    radius_km?: number;
    device_category?: Database['public']['Enums']['device_category'];
    material?: string;
    limit?: number;
  }) => {
    const client = await createServerClient();
    return client.rpc('get_nearby_recyclers', params);
  },

  search: async (query: string) => {
    const client = await createServerClient();
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
// AUTH HELPERS (Server-only)
// ============================================================================

export async function getUser() {
  const client = await createServerClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function getSession() {
  const client = await createServerClient();
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

export { createSupabaseClient } from '@supabase/supabase-js';
export type { CookieOptions } from '@supabase/ssr';