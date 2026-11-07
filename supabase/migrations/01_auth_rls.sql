-- ============================================================================
-- eLoop Authentication & RLS Migration
-- Migration: 01_auth_rls
-- Description: Ensures assessments table has proper user_id column with auth.uid() default
--              and RLS policies for authenticated user access
-- ============================================================================

-- Ensure user_id column exists on assessments with proper default
-- (This may already exist from initial schema, but we ensure it here)
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE assessments 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_assessments_user_id ON assessments(user_id);
        CREATE INDEX idx_assessments_user_created ON assessments(user_id, created_at DESC);
        CREATE INDEX idx_assessments_auth_user ON assessments(user_id) WHERE user_id IS NOT NULL;
    END IF;
END $$;

-- Enable RLS on assessments (if not already enabled)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ASSESSMENTS RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can insert own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can delete own assessments" ON assessments;
DROP POLICY IF EXISTS "Service role full access assessments" ON assessments;

-- Policy: Users can view their own assessments
CREATE POLICY "Users can view own assessments"
    ON assessments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own assessments (user_id defaults to auth.uid())
CREATE POLICY "Users can insert own assessments"
    ON assessments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own assessments
CREATE POLICY "Users can update own assessments"
    ON assessments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own assessments
CREATE POLICY "Users can delete own assessments"
    ON assessments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Service role has full access (for backend/admin operations)
CREATE POLICY "Service role full access assessments"
    ON assessments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RECYCLING_PARTNERS RLS POLICIES (keep publicly readable)
-- ============================================================================

-- Enable RLS on recycling_partners
ALTER TABLE recycling_partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read active recycling partners" ON recycling_partners;
DROP POLICY IF EXISTS "Authenticated users read all recycling partners" ON recycling_partners;
DROP POLICY IF EXISTS "Service role full access recycling partners" ON recycling_partners;

-- Policy: Anyone can view active recycling partners (public directory)
CREATE POLICY "Public read active recycling partners"
    ON recycling_partners
    FOR SELECT
    USING (is_active = TRUE);

-- Policy: Authenticated users can view all partners (including inactive for admin)
CREATE POLICY "Authenticated users read all recycling partners"
    ON recycling_partners
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Service role has full access (for backend/admin operations)
CREATE POLICY "Service role full access recycling partners"
    ON recycling_partners
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE BUCKET POLICIES FOR device-photos
-- ============================================================================

-- Note: These policies should be applied via Supabase Dashboard or storage.migrations
-- They are included here for reference:

-- INSERT policy: Users can upload to their own folder
-- CREATE POLICY "Users can upload own device photos"
--     ON storage.objects
--     FOR INSERT
--     WITH CHECK (bucket_id = 'device-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- SELECT policy: Users can view their own photos
-- CREATE POLICY "Users can view own device photos"
--     ON storage.objects
--     FOR SELECT
--     USING (bucket_id = 'device-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- DELETE policy: Users can delete their own photos
-- CREATE POLICY "Users can delete own device photos"
--     ON storage.objects
--     FOR DELETE
--     USING (bucket_id = 'device-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users for nearby recyclers function
GRANT EXECUTE ON FUNCTION get_nearby_recyclers TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_recyclers TO service_role;