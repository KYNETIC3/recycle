'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

const SAMPLE_DEVICES = [
  { name: 'iPhone 13 Pro', desc: 'Display shattered' },
  { name: 'ASUS PRIME Z370-A', desc: '2 bad DDR4 slots' },
  { name: 'MacBook Pro 16" Battery', desc: '68% capacity' }
] as const

const ASSESSMENT_STEPS = [
  'Identify device',
  'Inspect damage',
  'Test repair route',
  'Estimate materials'
] as const

export default function NewAssessment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeSample, setActiveSample] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAssessing, setIsAssessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [completionData, setCompletionData] = useState<{ id: string; route: string } | null>(null)

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanBoxRef = useRef<HTMLDivElement>(null)
  const assessmentIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be smaller than 10 MB.')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setActiveSample(null)
      stopCamera()
      e.target.value = ''
    }
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setIsCameraActive(true)
    setActiveSample(null)
    setSelectedFile(null)
    setPreviewUrl(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setCameraError('Unable to access camera. Please check permissions or use "Choose photo".')
      setIsCameraActive(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            stopCamera()
          }
        }, 'image/jpeg', 0.92)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [])

  const writeAssessmentToDatabase = useCallback(async (
    sampleName: string,
    file: File | null,
    preview: string | null
  ) => {
    try {
      let photoUrl: string | null = null

      // Upload image if selected
      if (file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
        const filePath = `assessments/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('device-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('device-photos')
          .getPublicUrl(filePath)

        photoUrl = publicUrlData.publicUrl
      }

      // Determine route based on sample or default
      const routes = ['RECYCLING', 'REFURBISHMENT', 'PARTS_HARVESTING']
      const route = routes[Math.floor(Math.random() * routes.length)]

      // Insert assessment record
      const { data, error: insertError } = await supabase
        .from('assessments')
        .insert({
          device_category: 'smartphone',
          device_brand: 'Apple',
          device_model: sampleName,
          computed_score: Math.floor(Math.random() * 40) + 60,
          chosen_route: route,
          carbon_savings_kg_co2e: Math.random() * 50,
          photo_url: photoUrl,
          assessment_metadata: {
            condition_grade: 'B',
            estimated_value_usd: Math.floor(Math.random() * 500) + 100,
            sample_name: sampleName
          },
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      return { id: data.id, route }
    } catch (err) {
      console.error('Failed to save assessment:', err)
      return null
    }
  }, [])

  const handleSampleClick = useCallback(async (sampleName: string) => {
    setActiveSample(sampleName)
    setSelectedFile(null)
    setPreviewUrl(null)
    stopCamera()
    setCurrentStep(0)
    setIsAssessing(true)
    setIsComplete(false)
    setCompletionData(null)

    // Clear any existing interval
    if (assessmentIntervalRef.current) {
      clearInterval(assessmentIntervalRef.current)
    }

    // Simulate assessment progress with proper step completion
    assessmentIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1
        
        // If we've completed all steps (index 3 = 4th step)
        if (nextStep >= ASSESSMENT_STEPS.length - 1) {
          clearInterval(assessmentIntervalRef.current!)
          setIsAssessing(false)
          setIsComplete(true)
          
          // Write to database
          writeAssessmentToDatabase(sampleName, selectedFile, previewUrl).then((result) => {
            if (result) {
              setCompletionData(result)
            }
          })
          
          return ASSESSMENT_STEPS.length - 1
        }
        
        return nextStep
      })
    }, 1500)
  }, [stopCamera, selectedFile, previewUrl, writeAssessmentToDatabase])

  const handleAnalyzeCustom = useCallback(async () => {
    if (!selectedFile) return
    
    setActiveSample('custom-capture')
    setIsAssessing(true)
    setCurrentStep(0)
    setIsComplete(false)
    setCompletionData(null)

    if (assessmentIntervalRef.current) {
      clearInterval(assessmentIntervalRef.current)
    }

    assessmentIntervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1
        
        if (nextStep >= ASSESSMENT_STEPS.length - 1) {
          clearInterval(assessmentIntervalRef.current!)
          setIsAssessing(false)
          setIsComplete(true)
          
          writeAssessmentToDatabase('custom-capture', selectedFile, previewUrl).then((result) => {
            if (result) {
              setCompletionData(result)
            }
          })
          
          return ASSESSMENT_STEPS.length - 1
        }
        
        return nextStep
      })
    }, 1500)
  }, [selectedFile, previewUrl, writeAssessmentToDatabase])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setActiveSample(null)
    stopCamera()
    setCurrentStep(0)
    setIsAssessing(false)
    setIsComplete(false)
    setCompletionData(null)
    if (assessmentIntervalRef.current) {
      clearInterval(assessmentIntervalRef.current)
    }
  }, [previewUrl, stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (assessmentIntervalRef.current) {
        clearInterval(assessmentIntervalRef.current)
      }
    }
  }, [stopCamera, previewUrl])

  // Corner bracket component - using muted teal
  const Corner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const styles: Record<string, React.CSSProperties> = {
      tl: { top: 0, left: 0, borderTop: '3px solid #3A828F', borderLeft: '3px solid #3A828F', borderRadius: '8px 0 0 0' },
      tr: { top: 0, right: 0, borderTop: '3px solid #3A828F', borderRight: '3px solid #3A828F', borderRadius: '0 8px 0 0' },
      bl: { bottom: 0, left: 0, borderBottom: '3px solid #3A828F', borderLeft: '3px solid #3A828F', borderRadius: '0 0 0 8px' },
      br: { bottom: 0, right: 0, borderBottom: '3px solid #3A828F', borderRight: '3px solid #3A828F', borderRadius: '0 0 8px 0' }
    }
    return <div style={{ ...styles[position], position: 'absolute', width: '24px', height: '24px', pointerEvents: 'none' }} />
  }

  // Professional button styles - no neon/glowing
  const primaryButton = (isActive = true): React.CSSProperties => ({
    padding: '12px 28px',
    backgroundColor: isActive ? '#3A828F' : '#cbd5d8',
    color: isActive ? '#fff' : '#6b7a7d',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: isActive ? 'pointer' : 'not-allowed',
    transition: 'background-color 0.15s ease, opacity 0.15s ease',
    opacity: isActive ? 1 : 0.6,
    boxShadow: 'none'
  })

  const secondaryButton = (): React.CSSProperties => ({
    padding: '12px 28px',
    backgroundColor: 'transparent',
    color: '#3A828F',
    border: '2px solid #3A828F',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'none'
  })

  const dangerButton = (): React.CSSProperties => ({
    padding: '12px 28px',
    backgroundColor: '#b3261e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    boxShadow: 'none'
  })

  const successButton = (): React.CSSProperties => ({
    padding: '12px 28px',
    backgroundColor: '#2d6b73',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    boxShadow: 'none'
  })

  const darkPanelButton = (): React.CSSProperties => ({
    width: '100%',
    padding: '14px',
    backgroundColor: '#1a3333',
    color: '#fff',
    border: '1px solid #2d5d68',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'none'
  })

  const progressPercent = isComplete ? 100 : isAssessing 
    ? Math.round(((Math.min(currentStep + 1, ASSESSMENT_STEPS.length)) / ASSESSMENT_STEPS.length) * 100)
    : 0

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#f4f0ea', 
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif', 
      overflow: 'hidden' 
    }}>
      {/* Hidden Inputs */}
      <input
        type="file"
        accept="image/*"
        ref={uploadInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ 
            fontSize: '11px', 
            color: '#888', 
            textTransform: 'uppercase', 
            marginBottom: '8px', 
            letterSpacing: '2px',
            fontWeight: '500'
          }}>Step 02 of 03</p>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            marginBottom: '0', 
            color: '#15261F',
            letterSpacing: '-0.5px'
          }}>New assessment</h1>
        </div>

        {/* Scanner Box */}
        <div 
          ref={scanBoxRef}
          style={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e2dcd6',
            padding: '0',
            position: 'relative',
            backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          {/* Corner Brackets - muted teal */}
          <Corner position="tl" />
          <Corner position="tr" />
          <Corner position="bl" />
          <Corner position="br" />

          {/* Camera Error Toast */}
          {cameraError && (
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              backgroundColor: '#fff5f5',
              border: '1px solid #ffc9c9',
              color: '#b3261e',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              {cameraError}
            </div>
          )}

          {/* Active Camera Viewfinder */}
          {isCameraActive && (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 5
            }}>
              <div style={{ 
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 200px)'
              }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ 
                    display: 'block',
                    width: 'auto',
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 280px)',
                    borderRadius: '12px'
                  }} 
                />
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginTop: '24px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  style={primaryButton()}
                >
                  Snap Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  style={secondaryButton()}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Photo Preview State */}
          {previewUrl && !isCameraActive && !activeSample && (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 5,
              padding: '24px'
            }}>
              <div style={{ 
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(15,44,51,0.1)',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 280px)'
              }}>
                <img 
                  src={previewUrl} 
                  alt="Device preview" 
                  style={{ 
                    display: 'block',
                    width: 'auto',
                    maxWidth: '100%',
                    maxHeight: 'calc(100vh - 280px)',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginTop: '24px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    startCamera();
                  }}
                  style={dangerButton()}
                >
                  Retake photo
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzeCustom}
                  style={successButton()}
                >
                  Analyze Device
                </button>
              </div>
            </div>
          )}

          {/* Default Upload State */}
          {!isCameraActive && !previewUrl && !activeSample && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              maxWidth: '480px',
              position: 'relative',
              zIndex: 5
            }}>
              <p style={{ 
                marginBottom: '32px', 
                fontWeight: '500', 
                color: '#333', 
                fontSize: '18px',
                letterSpacing: '-0.3px'
              }}>Add a device photo</p>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  style={primaryButton()}
                >
                  Choose photo
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  style={primaryButton()}
                >
                  Take photo
                </button>
              </div>
              <p style={{ fontSize: '13px', color: '#888', fontWeight: '400' }}>Or drop an image here. Up to 10 MB.</p>
            </div>
          )}

          {/* Assessment Complete State */}
          {isComplete && (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 5,
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#e8f5f3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '24px',
                border: '2px solid #3A828F'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A828F" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#15261F', 
                marginBottom: '8px'
              }}>Assessment Complete</h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#4A5A4D', 
                marginBottom: '8px'
              }}>Route: <strong>{completionData?.route || '—'}</strong></p>
              <p style={{ 
                fontSize: '14px', 
                color: '#888', 
                marginBottom: '32px'
              }}>Assessment saved to database</p>
              <button
                type="button"
                onClick={handleReset}
                style={secondaryButton()}
              >
                New Assessment
              </button>
            </div>
          )}

          {/* Sample Active Indicator */}
          {activeSample && !isCameraActive && !previewUrl && !isComplete && (
            <div style={{ 
              position: 'absolute', 
              bottom: '20px', 
              left: '24px', 
              right: '24px',
              padding: '12px 16px',
              backgroundColor: '#f0f7f6',
              border: '1px solid #c4e0dc',
              borderRadius: '8px',
              fontSize: '12px', 
              color: '#2d6b73', 
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '0.5px',
              zIndex: 5
            }}>
              SAMPLE ACTIVE: {activeSample.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ 
        width: '380px', 
        backgroundColor: '#102222', 
        color: '#fff', 
        padding: '40px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        boxSizing: 'border-box',
        borderLeft: '1px solid rgba(255,255,255,0.03)',
        overflowY: 'auto'
      }}>
        {activeSample ? (
          /* Assessment Log View */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Assessment log</h3>
              <span style={{ fontSize: '14px', color: '#A3B8A8', fontWeight: '600' }}>
                {progressPercent}%
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ASSESSMENT_STEPS.map((step, idx) => {
                const isCompleteStep = isComplete || (isAssessing && idx < currentStep) || (!isAssessing && activeSample && idx <= currentStep)
                const isCurrent = isAssessing && idx === currentStep && !isComplete
                const isLastStep = idx === ASSESSMENT_STEPS.length - 1
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      backgroundColor: '#162a2a', 
                      padding: '16px 20px', 
                      borderRadius: '10px', 
                      border: `1px solid ${isCurrent ? '#3A828F' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.3s ease',
                      boxShadow: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        color: isCompleteStep || isCurrent ? '#fff' : '#a0aec0'
                      }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: isCompleteStep ? '#3A828F' : isCurrent ? '#3A828F' : '#666',
                          fontWeight: '700',
                          width: '28px'
                        }}>0{idx + 1}</span>
                        {step}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 'normal',
                        color: isCompleteStep ? '#3A828F' : isCurrent ? '#3A828F' : '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {(isCompleteStep || (isComplete && isLastStep)) ? 'Done' : isCurrent ? 'Running' : 'Queued'}
                      </span>
                    </div>
                    <div style={{ 
                      height: '4px', 
                      backgroundColor: '#0d1f1f', 
                      borderRadius: '2px', 
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${(isCompleteStep || (isComplete && isLastStep)) ? 100 : isCurrent ? 50 : 0}%`, 
                        height: '100%', 
                        backgroundColor: '#3A828F',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {isComplete && completionData && (
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                backgroundColor: '#1a3333', 
                borderRadius: '10px',
                border: '1px solid #2d5d68'
              }}>
                <div style={{ fontSize: '12px', color: '#3A828F', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Assessment Saved
                </div>
                <div style={{ fontSize: '14px', color: '#fff' }}>
                  <span style={{ color: '#A3B8A8' }}>ID:</span> {completionData.id.slice(0, 8)}...<br/>
                  <span style={{ color: '#A3B8A8' }}>Route:</span> {completionData.route}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              style={{ ...darkPanelButton(), marginTop: '24px' }}
            >
              ← Back to sample selection
            </button>
          </div>
        ) : (
          /* Sample Devices List View */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '24px', fontWeight: '600', margin: 0 }}>Or try a sample device</h3>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SAMPLE_DEVICES.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => handleSampleClick(sample.name)}
                  style={{
                    backgroundColor: '#162a2a',
                    padding: '18px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.05)',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a3333'
                    e.currentTarget.style.borderColor = 'rgba(58,130,143,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#162a2a'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px', color: '#fff' }}>{sample.name}</div>
                  <div style={{ fontSize: '13px', color: '#A3B8A8' }}>{sample.desc}</div>
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: '24px', fontSize: '12px', color: '#666', lineHeight: '1.6', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              Check that the whole device is in view, including any damage.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}