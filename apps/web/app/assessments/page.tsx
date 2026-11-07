"use client";

import Image from "next/image";
import { useState, FormEvent, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { Camera, X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

const skyBlue = '#7aa2e3';
const skyBlueBorder = 'rgba(122, 162, 227, 0.3)';
const skyBlueBg = 'rgba(122, 162, 227, 0.1)';
const skyBlueHover = 'rgba(122, 162, 227, 0.2)';
const cardBg = '#121816';
const cardBorder = '1px solid rgba(122, 162, 227, 0.15)';
const pageBg = '#f4f0ea';

export default function AssessmentsPage() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get("action");

  const [formData, setFormData] = useState({
    deviceCategory: "",
    brand: "",
    modelName: "",
    conditionGrade: "",
    estimatedValueUsd: "",
    chosenRoute: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startCamera = useCallback(async () => {
    setIsCameraActive(true);
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions or use "Choose photo".');
      setIsCameraActive(false);
    }
  }, [imagePreviewUrl]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
            stopCamera();
          }
        }, 'image/jpeg', 0.92);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const clearImage = useCallback(() => {
    startCamera();
  }, [startCamera]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB");
      return;
    }
    setError(null);
    setImageFile(file);
    setIsCameraActive(false);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  // Initialize camera if action=camera query param is present
  useEffect(() => {
    if (initialAction === "camera") {
      startCamera();
    }
  }, [initialAction, startCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [stopCamera, imagePreviewUrl]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add("border-skyBlue", "bg-skyBlue-bg");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-skyBlue", "bg-skyBlue-bg");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-skyBlue", "bg-skyBlue-bg");
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);
    setUploadProgress(0);

    try {
      let photoUrl: string | null = null;

      // Upload image if selected
      if (imageFile) {
        setUploadProgress(10);
        const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const filePath = `assessments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("device-photos")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        setUploadProgress(60);

        const { data: publicUrlData } = supabase.storage
          .from("device-photos")
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
        setUploadProgress(90);
      }

      // Insert assessment record
      const { error: insertError } = await supabase.from("assessments").insert({
        device_category: formData.deviceCategory.toLowerCase(),
        device_brand: formData.brand,
        device_model: formData.modelName,
        computed_score: 0,
        chosen_route: formData.chosenRoute,
        carbon_savings_kg_co2e: 0,
        photo_url: photoUrl,
        assessment_metadata: {
          condition_grade: formData.conditionGrade,
          estimated_value_usd: parseFloat(formData.estimatedValueUsd) || 0,
        },
      });

      if (insertError) throw insertError;

      setUploadProgress(100);
      setSuccess(true);

      // Reset form
      setFormData({
        deviceCategory: "",
        brand: "",
        modelName: "",
        conditionGrade: "",
        estimatedValueUsd: "",
        chosenRoute: "",
      });
      clearImage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const inputStyle = `
    w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8]
    focus:border-skyBlue focus:ring-1 focus:ring-skyBlue
    disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm
  `.trim();

  const labelStyle = "block text-sm font-medium text-[#15261F] mb-1.5";

  const cardStyle = `
    bg-white border border-[#d5dbd8] rounded-2xl p-6
  `.trim();

  return (
    <div className="p-8 md:p-10 pb-24 md:pb-10 max-w-2xl mx-auto" style={{ 
      '--skyBlue': skyBlue, 
      '--skyBlue-border': skyBlueBorder, 
      '--skyBlue-bg': skyBlueBg,
      '--skyBlue-hover': skyBlueHover,
      backgroundColor: pageBg 
    }}>
      <header className="mb-6 md:mb-8">
        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.2px', color: skyBlue, fontWeight: '700' }}>
          Device Assessment
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-[#15261F] mt-1">New Assessment</h1>
      </header>

      {success && (
        <div
          role="status"
          className="mb-6 p-4 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#e8f5f3', border: '1px solid #c4e0dc', color: '#1a5c5c' }}
        >
          Assessment submitted successfully!
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#fff5f5', border: '1px solid #ffc9c9', color: '#b3261e' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Photo Upload Section */}
        <div className={cardStyle} style={{ backgroundColor: '#fff', borderColor: '#d5dbd8' }}>
          <h2 className="text-lg font-semibold text-[#15261F] mb-4">Device Photo</h2>

          <div
            ref={dropZoneRef}
            className={`relative flex h-[280px] items-center justify-center overflow-hidden border-2 rounded-2xl transition-all duration-200 ${
              imagePreviewUrl
                ? "border-[#d5dbd8]"
                : "border-[#d5dbd8] hover:border-skyBlue"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ borderColor: isCameraActive ? skyBlue : undefined }}
          >
            {/* Hidden file inputs */}
            <input
              type="file"
              accept="image/*"
              ref={uploadInputRef}
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
              disabled={isLoading || isCameraActive}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
              disabled={isLoading || isCameraActive}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {isCameraActive ? (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative',
                zIndex: 5,
                backgroundColor: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                {/* Video feed - takes all available space */}
                <div style={{ 
                  position: 'relative', 
                  flex: 1, 
                  width: '100%', 
                  minHeight: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {/* Viewfinder overlay */}
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    border: `2px solid ${skyBlue}`,
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                  }}>
                    {/* Corner brackets */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '16px', 
                      left: '16px', 
                      width: '40px', 
                      height: '40px', 
                      borderTop: `3px solid ${skyBlue}`, 
                      borderLeft: `3px solid ${skyBlue}`,
                      borderRadius: '4px 0 0 0',
                    }} />
                    <div style={{ 
                      position: 'absolute', 
                      top: '16px', 
                      right: '16px', 
                      width: '40px', 
                      height: '40px', 
                      borderTop: `3px solid ${skyBlue}`, 
                      borderRight: `3px solid ${skyBlue}`,
                      borderRadius: '0 4px 0 0',
                    }} />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '16px', 
                      left: '16px', 
                      width: '40px', 
                      height: '40px', 
                      borderBottom: `3px solid ${skyBlue}`, 
                      borderLeft: `3px solid ${skyBlue}`,
                      borderRadius: '0 0 0 4px',
                    }} />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '16px', 
                      right: '16px', 
                      width: '40px', 
                      height: '40px', 
                      borderBottom: `3px solid ${skyBlue}`, 
                      borderRight: `3px solid ${skyBlue}`,
                      borderRadius: '0 0 4px 0',
                    }} />
                    {/* Center crosshair */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      width: '60px', 
                      height: '60px', 
                      border: `1px solid ${skyBlue}`,
                      borderRadius: '50%',
                      opacity: 0.5,
                    }} />
                  </div>

                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ 
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }} 
                  />
                </div>

                {/* Fixed control bar at bottom - always visible */}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  padding: '16px 24px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  zIndex: 10,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)',
                  borderTop: `1px solid rgba(122, 162, 227, 0.15)`,
                }}>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px 28px',
                      backgroundColor: skyBlue,
                      color: '#111',
                      border: 'none',
                      borderRadius: '30px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: '0 4px 14px rgba(122, 162, 227, 0.35)',
                      flexShrink: 0,
                    }}
                    onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onMouseUp={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Camera size={18} />
                    Snap Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    disabled={isLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px 28px',
                      backgroundColor: 'transparent',
                      color: skyBlue,
                      border: `2px solid ${skyBlue}`,
                      borderRadius: '30px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = skyBlue; e.currentTarget.style.color = '#111'; } }}
                    onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = skyBlue; } }}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : imagePreviewUrl ? (
              <>
                <Image
                  src={imagePreviewUrl}
                  alt="Device photo preview"
                  fill
                  unoptimized
                  className="object-cover rounded-xl"
                  sizes="280px"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={isLoading}
                  className="absolute top-3 right-3 p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'; }}
                  aria-label="Remove photo"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 px-4 text-center" style={{ height: '100%', justifyContent: 'center' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: skyBlueBg, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: `1px solid ${skyBlueBorder}`,
                }}>
                  <ImageIcon size={32} style={{ color: skyBlue }} />
                </div>
                <p className="text-base font-medium text-[#15261F]">Add a device photo</p>
                <p className="text-sm" style={{ color: '#A3B8A8' }}>Or drag & drop an image (max 10 MB)</p>

                {/* Two action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); uploadInputRef.current?.click(); }}
                    disabled={isLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px 24px',
                      backgroundColor: skyBlue,
                      color: '#111',
                      border: 'none',
                      borderRadius: '30px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: '0 4px 14px rgba(122, 162, 227, 0.35)',
                      flex: 1,
                    }}
                    onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onMouseUp={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Upload size={18} />
                    Choose photo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); startCamera(); }}
                    disabled={isLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px 24px',
                      backgroundColor: 'transparent',
                      color: skyBlue,
                      border: `2px solid ${skyBlue}`,
                      borderRadius: '30px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.5 : 1,
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                      flex: 1,
                    }}
                    onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = skyBlue; e.currentTarget.style.color = '#111'; } }}
                    onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = skyBlue; } }}
                  >
                    <Camera size={18} />
                    Take photo
                  </button>
                </div>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                <div className="text-center text-white" style={{ minWidth: '200px' }}>
                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '100%' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%`, backgroundColor: skyBlue }}
                    />
                  </div>
                  <p className="text-sm font-medium">{uploadProgress}%</p>
                  {uploadProgress < 60 && <p className="text-xs" style={{ color: '#A3B8A8' }}>Uploading image…</p>}
                  {uploadProgress >= 60 && <p className="text-xs" style={{ color: '#A3B8A8' }}>Saving assessment…</p>}
                </div>
              </div>
            )}
          </div>

          {imageFile && (
            <p className="text-xs text-center mt-3" style={{ color: '#A3B8A8' }}>
              {imageFile.name} · {(imageFile.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        {/* Device Details Section */}
        <div className={cardStyle} style={{ backgroundColor: '#fff', borderColor: '#d5dbd8' }}>
          <h2 className="text-lg font-semibold text-[#15261F] mb-6">Device Details</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="deviceCategory" className={labelStyle}>
                Device Category <span style={{ color: skyBlue }}>*</span>
              </label>
              <select
                id="deviceCategory"
                name="deviceCategory"
                value={formData.deviceCategory}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={inputStyle}
              >
                <option value="">Select a category</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Laptop">Laptop</option>
                <option value="Tablet">Tablet</option>
                <option value="Smartwatch">Smartwatch</option>
              </select>
            </div>

            <div>
              <label htmlFor="brand" className={labelStyle}>
                Brand <span style={{ color: skyBlue }}>*</span>
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                value={formData.brand}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="e.g., Apple, Samsung, Dell"
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="modelName" className={labelStyle}>
                Model Name <span style={{ color: skyBlue }}>*</span>
              </label>
              <input
                id="modelName"
                name="modelName"
                type="text"
                value={formData.modelName}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="e.g., iPhone 15 Pro, MacBook Air M2"
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="conditionGrade" className={labelStyle}>
                Condition Grade <span style={{ color: skyBlue }}>*</span>
              </label>
              <select
                id="conditionGrade"
                name="conditionGrade"
                value={formData.conditionGrade}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={inputStyle}
              >
                <option value="">Select condition</option>
                <option value="A">Grade A - Excellent (Like new, no visible wear)</option>
                <option value="B">Grade B - Good (Minor cosmetic wear, fully functional)</option>
                <option value="C">Grade C - Fair (Visible wear, fully functional)</option>
                <option value="D">Grade D - Poor (Significant wear, may have functional issues)</option>
              </select>
            </div>

            <div>
              <label htmlFor="estimatedValueUsd" className={labelStyle}>
                Estimated Value (USD) <span style={{ color: skyBlue }}>*</span>
              </label>
              <input
                id="estimatedValueUsd"
                name="estimatedValueUsd"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedValueUsd}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="0.00"
                className={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="chosenRoute" className={labelStyle}>
                Chosen Route <span style={{ color: skyBlue }}>*</span>
              </label>
              <select
                id="chosenRoute"
                name="chosenRoute"
                value={formData.chosenRoute}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={inputStyle}
              >
                <option value="">Select a route</option>
                <option value="RECYCLING">Recycling</option>
                <option value="REFURBISHMENT">Refurbishment</option>
                <option value="PARTS_HARVESTING">Parts Harvesting</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 md:justify-end">
          <button
            type="button"
            onClick={() => {
              setFormData({
                deviceCategory: "",
                brand: "",
                modelName: "",
                conditionGrade: "",
                estimatedValueUsd: "",
                chosenRoute: "",
              });
              clearImage();
            }}
            disabled={isLoading}
            style={{
              padding: '14px 28px',
              backgroundColor: 'transparent',
              color: skyBlue,
              border: `2px solid ${skyBlue}`,
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'background-color 0.2s ease, color 0.2s ease',
              minHeight: '48px',
              minWidth: '140px',
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = skyBlue; e.currentTarget.style.color = '#111'; } }}
            onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = skyBlue; } }}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 28px',
              backgroundColor: skyBlue,
              color: '#111',
              border: 'none',
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 14px rgba(122, 162, 227, 0.35)',
              minHeight: '48px',
              minWidth: '180px',
            }}
            onMouseDown={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit Assessment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}