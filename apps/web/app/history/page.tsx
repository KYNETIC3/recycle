'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Users, FileText, Sparkles, RefreshCw, Camera, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Typewriter from '@/components/Typewriter';

interface AssessmentRecord {
  id: string;
  user_id: string | null;
  device_category: string;
  device_brand: string | null;
  device_model: string | null;
  computed_score: number;
  chosen_route: string;
  carbon_savings_kg_co2e: number;
  assessment_metadata: Record<string, unknown> | null;
  photo_url: string | null;
  diagnosis_summary: string | null;
  created_at: string;
  updated_at: string;
}

const accent = '#c2dbf0';
const accentBorder = '1px solid rgba(194, 219, 240, 0.22)';
const accentBg = 'rgba(194, 219, 240, 0.15)';
const cardBg = '#3c454a';
const pageBg = '#f4f0ea';

export default function HistoryPage() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserClient();
        const { data, error: fetchError } = await supabase
          .from('assessments')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setAssessments(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatRoute(route: string) {
    return route
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  function capitalizeFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const categoryColors: Record<string, string> = {
    smartphone: '#d4e8fa',
    laptop: '#c8e6c9',
    tablet: '#ffe0b2',
    wearable: '#e1bee7',
    audio: '#b3e5fc',
    console: '#d7ccc8',
    other: '#e0e0e0',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: pageBg, fontFamily: 'sans-serif', overflowY: 'auto' }}>
        <div style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px' }}>
              Assessment History
            </h1>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ backgroundColor: cardBg, borderRadius: '16px', padding: '24px', border: accentBorder, color: '#fff', position: 'relative', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)' }}>
                <div style={{ height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite', width: '60%' }} />
                <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite', width: '80%' }} />
                <div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite', width: '50%' }} />
              </div>
            ))}
          </div>
          <style jsx>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: pageBg, fontFamily: 'sans-serif', overflowY: 'auto' }}>
      <div style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: accentBg, color: accent }}>
              <RefreshCw size={20} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', letterSpacing: '-0.5px', margin: 0 }}>
              Assessment History
            </h1>
          </div>
          <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
            View your previously submitted device assessments
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ 
            backgroundColor: cardBg, 
            borderRadius: '16px', 
            padding: '24px', 
            border: accentBorder, 
            color: '#fff', 
            marginBottom: '24px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,100,100,0.2)', color: '#ff6464' }}>
                <Sparkles size={18} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: '500' }}>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && assessments.length === 0 && !error && (
          <div style={{ 
            backgroundColor: cardBg, 
            borderRadius: '16px', 
            padding: '48px', 
            border: accentBorder, 
            color: '#fff', 
            textAlign: 'center',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)'
          }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: accentBg, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: `1px solid ${accentBorder}`,
            }}>
              <FileText size={32} style={{ color: accent }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
              No assessments found
            </h2>
            <p style={{ fontSize: '16px', color: '#a0aec0', maxWidth: '400px', margin: '0 auto 24px' }}>
              You haven't submitted any assessments yet. Start by analyzing your first device.
            </p>
            <Link href="/assessments?action=camera" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '14px 28px', 
                backgroundColor: accent, 
                color: '#111', 
                border: 'none', 
                borderRadius: '30px', 
                fontWeight: '700', 
                fontSize: '14px',
                cursor: 'pointer', 
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
              }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#a8c8e8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = accent; }}>
                <Camera size={16} />
                Launch Camera
              </button>
            </Link>
          </div>
        )}

        {/* Assessments Grid */}
        {!isLoading && assessments.length > 0 && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {assessments.map((assessment) => {
              const metadata = assessment.assessment_metadata as Record<string, unknown> | null;
              const conditionGrade = metadata?.condition_grade as string | undefined;
              const estimatedValue = metadata?.estimated_value_usd as number | undefined;
              const categoryColor = categoryColors[assessment.device_category] || accent;

              return (
                <Link key={assessment.id} href={`/assessments?id=${assessment.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    backgroundColor: cardBg, 
                    borderRadius: '16px', 
                    padding: '24px', 
                    border: accentBorder, 
                    color: '#fff', 
                    position: 'relative', 
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.25)'; }}>
                    
                    {/* Header with category and date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        color: categoryColor, 
                        fontWeight: '700',
                        backgroundColor: `${categoryColor}20`,
                        padding: '4px 10px',
                        borderRadius: '20px',
                      }}>
                        {capitalizeFirst(assessment.device_category)}
                      </span>
                      <span style={{ fontSize: '13px', color: '#a0aec0', whiteSpace: 'nowrap' }}>
                        {formatDate(assessment.created_at)}
                      </span>
                    </div>

                    {/* Device Info */}
                    <div style={{ marginBottom: '20px', flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 4px', lineHeight: '1.3' }}>
                        {assessment.device_brand || 'Unknown'} {assessment.device_model || ''}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#a0aec0', margin: 0, lineHeight: '1.5' }}>
                        {assessment.diagnosis_summary || 'Device assessment completed'}
                      </p>
                    </div>

                    {/* Metrics Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      {/* Score */}
                      <div style={{ 
                        flex: 1, 
                        minWidth: '80px',
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        padding: '12px',
                        border: `1px solid rgba(255,255,255,0.1)`,
                      }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a0aec0', fontWeight: '600', marginBottom: '4px' }}>
                          Score
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                          {assessment.computed_score}
                        </div>
                      </div>

                      {/* Route */}
                      <div style={{ 
                        flex: 1, 
                        minWidth: '80px',
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        padding: '12px',
                        border: `1px solid rgba(255,255,255,0.1)`,
                      }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a0aec0', fontWeight: '600', marginBottom: '4px' }}>
                          Route
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: accent, lineHeight: '1.3' }}>
                          {formatRoute(assessment.chosen_route)}
                        </div>
                      </div>

                      {/* Carbon Savings */}
                      <div style={{ 
                        flex: 1, 
                        minWidth: '80px',
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        padding: '12px',
                        border: `1px solid rgba(255,255,255,0.1)`,
                      }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a0aec0', fontWeight: '600', marginBottom: '4px' }}>
                          CO₂ Saved
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#c8e6c9', lineHeight: '1.3' }}>
                          {assessment.carbon_savings_kg_co2e.toFixed(1)} kg
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      {conditionGrade && (
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          color: '#fff',
                          backgroundColor: '#162a2a',
                          border: '1px solid #2d5d68',
                          padding: '4px 10px',
                          borderRadius: '20px',
                        }}>
                          Grade {conditionGrade}
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '12px', 
                        color: accent,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600',
                      }}>
                        <ArrowRight size={14} />
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}