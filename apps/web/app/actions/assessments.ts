'use server';

/**
 * Server Actions for Assessment Operations
 * Handles database operations for device assessments
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Assessment, AssessmentInsert, AssessmentMetadata, DeviceCategory, CircularRoute } from '@/types/database';
import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Input data for creating a new assessment
 * Matches the form data from the assessment page
 */
export interface SaveAssessmentInput {
  deviceCategory: DeviceCategory;
  brand: string;
  modelName: string;
  conditionGrade: string;
  estimatedValueUsd: number;
  chosenRoute: CircularRoute;
  photoUrl?: string | null;
  assessmentMetadata?: Partial<AssessmentMetadata>;
  userId?: string | null; // Will be populated from auth if not provided
}

/**
 * Result type for server actions
 */
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Assessment with formatted dates for display
 */
export interface AssessmentListItem extends Omit<Assessment, 'created_at' | 'updated_at'> {
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the authenticated user ID
 */
async function getUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Map condition grade to score (A=90-100, B=70-89, C=50-69, D=0-49)
 */
function conditionGradeToScore(grade: string): number {
  switch (grade.toUpperCase()) {
    case 'A': return 95;
    case 'B': return 80;
    case 'C': return 60;
    case 'D': return 35;
    default: return 50;
  }
}

/**
 * Estimate carbon savings based on device category and route
 */
function estimateCarbonSavings(category: DeviceCategory, route: CircularRoute): number {
  const baseSavings: Record<DeviceCategory, number> = {
    smartphone: 12.5,
    laptop: 45.0,
    tablet: 18.0,
    wearable: 5.0,
    audio: 3.0,
    console: 25.0,
    other: 10.0,
  };

  const routeMultiplier: Record<CircularRoute, number> = {
    Repair: 1.2,
    Reuse: 1.0,
    Recycle: 0.6,
  };

  return Math.round((baseSavings[category] * routeMultiplier[route]) * 1000) / 1000;
}

/**
 * Build assessment metadata from form input
 */
function buildMetadata(input: SaveAssessmentInput): AssessmentMetadata {
  return {
    component_scores: {
      overall: conditionGradeToScore(input.conditionGrade),
    },
    issues_detected: input.conditionGrade === 'D' ? ['Significant wear'] : [],
    recommended_actions: [
      `Route device to ${input.chosenRoute.toLowerCase()}`,
    ],
    repair_difficulty: input.conditionGrade === 'A' ? 'easy' : input.conditionGrade === 'B' ? 'moderate' : 'difficult',
    estimated_repair_cost_usd: input.conditionGrade === 'A' 
      ? { min: 0, max: 50 }
      : input.conditionGrade === 'B'
        ? { min: 50, max: 150 }
        : { min: 150, max: 400 },
    confidence_score: 0.85,
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Save a new device assessment to the database
 * @param input - Form data from the assessment page
 * @returns ActionResult with the created assessment or error
 */
export async function saveAssessment(input: SaveAssessmentInput): Promise<ActionResult<Assessment>> {
  try {
    // Get authenticated user
    const userId = input.userId ?? await getUserId();

    // Build the assessment record
    const computedScore = conditionGradeToScore(input.conditionGrade);
    const carbonSavings = estimateCarbonSavings(input.deviceCategory, input.chosenRoute);
    const metadata = buildMetadata(input);

    const assessmentData: AssessmentInsert = {
      user_id: userId,
      device_category: input.deviceCategory,
      device_brand: input.brand || null,
      device_model: input.modelName || null,
      computed_score: computedScore,
      chosen_route: input.chosenRoute,
      carbon_savings_kg_co2e: carbonSavings,
      assessment_metadata: metadata,
      photo_url: input.photoUrl ?? null,
      diagnosis_summary: `Device assessed as Grade ${input.conditionGrade.toUpperCase()}. Recommended route: ${input.chosenRoute}.`,
    };

    // Insert into database
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('saveAssessment error:', err);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Failed to save assessment',
      },
    };
  }
}

/**
 * Fetch all assessments ordered by latest created_at
 * @param limit - Maximum number of assessments to return (default: 50)
 * @returns ActionResult with array of assessments or error
 */
export async function getAssessments(limit: number = 50): Promise<ActionResult<Assessment[]>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase fetch error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: data ?? [] };
  } catch (err) {
    console.error('getAssessments error:', err);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch assessments',
      },
    };
  }
}

/**
 * Fetch assessments for the current authenticated user
 * @param limit - Maximum number of assessments to return (default: 50)
 * @returns ActionResult with array of assessments or error
 */
export async function getUserAssessments(limit: number = 50): Promise<ActionResult<Assessment[]>> {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      };
    }

    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase fetch error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: data ?? [] };
  } catch (err) {
    console.error('getUserAssessments error:', err);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch user assessments',
      },
    };
  }
}

/**
 * Fetch a single assessment by ID
 * @param id - Assessment UUID
 * @returns ActionResult with the assessment or error
 */
export async function getAssessmentById(id: string): Promise<ActionResult<Assessment>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase fetch error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('getAssessmentById error:', err);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Failed to fetch assessment',
      },
    };
  }
}

/**
 * Update an existing assessment
 * @param id - Assessment UUID
 * @param updates - Partial assessment data to update
 * @returns ActionResult with the updated assessment or error
 */
export async function updateAssessment(
  id: string,
  updates: Partial<Omit<Assessment, 'id' | 'created_at' | 'user_id'>>
): Promise<ActionResult<Assessment>> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('updateAssessment error:', err);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Failed to update assessment',
      },
    };
  }
}

/**
 * Delete an assessment by ID
 * @param id - Assessment UUID
 * @returns ActionResult with success status or error
 */
export async function deleteAssessment(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true };
  } catch (err) {
    console.error('deleteAssessment error:', err);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: err instanceof Error ? err.message : 'Failed to delete assessment',
      },
    };
  }
}