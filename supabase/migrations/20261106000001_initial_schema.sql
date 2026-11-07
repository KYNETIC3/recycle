-- ============================================================================
-- eLoop Core Database Schema
-- Migration: 20261106000001_initial_schema
-- Description: Creates assessments and recycling_partners tables with RLS policies
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: assessments
-- Stores device triage records with AI-computed scores and recommended circular routes
-- ============================================================================

CREATE TABLE assessments (
    -- Primary key using UUID v7 for time-ordered, index-friendly IDs
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User/client identifier (links to auth.users when authenticated, nullable for guest)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Device classification
    device_category TEXT NOT NULL,
    device_brand TEXT,
    device_model TEXT,

    -- AI Assessment Results
    computed_score SMALLINT NOT NULL CHECK (computed_score BETWEEN 0 AND 100),
    chosen_route TEXT NOT NULL,
    carbon_savings_kg_co2e DECIMAL(10, 3) NOT NULL DEFAULT 0,

    -- Additional metadata
    assessment_metadata JSONB DEFAULT '{}'::jsonb,
    photo_url TEXT,
    diagnosis_summary TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query performance
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_device_category ON assessments(device_category);
CREATE INDEX idx_assessments_chosen_route ON assessments(chosen_route);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX idx_assessments_user_created ON assessments(user_id, created_at DESC);

-- Partial index for authenticated users' assessments (common query pattern)
CREATE INDEX idx_assessments_auth_user ON assessments(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- TABLE: recycling_partners
-- Directory of certified e-waste recyclers with supported materials and contact info
-- ============================================================================

CREATE TABLE recycling_partners (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Partner identification
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier

    -- Location & Coverage
    region TEXT NOT NULL, -- e.g., 'North America', 'Europe', 'APAC', 'Global'
    country_code CHAR(2), -- ISO 3166-1 alpha-2
    state_province TEXT,
    city TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Capabilities
    supported_materials TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['batteries', 'pcbs', 'plastics', 'metals', 'displays']
    certifications TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['R2v3', 'e-Stewards', 'ISO14001']
    accepts_device_categories TEXT[] NOT NULL DEFAULT '{}',

    -- Contact & Routing
    website_url TEXT,
    email TEXT,
    phone TEXT,
    contact_notes TEXT,

    -- Operational
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    partner_metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query performance
CREATE INDEX idx_recycling_partners_region ON recycling_partners(region);
CREATE INDEX idx_recycling_partners_country ON recycling_partners(country_code);
CREATE INDEX idx_recycling_partners_active ON recycling_partners(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_recycling_partners_featured ON recycling_partners(is_featured, sort_order) WHERE is_featured = TRUE;
CREATE INDEX idx_recycling_partners_materials ON recycling_partners USING GIN(supported_materials);
CREATE INDEX idx_recycling_partners_categories ON recycling_partners USING GIN(accepts_device_categories);
CREATE INDEX idx_recycling_partners_location ON recycling_partners(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycling_partners ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ASSESSMENTS RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own assessments
CREATE POLICY "Users can view own assessments"
    ON assessments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own assessments
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
-- RECYCLING_PARTNERS RLS POLICIES
-- ============================================================================

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
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assessments
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for recycling_partners
CREATE TRIGGER update_recycling_partners_updated_at
    BEFORE UPDATE ON recycling_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get nearby recycling partners (requires PostGIS for full geo queries)
-- This is a simplified version using bounding box - replace with PostGIS when available
CREATE OR REPLACE FUNCTION get_nearby_recyclers(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_km DECIMAL DEFAULT 50,
    p_device_category TEXT DEFAULT NULL,
    p_material TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    region TEXT,
    country_code CHAR(2),
    city TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    supported_materials TEXT[],
    certifications TEXT[],
    accepts_device_categories TEXT[],
    website_url TEXT,
    email TEXT,
    phone TEXT,
    distance_km DECIMAL
) AS $$
DECLARE
    lat_rad DECIMAL := radians(p_latitude);
    lon_rad DECIMAL := radians(p_longitude);
    radius_deg DECIMAL := p_radius_km / 111.0; -- Approximate degrees per km
BEGIN
    RETURN QUERY
    SELECT
        rp.id,
        rp.name,
        rp.slug,
        rp.region,
        rp.country_code,
        rp.city,
        rp.address,
        rp.latitude,
        rp.longitude,
        rp.supported_materials,
        rp.certifications,
        rp.accepts_device_categories,
        rp.website_url,
        rp.email,
        rp.phone,
        -- Haversine formula approximation for distance
        (6371 * acos(
            cos(lat_rad) * cos(radians(rp.latitude)) * cos(radians(rp.longitude) - lon_rad) +
            sin(lat_rad) * sin(radians(rp.latitude))
        ))::DECIMAL(10, 2) AS distance_km
    FROM recycling_partners rp
    WHERE rp.is_active = TRUE
        AND rp.latitude IS NOT NULL
        AND rp.longitude IS NOT NULL
        AND rp.latitude BETWEEN p_latitude - radius_deg AND p_latitude + radius_deg
        AND rp.longitude BETWEEN p_longitude - radius_deg AND p_longitude + radius_deg
        AND (p_device_category IS NULL OR p_device_category = ANY(rp.accepts_device_categories))
        AND (p_material IS NULL OR p_material = ANY(rp.supported_materials))
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_recyclers TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_recyclers TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE assessments IS 'Stores device triage records with AI-computed scores and recommended circular economy routes';
COMMENT ON TABLE recycling_partners IS 'Directory of certified e-waste recycling partners with capabilities and contact info';

COMMENT ON COLUMN assessments.computed_score IS 'AI-computed fixability score 0-100 (higher = more repairable)';
COMMENT ON COLUMN assessments.chosen_route IS 'Recommended circular route: Repair, Reuse, or Recycle';
COMMENT ON COLUMN assessments.carbon_savings_kg_co2e IS 'Estimated CO2e savings in kg from chosen route vs landfill';
COMMENT ON COLUMN assessments.assessment_metadata IS 'Flexible JSON for additional AI diagnostics, component scores, etc.';

COMMENT ON COLUMN recycling_partners.supported_materials IS 'Array of material types this partner can process';
COMMENT ON COLUMN recycling_partners.certifications IS 'Array of certifications (R2v3, e-Stewards, ISO14001, etc.)';
COMMENT ON COLUMN recycling_partners.accepts_device_categories IS 'Device categories this partner accepts';