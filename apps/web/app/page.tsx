'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Users, FileText, ArrowRight, Sparkles, RefreshCw, ShieldCheck, Camera } from 'lucide-react'
import Typewriter from '@/components/Typewriter'

export default function DashboardOverview() {
  const [partnerCount, setPartnerCount] = useState<number>(0)
  const [assessmentCount, setAssessmentCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const supabase = createBrowserClient()
        
        const [{ count: pCount }, { count: aCount }] = await Promise.all([
          supabase.from('recycling_partners').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('assessments').select('*', { count: 'exact', head: true })
        ])
        
        if (pCount !== null) setPartnerCount(pCount)
        if (aCount !== null) setAssessmentCount(aCount)
      } catch (error) {
        console.error('Error fetching dashboard counts:', error)
        // Keep counts at 0 on any error (missing tables, connection issues, etc.)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCounts()
  }, [])

  const accent = '#c2dbf0'
  const accentBorder = '1px solid rgba(194, 219, 240, 0.22)'
  const accentBg = 'rgba(194, 219, 240, 0.15)'
  const accentHover = 'rgba(194, 219, 240, 0.3)'
  const cardBg = '#3c454a'
  const pageBg = '#f4f0ea'

  const auditPhrases = [
    'Analyzing material composition...',
    'Connecting to active recycling nodes...',
    'Calculating device circularity index...',
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: pageBg, fontFamily: 'sans-serif', overflowY: 'auto' }}>
      
      {/* Main Content Dashboard */}
      <div style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>
            eLoop Command Center
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2dbd0', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#2c4a4a' }}>
            <ShieldCheck size={14} style={{ color: accent }} /> Enterprise Node Active
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          
          {/* Active Partners Card */}
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '36px', border: accentBorder, color: '#fff', position: 'relative', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', color: accent, fontWeight: '700' }}>
                Active Partners
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: accentBg, color: accent }}>
                <Users size={22} />
              </div>
            </div>
            <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-1px' }}>
              {isLoading ? '—' : partnerCount}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: accent, lineHeight: '1.5' }}>
              {partnerCount} certified nodes
            </div>
          </div>

          {/* Total Assessments Card */}
          <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '36px', border: accentBorder, color: '#fff', position: 'relative', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', color: accent, fontWeight: '700' }}>
                Total Assessments
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: accentBg, color: accent }}>
                <FileText size={22} />
              </div>
            </div>
            <div style={{ fontSize: '48px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-1px' }}>
              {isLoading ? '—' : assessmentCount}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500', color: accent, lineHeight: '1.5' }}>
              Device lifecycle records
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#333', letterSpacing: '-0.3px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          
          {/* New Assessment Quick Link */}
          <Link href="/assessments?action=camera" style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', border: accentBorder, color: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box', position: 'relative', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: accentBg, color: accent }}>
                  <Sparkles size={22} />
                </div>
                <ArrowRight size={18} style={{ color: accent, opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
                New Assessment
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: accent, lineHeight: '1.5' }}>
                Instant circularity analysis
              </div>
            </div>
          </Link>

          {/* Find Recyclers Quick Link */}
          <Link href="/recyclers" style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', border: accentBorder, color: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box', position: 'relative', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: accentBg, color: accent }}>
                  <Users size={22} />
                </div>
                <ArrowRight size={18} style={{ color: accent, opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
                Find Recyclers
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: accent, lineHeight: '1.5' }}>
                Verified recycling nodes
              </div>
            </div>
          </Link>

          {/* History Quick Link */}
          <Link href="/history" style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '32px', border: accentBorder, color: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box', position: 'relative', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: accentBg, color: accent }}>
                  <RefreshCw size={22} />
                </div>
                <ArrowRight size={18} style={{ color: accent, opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
                History
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: accent, lineHeight: '1.5' }}>
                Diagnostic & certification logs
              </div>
            </div>
          </Link>
        </div>

        {/* Banner Card with Typewriter */}
        <div style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '36px', border: accentBorder, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1.5px', color: accent, marginBottom: '8px', textTransform: 'uppercase' }}>
              System Initialization
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Ready to process your first device?
            </h3>
            <p style={{ fontSize: '13px', color: '#a0aec0', maxWidth: '600px', lineHeight: '1.6' }}>
              <Typewriter 
                phrases={auditPhrases} 
                typeSpeed={35} 
                deleteSpeed={20} 
                pauseDuration={1500}
                cursorColor={accent}
                className="block"
              />
            </p>
          </div>
          <Link href="/assessments?action=camera">
            <button style={{ 
              padding: '16px 32px', 
              backgroundColor: accent, 
              color: '#111', 
              border: 'none', 
              borderRadius: '30px', 
              fontWeight: '700', 
              fontSize: '15px',
              cursor: 'pointer', 
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background-color 0.2s ease',
            }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = accentHover; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = accent; }}>
              <Camera size={18} />
              Launch Camera
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}