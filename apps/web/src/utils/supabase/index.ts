/**
 * Supabase Client Utilities
 * Reusable client helpers for browser and server environments
 */

import { createBrowserClient } from '@/lib/supabase/client';
import { createServerClient, createServiceClient, createMiddlewareClient } from '@/lib/supabase/server';
import { assessmentsQuery, recyclingPartnersQuery } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

// ============================================================================
// CLIENT-SIDE HOOKS (for React components)
// ============================================================================

/**
 * Get the browser Supabase client (singleton)
 * Use this in client components with 'use client'
 */
export function getSupabaseBrowser() {
  return createBrowserClient();
}

/**
 * Create a Supabase client for client components
 * Alternative to singleton if you need fresh instances
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient();
}

// ============================================================================
// SERVER-SIDE HELPERS (for Server Components, Actions, Route Handlers)
// ============================================================================

/**
 * Get the server Supabase client
 * Use this in Server Components, Server Actions, and Route Handlers
 */
export async function getSupabaseServer() {
  return createServerClient();
}

/**
 * Create a Supabase service client (admin privileges)
 * Use ONLY in server-side code for backend operations
 * NEVER use in client components
 */
export function getSupabaseService() {
  return createServiceClient();
}

/**
 * Create a Supabase client for middleware
 * Use in middleware.ts for session refresh
 */
export function getSupabaseMiddleware(request: Request) {
  return createMiddlewareClient(request);
}

// ============================================================================
// TYPED QUERY BUILDERS (convenience exports)
// ============================================================================

// Re-export query builders from server module
export {
  assessmentsQuery,
  recyclingPartnersQuery,
  getUser,
  getSession,
  requireAuth,
} from '@/lib/supabase/server';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  Assessment,
  AssessmentInsert,
  AssessmentUpdate,
  AssessmentMetadata,
  AssessmentWithUser,
  AssessmentFilters,
  RecyclingPartner,
  RecyclingPartnerInsert,
  RecyclingPartnerUpdate,
  RecyclingPartnerWithDistance,
  PartnerMetadata,
  RecyclingPartnerFilters,
  NearbyRecyclersParams,
  DeviceCategory,
  CircularRoute,
  UserAssessmentStats,
  PlatformStats,
  PaginatedResponse,
  Database,
  ApiError,
  SupabaseResult,
} from '@/types/database';

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
}

/**
 * Check if Supabase error is a "not found" error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'PGRST116';
  }
  return false;
}

/**
 * Check if Supabase error is a unique constraint violation
 */
export function isUniqueConstraintError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === '23505';
  }
  return false;
}

// ============================================================================
// COMMON QUERY PATTERNS
// ============================================================================

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number | null;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export function calculatePagination(
  count: number | null,
  page: number,
  pageSize: number
): Omit<PaginatedResult<unknown>, 'data'> {
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    count,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Build a paginated query
 */
export function applyPagination<T extends { range: (from: number, to: number) => T }>(
  query: T,
  page: number,
  pageSize: number
): T {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

/**
 * Apply common filters to assessment queries
 */
export function applyAssessmentFilters(
  query: any,
  filters: {
    user_id?: string;
    device_category?: string;
    chosen_route?: string;
    score_min?: number;
    score_max?: number;
    date_from?: string;
    date_to?: string;
  }
) {
  let filteredQuery = query;

  if (filters.user_id) {
    filteredQuery = filteredQuery.eq('user_id', filters.user_id);
  }
  if (filters.device_category) {
    filteredQuery = filteredQuery.eq('device_category', filters.device_category);
  }
  if (filters.chosen_route) {
    filteredQuery = filteredQuery.eq('chosen_route', filters.chosen_route);
  }
  if (filters.score_min !== undefined) {
    filteredQuery = filteredQuery.gte('computed_score', filters.score_min);
  }
  if (filters.score_max !== undefined) {
    filteredQuery = filteredQuery.lte('computed_score', filters.score_max);
  }
  if (filters.date_from) {
    filteredQuery = filteredQuery.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    filteredQuery = filteredQuery.lte('created_at', filters.date_to);
  }

  return filteredQuery;
}

/**
 * Apply common filters to recycling partner queries
 */
export function applyPartnerFilters(
  query: any,
  filters: {
    region?: string;
    country_code?: string;
    is_active?: boolean;
    is_featured?: boolean;
    search?: string;
  }
) {
  let filteredQuery = query;

  if (filters.region) {
    filteredQuery = filteredQuery.eq('region', filters.region);
  }
  if (filters.country_code) {
    filteredQuery = filteredQuery.eq('country_code', filters.country_code);
  }
  if (filters.is_active !== undefined) {
    filteredQuery = filteredQuery.eq('is_active', filters.is_active);
  }
  if (filters.is_featured !== undefined) {
    filteredQuery = filteredQuery.eq('is_featured', filters.is_featured);
  }
  if (filters.search) {
    filteredQuery = filteredQuery.or(
      `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
    );
  }

  return filteredQuery;
}