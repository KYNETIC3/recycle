'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardOverview() {
  const [partnerCount, setPartnerCount] = useState<number>(18)
  const [assessmentCount, setAssessmentCount] = useState<number>(0)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const { count: pCount } = await supabase.from('recycling_partners').select('*', { count: 'exact', head: true })
        if (pCount !== null) setPartnerCount(pCount)

        const { count: aCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true })
        if (aCount !== null) setAssessmentCount(aCount)
      } catch (err) {
        console.error('Error fetching dashboard counts:', err)
      }
    }
    fetchCounts()
  }, [])

  const cardBg = '#183030'
  const cardBorder = '1px solid rgba(124, 224, 211, 0.25)'
  const cardGlow = '0 0 15px rgba(124, 224, 211, 0.08)'
  const iconBg = 'rgba(255, 255, 255, 0.06)'
  const iconColor = '#7ce0d3'

  const iconStyle = { width: '20px', height: '20px', stroke: iconColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const iconContainerStyle = { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f0ea', fontFamily: 'sans-serif', overflowY: 'auto' }}>
      
      {/* Main Content Dashboard */}
      <div style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '32px', color: '#111' }}>
          eLoop Dashboard
        </h1>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          
          {/* Active Partners Card */}
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '28px', border: cardBorder, color: '#fff', position: 'relative', boxShadow: cardGlow }}>
            <div style={iconContainerStyle}>
              <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a0aec0', marginBottom: '8px', fontWeight: '600' }}>
              Active Partners
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
              {partnerCount}
            </div>
            <div style={{ fontSize: '13px', color: '#a0aec0' }}>
              Certified recycling partners worldwide
            </div>
          </div>

          {/* Total Assessments Card */}
          <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '28px', border: cardBorder, color: '#fff', position: 'relative', boxShadow: cardGlow }}>
            <div style={iconContainerStyle}>
              <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a0aec0', marginBottom: '8px', fontWeight: '600' }}>
              Total Assessments
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
              {assessmentCount}
            </div>
            <div style={{ fontSize: '13px', color: '#a0aec0' }}>
              Device assessments submitted
            </div>
          </div>
    </div>

    {/* Quick Actions Section */}
    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>
      Quick Actions
    </h2>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
      
      {/* New Assessment Quick Link */}
      <Link href="/assessments" style={{ textDecoration: 'none' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', border: cardBorder, color: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box', boxShadow: cardGlow }}>
          <div style={iconContainerStyle}>
            <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
            New Assessment →
          </div>
          <div style={{ fontSize: '13px', color: '#a0aec0' }}>
            Capture and analyze a device
          </div>
        </div>
      </Link>

      {/* Find Recyclers Quick Link */}
      <Link href="/recyclers" style={{ textDecoration: 'none' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', border: cardBorder, color: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box', boxShadow: cardGlow }}>
          <div style={iconContainerStyle}>
            <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
            Find Recyclers →
          </div>
          <div style={{ fontSize: '13px', color: '#a0aec0' }}>
            Browse certified recycling partners
          </div>
        </div>
      </Link>

      {/* History Quick Link */}
      <Link href="/history" style={{ textDecoration: 'none' }}>
        <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '24px', border: cardBorder, color: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box', boxShadow: cardGlow }}>
          <div style={iconContainerStyle}>
            <svg viewBox="0 0 24 24" style={iconStyle} aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
            History →
          </div>
          <div style={{ fontSize: '13px', color: '#a0aec0' }}>
            View past assessments
          </div>
        </div>
      </Link>

    </div>

    {/* New to eLoop Banner Card */}
    <div style={{ backgroundColor: cardBg, borderRadius: '12px', padding: '32px', border: cardBorder, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: cardGlow }}>
      <div>
        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1.2px', color: '#7ce0d3', marginBottom: '8px', textTransform: 'uppercase' }}>
          New to eLoop?
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
          Start your first assessment
        </h3>
        <p style={{ fontSize: '13px', color: '#a0aec0', maxWidth: '600px', lineHeight: '1.5' }}>
          Upload a device photo and let our AI evaluate its condition, then get a recommended circular route with certified recycler matches.
        </p>
      </div>
      <Link href="/assessments">
        <button style={{ padding: '12px 24px', backgroundColor: '#7ce0d3', color: '#111', border: 'none', borderRadius: '24px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Upload Device Photo
        </button>
      </Link>
    </div>

  </div>
</div>
)
}