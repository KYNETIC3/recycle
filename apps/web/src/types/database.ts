/**
 * eLoop Database Types
 * Generated from Supabase schema - keep in sync with migrations
 * @see supabase/migrations/20261106000001_initial_schema.sql
 */

import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// ENUMS (matching PostgreSQL enums exactly)
// ============================================================================

export type DeviceCategory =
  | 'smartphone'
  | 'laptop'
  | 'tablet'
  | 'wearable'
  | 'audio'
  | 'console'
  | 'other';

export type CircularRoute = 'Repair' | 'Reuse' | 'Recycle';

// ============================================================================
// CORE TABLE TYPES
// ============================================================================

/**
 * assessments table - Device triage records
 */
export interface Assessment {
  id: string; // UUID v7
  user_id: string | null; // UUID, references auth.users
  device_category: DeviceCategory;
  device_brand: string | null;
  device_model: string | null;
  computed_score: number; // 0-100
  chosen_route: CircularRoute;
  carbon_savings_kg_co2e: number; // DECIMAL(10,3)
  assessment_metadata: AssessmentMetadata;
  photo_url: string | null;
  diagnosis_summary: string | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Flexible metadata structure for assessment details
 */
export interface AssessmentMetadata {
  // Component-level scores from AI
  component_scores?: Record<string, number>;
  // Detected issues
  issues_detected?: string[];
  // Recommended actions
  recommended_actions?: string[];
  // Parts identified for reuse
  reusable_parts?: string[];
  // Repair difficulty estimate
  repair_difficulty?: 'easy' | 'moderate' | 'difficult' | 'expert';
  // Estimated repair cost range
  estimated_repair_cost_usd?: { min: number; max: number };
  // Confidence score for the diagnosis
  confidence_score?: number;
  // Raw AI response for debugging
  raw_ai_response?: unknown;
  // Additional custom fields
  [key: string]: unknown;
}

/**
 * recycling_partners table - Certified recycler directory
 */
export interface RecyclingPartner {
  id: string; // UUID
  name: string;
  slug: string; // URL-friendly unique identifier
  region: string;
  country_code: string | null; // ISO 3166-1 alpha-2
  state_province: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  supported_materials: string[];
  certifications: string[];
  accepts_device_categories: DeviceCategory[];
  website_url: string | null;
  email: string | null;
  phone: string | null;
  contact_notes: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  partner_metadata: PartnerMetadata;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Flexible metadata for partner details
 */
export interface PartnerMetadata {
  // Operating hours
  hours_of_operation?: Record<string, { open: string; close: string }>;
  // Drop-off vs pickup
  accepts_dropoff?: boolean;
  offers_pickup?: boolean;
  pickup_radius_km?: number;
  // Data destruction services
  offers_data_destruction?: boolean;
  data_destruction_certifications?: string[];
  // Business type
  business_type?: 'recycler' | 'refurbisher' | 'collector' | 'processor';
  // Capacity info
  monthly_capacity_tonnes?: number;
  // Additional custom fields
  [key: string]: unknown;
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Assessment with user info (for admin/dashboard views)
 */
export interface AssessmentWithUser extends Assessment {
  user_email?: string;
  user_name?: string;
}

/**
 * Recycling partner with computed distance (for nearby search results)
 */
export interface RecyclingPartnerWithDistance extends RecyclingPartner {
  distance_km: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
  page: number;
  page_size: number;
  total_pages: number;
  has_more: boolean;
}

// ============================================================================
// INPUT/INSERT TYPES (for create operations)
// ============================================================================

/**
 * Input for creating a new assessment
 * Omit auto-generated fields (id, created_at, updated_at)
 */
export type AssessmentInsert = Omit<
  Assessment,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Input for updating an assessment
 * All fields optional except id
 */
export type AssessmentUpdate = Partial<Omit<Assessment, 'id' | 'created_at'>> & {
  id: string;
};

/**
 * Input for creating a new recycling partner
 */
export type RecyclingPartnerInsert = Omit<
  RecyclingPartner,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Input for updating a recycling partner
 */
export type RecyclingPartnerUpdate = Partial<
  Omit<RecyclingPartner, 'id' | 'created_at'>
> & {
  id: string;
};

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

/**
 * Filters for querying assessments
 */
export interface AssessmentFilters {
  user_id?: string;
  device_category?: DeviceCategory;
  chosen_route?: CircularRoute;
  score_min?: number;
  score_max?: number;
  carbon_savings_min?: number;
  date_from?: string; // ISO 8601
  date_to?: string; // ISO 8601
  search?: string; // Search in device_brand, device_model, diagnosis_summary
}

/**
 * Filters for querying recycling partners
 */
export interface RecyclingPartnerFilters {
  region?: string;
  country_code?: string;
  state_province?: string;
  city?: string;
  supported_materials?: string[];
  certifications?: string[];
  accepts_device_categories?: DeviceCategory[];
  is_active?: boolean;
  is_featured?: boolean;
  search?: string; // Search in name, address, contact_notes
}

/**
 * Parameters for nearby recycler search
 */
export interface NearbyRecyclersParams {
  latitude: number;
  longitude: number;
  radius_km?: number;
  device_category?: DeviceCategory;
  material?: string;
  limit?: number;
}

// ============================================================================
// AGGREGATE & STATS TYPES
// ============================================================================

/**
 * User assessment statistics
 */
export interface UserAssessmentStats {
  total_assessments: number;
  by_route: Record<CircularRoute, number>;
  by_category: Record<DeviceCategory, number>;
  total_carbon_saved_kg_co2e: number;
  average_score: number;
  assessments_this_month: number;
}

/**
 * Global platform statistics
 */
export interface PlatformStats {
  total_assessments: number;
  total_users: number;
  total_carbon_saved_kg_co2e: number;
  assessments_by_route: Record<CircularRoute, number>;
  assessments_by_category: Record<DeviceCategory, number>;
  active_recyclers: number;
  featured_recyclers: number;
}

// ============================================================================
// SUPABASE CLIENT TYPES (for type-safe queries)
// ============================================================================

/**
 * Type-safe Supabase client database schema
 * Extend this when adding new tables
 */
export interface Database {
  public: {
    Tables: {
      assessments: {
        Row: Assessment;
        Insert: AssessmentInsert;
        Update: AssessmentUpdate;
        Relationships: [
          {
            foreignKeyName: 'assessments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      recycling_partners: {
        Row: RecyclingPartner;
        Insert: RecyclingPartnerInsert;
        Update: RecyclingPartnerUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_nearby_recyclers: {
        Args: NearbyRecyclersParams;
        Returns: RecyclingPartnerWithDistance[];
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      device_category: DeviceCategory;
      circular_route: CircularRoute;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Standardized API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * Result type for Supabase operations
 */
export type SupabaseResult<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract the insert type from a table row
 */
export type InsertType<T> = T extends { Insert: infer I } ? I : never;

/**
 * Extract the update type from a table row
 */
export type UpdateType<T> = T extends { Update: infer U } ? U : never;

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Database row with timestamps converted to Date objects
 */
export type WithDates<T> = {
  [K in keyof T]: T[K] extends string
    ? K extends `${string}_at` | `created_at` | `updated_at`
      ? Date
      : T[K]
    : T[K];
};

// ============================================================================
// CONSTANTS (for validation and UI)
// ============================================================================

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  'smartphone',
  'laptop',
  'tablet',
  'wearable',
  'audio',
  'console',
  'other',
];

export const CIRCULAR_ROUTES: CircularRoute[] = ['Repair', 'Reuse', 'Recycle'];

export const COMMON_MATERIALS = [
  'batteries',
  'pcbs',
  'plastics',
  'metals',
  'displays',
  'cables',
  'chargers',
  'camera_modules',
  'speakers',
  'motors',
  'sensors',
] as const;

export const COMMON_CERTIFICATIONS = [
  'R2v3',
  'e-Stewards',
  'ISO14001',
  'ISO9001',
  'ISO45001',
  'WEELABEX',
  'WEEE',
] as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDeviceCategory(value: string): value is DeviceCategory {
  return DEVICE_CATEGORIES.includes(value as DeviceCategory);
}

export function isCircularRoute(value: string): value is CircularRoute {
  return CIRCULAR_ROUTES.includes(value as CircularRoute);
}

export function assertDeviceCategory(value: string): DeviceCategory {
  if (!isDeviceCategory(value)) {
    throw new Error(`Invalid device category: ${value}`);
  }
  return value;
}

export function assertCircularRoute(value: string): CircularRoute {
  if (!isCircularRoute(value)) {
    throw new Error(`Invalid circular route: ${value}`);
  }
  return value;
}