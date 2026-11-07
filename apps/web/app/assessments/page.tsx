"use client";

import Image from "next/image";
import { useState, FormEvent, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AssessmentsPage() {
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
    // Instead of just clearing, immediately open camera for retake
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

  useEffect(() => {
    return () => {
      stopCamera();
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [stopCamera, imagePreviewUrl]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add("border-[#3A828F]", "bg-[#f0f7f6]");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-[#3A828F]", "bg-[#f0f7f6]");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-[#3A828F]", "bg-[#f0f7f6]");
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

  // Professional button styles - no neon/glowing
  const primaryButtonStyle = `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg
    bg-[#3A828F] text-white font-semibold text-sm
    hover:bg-[#2D6B73]
    focus:outline-none focus:ring-2 focus:ring-[#3A828F]/30
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
    cursor-pointer
  `.trim();

  const secondaryButtonStyle = `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg
    bg-transparent text-[#3A828F] font-semibold text-sm
    border-2 border-[#3A828F]
    hover:bg-[#f0f7f6]
    focus:outline-none focus:ring-2 focus:ring-[#3A828F]/30
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
    cursor-pointer
  `.trim();

  return (
    <div className="p-8 md:p-10 pb-24 md:pb-10 max-w-2xl mx-auto">
      <header className="mb-6 md:mb-8">
        <span className="p-label">Device Assessment</span>
        <h1 className="text-2xl md:text-3xl font-bold text-[#15261F] mt-1">New Assessment</h1>
      </header>

      {success && (
        <div
          role="status"
          className="mb-6 p-4 bg-[#e8f5f3] border border-[#c4e0dc] rounded-xl text-[#1a5c5c] text-sm font-medium"
        >
          Assessment submitted successfully!
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-[#fff5f5] border border-[#ffc9c9] rounded-xl text-[#b3261e] text-sm font-medium"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Photo Upload Section */}
        <div className="card-elevated-light p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#15261F]">Device Photo</h2>

          <div
            ref={dropZoneRef}
            className={`relative flex h-[280px] items-center justify-center overflow-hidden border-2 rounded-2xl transition-all duration-200 ${
              imagePreviewUrl
                ? "border-[#d5dbd8]"
                : "border-[#d5dbd8] hover:border-[#3A828F]/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                    disabled={isLoading}
                    className={primaryButtonStyle}
                  >
                    Snap Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    disabled={isLoading}
                    className={secondaryButtonStyle}
                  >
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
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Remove photo"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 px-4 text-center">
                <svg
                  className="w-12 h-12 text-[#A3B8A8]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-base font-medium text-[#15261F]">Add a device photo</p>
                <p className="text-sm text-[#A3B8A8]">Or drag & drop an image (max 10 MB)</p>

                {/* Two identically styled action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); uploadInputRef.current?.click(); }}
                    disabled={isLoading}
                    className={primaryButtonStyle}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Choose photo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); cameraInputRef.current?.click(); }}
                    disabled={isLoading}
                    className={secondaryButtonStyle}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    Take photo
                  </button>
                </div>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="text-center text-white">
                  <div className="h-2 w-48 bg-[#1B434C] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#3A828F] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm">{uploadProgress}%</p>
                  {uploadProgress < 60 && <p className="text-xs text-[#A3B8A8]">Uploading image…</p>}
                  {uploadProgress >= 60 && <p className="text-xs text-[#A3B8A8]">Saving assessment…</p>}
                </div>
              </div>
            )}
          </div>

          {imageFile && (
            <p className="text-xs text-[#A3B8A8] text-center">
              {imageFile.name} · {(imageFile.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        {/* Device Details Section */}
        <div className="card-elevated-light p-6 space-y-6">
          <h2 className="text-lg font-semibold text-[#15261F]">Device Details</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="deviceCategory" className="block text-sm font-medium text-[#15261F] mb-1.5">
                Device Category <span className="text-[#3A828F]">*</span>
              </label>
              <select
                id="deviceCategory"
                name="deviceCategory"
                value={formData.deviceCategory}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm"
              >
                <option value="">Select a category</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Laptop">Laptop</option>
                <option value="Tablet">Tablet</option>
                <option value="Smartwatch">Smartwatch</option>
              </select>
            </div>

            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-[#15261F] mb-1.5">
                Brand <span className="text-[#3A828F]">*</span>
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
                className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="modelName" className="block text-sm font-medium text-[#15261F] mb-1.5">
                Model Name <span className="text-[#3A828F]">*</span>
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
                className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="conditionGrade" className="block text-sm font-medium text-[#15261F] mb-1.5">
                Condition Grade <span className="text-[#3A828F]">*</span>
              </label>
              <select
                id="conditionGrade"
                name="conditionGrade"
                value={formData.conditionGrade}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm"
              >
                <option value="">Select condition</option>
                <option value="A">Grade A - Excellent (Like new, no visible wear)</option>
                <option value="B">Grade B - Good (Minor cosmetic wear, fully functional)</option>
                <option value="C">Grade C - Fair (Visible wear, fully functional)</option>
                <option value="D">Grade D - Poor (Significant wear, may have functional issues)</option>
              </select>
            </div>

            <div>
              <label htmlFor="estimatedValueUsd" className="block text-sm font-medium text-[#15261F] mb-1.5">
                Estimated Value (USD) <span className="text-[#3A828F]">*</span>
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
                className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="chosenRoute" className="block text-sm font-medium text-[#15261F] mb-1.5">
                Chosen Route <span className="text-[#3A828F]">*</span>
              </label>
              <select
                id="chosenRoute"
                name="chosenRoute"
                value={formData.chosenRoute}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full rounded-xl bg-white border border-[#d5dbd8] text-[#15261F] placeholder-[#A3B8A8] focus:border-[#3A828F] focus:ring-1 focus:ring-[#3A828F] disabled:opacity-50 disabled:bg-[#f5f5f5] px-4 py-3 text-sm"
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
            className="p-btn2-light min-h-[48px] md:w-40"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="p-btn min-h-[48px] md:w-44"
          >
            {isLoading ? "Submitting…" : "Submit Assessment"}
          </button>
        </div>
      </form>
    </div>
  );
}