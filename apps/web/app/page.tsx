"use client";

import { useState, useRef, useCallback, useEffect, Fragment } from "react";

/* ===== Types ===== */
type SampleKey = "iphone" | "battery" | "motherboard";
type AuthMode = "signin" | "register";

interface SampleData {
  key: SampleKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  mockPreview: {
    device: string;
    condition: string;
    score: number;
    parts: string[];
    recyclers: number;
  };
}

interface MockTriageResult {
  device: string;
  condition: string;
  repairabilityScore: number;
  components: { name: string; status: "good" | "degraded" | "critical"; salvageable: boolean }[];
  recyclersNearby: number;
}

/* ===== Sample Data ===== */
const SAMPLES: SampleData[] = [
  {
    key: "iphone",
    label: "Cracked iPhone Display",
    description: "iPhone 13 Pro with shattered OLED, functional logic board",
    icon: (
      <svg className="h-8 w-8 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2zm0-12v6m0 0l-3-3m3 3l3-3m-6 9a2 2 0 012 2h6a2 2 0 012-2" />
      </svg>
    ),
    mockPreview: {
      device: "iPhone 13 Pro (A2636)",
      condition: "Display shattered · Logic board functional · Battery 82% health",
      score: 68,
      parts: ["A15 Bionic Logic Board", "12MP Camera System", "MagSafe Coil", "Taptic Engine", "Speakers"],
      recyclers: 7
    }
  },
  {
    key: "battery",
    label: "Degraded Li-ion Battery",
    description: "MacBook Pro 16\" battery at 68% capacity, cycle count 847",
    icon: (
      <svg className="h-8 w-8 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    mockPreview: {
      device: "MacBook Pro 16\" (2021) Battery",
      condition: "68% max capacity · 847 cycles · Service recommended",
      score: 42,
      parts: ["Battery Cells (recyclable)", "BMS Board", "Temperature Sensors", "Connector Flex"],
      recyclers: 5
    }
  },
  {
    key: "motherboard",
    label: "Obsolete Motherboard",
    description: "Desktop ATX board, LGA1151 socket, functional capacitors",
    icon: (
      <svg className="h-8 w-8 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v16m12-16h-4m0 16h4m-4-8h8m-8 4h8m-8 4h8m-8-12h8" />
      </svg>
    ),
    mockPreview: {
      device: "ASUS PRIME Z370-A (LGA1151)",
      condition: "POST successful · 2x DDR4 slots bad · PCIe x16 functional",
      score: 55,
      parts: ["Intel Z370 Chipset", "PCIe 3.0 x16 Slot", "M.2 NVMe Slot", "Audio CODEC", "LAN Controller", "USB 3.1 Controller"],
      recyclers: 9
    }
  }
];

/* ===== Helper Functions ===== */
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDimensions = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(`${img.width} × ${img.height} px`);
    img.onerror = () => resolve("Unknown");
    img.src = URL.createObjectURL(file);
  });
};

const getConditionColor = (score: number): string => {
  if (score >= 70) return "text-status-good";
  if (score >= 40) return "text-status-degraded";
  return "text-status-critical";
};

const getConditionLabel = (score: number): string => {
  if (score >= 70) return "Excellent Candidate";
  if (score >= 40) return "Moderate";
  return "Challenging";
};

const getStatusBadge = (status: "good" | "degraded" | "critical") => {
  const config = {
    good: { bg: "bg-status-good/15", text: "text-status-good", border: "border-status-good/30", label: "Good" },
    degraded: { bg: "bg-status-degraded/15", text: "text-status-degraded", border: "border-status-degraded/30", label: "Degraded" },
    critical: { bg: "bg-status-critical/15", text: "text-status-critical", border: "border-status-critical/30", label: "Critical" }
  };
  return config[status];
};

/* ===== Hardware Type Icons (Enhanced with detailed device illustrations) ===== */
const HardwareIcons = {
  smartphone: (
    <svg className="h-12 w-12 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3" width="16" height="20" rx="3" ry="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="6" y="5" width="12" height="16" rx="1" ry="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="12" cy="20" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
      <line x1="12" y1="6" x2="12" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  laptop: (
    <svg className="h-12 w-12 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5v14a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 19h20M6 19v-2M18 19v-2" />
      <rect x="5" y="6" width="14" height="9" rx="1" ry="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  tablet: (
    <svg className="h-12 w-12 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="14" height="18" rx="2.5" ry="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="7" y="6" width="10" height="14" rx="1" ry="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="12" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
      <line x1="10" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  wearable: (
    <svg className="h-12 w-12 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v2M12 17v2M5 12H3M19 12h2" />
      <rect x="10" y="9" width="4" height="6" rx="1" ry="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    </svg>
  ),
  headphones: (
    <svg className="h-12 w-12 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9c0 5.523-5.477 10-10 10S7 14.523 7 9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9c0 5.523-5.477 10-10 10" />
      <circle cx="7" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="17" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="7" cy="9" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="17" cy="9" r="1.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    </svg>
  ),
  console: (
    <svg className="h-12 w-12 hardware-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="7" width="16" height="12" rx="1.5" ry="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="6" y="9" width="12" height="8" rx="1" ry="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <rect x="6" y="9" width="5" height="5" rx="1" ry="1" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.5" />
      <rect x="13" y="14" width="5" height="3" rx="0.5" ry="0.5" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.5" />
      <line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
} as const;

/* ===== Feature Data ===== */
const FEATURES = [
  { 
    icon: HardwareIcons.smartphone, 
    title: "Smartphones", 
    desc: "iPhone, Galaxy, Pixel — screen, battery, logic board, cameras"
  },
  { 
    icon: HardwareIcons.laptop, 
    title: "Laptops", 
    desc: "MacBook, ThinkPad, Dell — SSD, RAM, display, keyboard, ports"
  },
  { 
    icon: HardwareIcons.tablet, 
    title: "Tablets", 
    desc: "iPad, Surface, Galaxy Tab — digitizer, battery, speakers"
  },
  { 
    icon: HardwareIcons.wearable, 
    title: "Wearables", 
    desc: "Apple Watch, Galaxy Watch — sensors, battery, display, crown"
  },
  { 
    icon: HardwareIcons.headphones, 
    title: "Audio", 
    desc: "AirPods, Sony, Bose — drivers, battery, case, ANC modules"
  },
  { 
    icon: HardwareIcons.console, 
    title: "Consoles", 
    desc: "PS5, Xbox, Switch — APU, SSD, controller, optical drive"
  },
];

export default function Home() {
  /* ── Upload / Camera State ── */
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<string>("");
  const [selectedSample, setSelectedSample] = useState<SampleKey | null>(null);
  const [previewData, setPreviewData] = useState<MockTriageResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── Auth State ── */
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | "history">(null);

  /* ── Hero Animation State ── */
  const [heroVisible, setHeroVisible] = useState(false);

  // Hero entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  /* ── File Handling ── */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setSelectedSample(null);
    setPreviewData(null);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedSample(null);
      setPreviewData(null);
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (imageFile) formatDimensions(imageFile).then(setDimensions);
    else setDimensions("");
  }, [imageFile]);

  /* ── Camera ── */
  const handleCameraClick = useCallback(() => {
    setShowCamera(true);
    setCameraError(null);
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    }).catch(() => {
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.");
      setShowCamera(false);
    });
  }, []);

  const handleTakePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    video.classList.add("shutter-flash");
    setTimeout(() => video.classList.remove("shutter-flash"), 150);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "device-capture.jpg", { type: "image/jpeg" });
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      }
    }, "image/jpeg", 0.92);

    setSelectedSample(null);
    setPreviewData(null);
    stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    setShowCamera(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleRetake = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setDimensions("");
    setSelectedSample(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ── Analysis ── */
  const handleAnalyze = useCallback(async () => {
    if (!imagePreview || !imageFile) return;
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsAnalyzing(false);
    alert("Analysis complete! (Backend integration pending)");
  }, [imagePreview, imageFile]);

  /* ── Sample Selection ── */
  const handleSampleClick = useCallback((sample: SampleData) => {
    setSelectedSample(sample.key);
    setPreviewData({
      device: sample.mockPreview.device,
      condition: sample.mockPreview.condition,
      repairabilityScore: sample.mockPreview.score,
      components: sample.mockPreview.parts.map((name, i) => ({
        name,
        status: i < 2 ? "good" : i < 4 ? "degraded" : "critical",
        salvageable: i < 4
      })),
      recyclersNearby: sample.mockPreview.recyclers
    });
    setImagePreview(null);
    setImageFile(null);
    setDimensions("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  /* ── Auth Modal Helpers ── */
  const openAuth = useCallback((action: "history", mode: AuthMode = "signin") => {
    setPendingAction(action);
    setAuthMode(mode);
    setAuthError(null);
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirm("");
    setShowAuthModal(true);
  }, []);

  const closeAuth = useCallback(() => {
    setShowAuthModal(false);
    setPendingAction(null);
  }, []);

  const switchAuthMode = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(null);
  }, []);

  const handleAuthSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    if (authMode === "register" && authPassword !== authConfirm) {
      setAuthError("Passwords do not match");
      setIsAuthLoading(false);
      return;
    }

    await new Promise(r => setTimeout(r, 1200));

    setIsAuthLoading(false);
    closeAuth();
    alert(`${authMode === "register" ? "Account created" : "Signed in"} successfully! (Demo mode)`);
  }, [authMode, authPassword, authConfirm, closeAuth]);

  const handleSocialAuth = useCallback(async (provider: "google" | "github") => {
    setAuthError(null);
    setIsAuthLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsAuthLoading(false);
    closeAuth();
    alert(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}! (Demo mode)`);
  }, [closeAuth]);

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-bg-main text-text-on-bg antialiased">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2" aria-label="EcoTriage Home">
              <svg className="h-7 w-7 text-[#15261F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4m12 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="text-xl font-bold tracking-tight text-text-on-bg">EcoTriage</span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              <a href="#workbench" className="px-3 py-2 rounded-lg text-sm font-medium text-[#15261F] hover:text-[#0F2C33] hover:bg-bg-main-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Workbench</a>
              <a href="#samples" className="px-3 py-2 rounded-lg text-sm font-medium text-[#15261F] hover:text-[#0F2C33] hover:bg-bg-main-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Samples</a>
              <a href="#recyclers" className="px-3 py-2 rounded-lg text-sm font-medium text-[#15261F] hover:text-[#0F2C33] hover:bg-bg-main-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Recyclers</a>
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => openAuth("history")} className="btn btn-ghost btn-sm hidden sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Log In</button>
              <button onClick={() => openAuth("history", "register")} className="btn btn-primary btn-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Register</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col">
        {/* Welcome Hero Section */}
        <section className="relative py-12 sm:py-18 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Welcome Greeting Banner */}
            <div className={`card card-hover p-5 sm:p-7 mb-8 transition-smooth animate-slide-up hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover bg-[#0F2C33] border-[#1B434C] ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ animationDelay: '60ms' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-primary/15 border border-teal-primary/30">
                    <svg className="h-6 w-6 text-[#3A828F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20h12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">👋 Welcome to EcoTriage</p>
                    <p className="text-[#F4F1EA] text-sm mt-0.5">AI Device Lifecycle Intelligence</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:ml-auto">
                  <span className="badge badge-forest flex items-center gap-2">
                    <span className="status-dot active" aria-hidden="true" />
                    <span className="text-text-primary">AI Ready</span>
                  </span>
                  <span className="badge badge-teal flex items-center gap-2">
                    <span className="status-dot ready" aria-hidden="true" />
                    <span className="text-text-primary">Free Tier</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="text-center mb-10 animate-slide-up" style={{ animationDelay: '120ms' }}>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-text-on-bg leading-tight mb-5 transition-all duration-700 ease-out ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                Circular Hardware Intelligence
              </h1>
              <p className={`text-lg text-[#15261F] leading-relaxed mb-8 max-w-2xl mx-auto transition-all duration-700 ease-out ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ animationDelay: '180ms' }}>
                Upload any device photo for instant component diagnosis, repair paths, or certified e-waste recovery.
              </p>
            </div>

            {/* Supported Hardware Types Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10 stagger-fade-in animate-slide-up`} style={{ animationDelay: '240ms' }}>
              {FEATURES.map((feature, i) => (
                <div key={feature.title} className="card card-interactive p-6 text-center group transition-smooth h-auto flex flex-col hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover bg-[#0F2C33] border-[#1B434C]">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-teal-primary/15 group-hover:bg-teal-primary/25 transition-colors border border-border-card/50">
                    <span className="text-[#3A828F]">{feature.icon}</span>
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2 flex-1">{feature.title}</h3>
                  <p className="text-xs text-[#F4F1EA] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hardware Diagnostic Workbench */}
        <section id="workbench" className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Upload Workspace Card */}
            <div className="card p-6 sm:p-8 lg:p-10 animate-slide-up transition-smooth hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover" style={{ animationDelay: '300ms' }}>
              {imagePreview || previewData ? (
                /* ── Preview / Results State ── */
                <Fragment>
                  {previewData && !imagePreview ? (
                    /* Sample Preview Results */
                    <div className="space-y-5 animate-slide-up-sm">
                      {/* Device Header */}
                      <div className="flex items-start justify-between gap-3 p-4 card-alt rounded-lg border border-border-card">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-text-primary truncate">{previewData.device}</h3>
                          <p className="text-sm text-[#F4F1EA] mt-0.5">{previewData.condition}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getConditionColor(previewData.repairabilityScore)}`}>
                              {previewData.repairabilityScore}%
                            </div>
                            <div className="text-xs text-text-muted">{getConditionLabel(previewData.repairabilityScore)}</div>
                          </div>
                          <button onClick={handleRetake} className="btn btn-ghost btn-icon p-1.5" aria-label="Clear preview">
                            <svg className="h-4 w-4 icon-on-card" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Components Grid */}
                      <div>
                        <h4 className="text-xs font-medium text-[#F4F1EA] uppercase tracking-wider mb-2.5">Salvageable Components</h4>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {previewData.components.map((comp, i) => {
                            const badge = getStatusBadge(comp.status);
                            return (
                              <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${badge.bg} ${badge.border}`}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text-primary truncate">{comp.name}</p>
                                  <p className={`text-xs ${badge.text}`}>{badge.label} {comp.salvageable ? "· Salvageable" : "· Not salvageable"}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recyclers */}
                      <div className="flex items-center justify-between p-3.5 card-alt rounded-lg border border-border-card">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-teal-primary/15 border border-teal-primary/30">
                            <svg className="h-4 w-4 text-[#0F2C33]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{previewData.recyclersNearby} certified recyclers nearby</p>
                            <p className="text-xs text-text-muted">R2v3 & e-Stewards certified</p>
                          </div>
                        </div>
                        <button className="btn btn-outline btn-sm" disabled>Connect</button>
                      </div>

                      {/* Save History CTA */}
                      <button onClick={() => openAuth("history")} className="btn btn-outline w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Save to History — Sign In
                      </button>
                    </div>
                  ) : (
                    /* Image Preview */
                    <Fragment>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden card-alt relative mb-4">
                        <img src={imagePreview!} alt="Device photo preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 border border-border-card/50 pointer-events-none" aria-hidden="true" />
                      </div>

                      <div className="flex items-center justify-between gap-3 mb-4">
                        <button onClick={handleRetake} className="btn btn-secondary flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main" aria-label="Choose a different photo">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Change Photo
                        </button>
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn btn-primary flex-1 btn-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main" aria-busy={isAnalyzing}>
                          {isAnalyzing ? (
                            <>
                              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Analyzing…
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Analyze Device
                            </>
                          )}
                        </button>
                      </div>

                      {/* Metadata Panel */}
                      {imageFile && (
                        <div className="rounded-lg card-alt border border-border-card p-3.5 space-y-2.5 text-sm">
                          <h4 className="font-semibold text-text-primary flex items-center gap-2">
                            <svg className="h-4 w-4 icon-on-card" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            File Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div><span className="text-text-muted">Name</span><br /><span className="font-mono text-text-primary truncate block">{imageFile.name}</span></div>
                            <div><span className="text-text-muted">Type</span><br /><span className="font-mono text-text-primary">{imageFile.type}</span></div>
                            <div><span className="text-text-muted">Size</span><br /><span className="font-mono text-text-primary">{formatBytes(imageFile.size)}</span></div>
                            <div><span className="text-text-muted">Dimensions</span><br /><span className="font-mono text-text-primary">{dimensions || "Reading…"}</span></div>
                          </div>
                        </div>
                      )}
                    </Fragment>
                  )}
                </Fragment>
              ) : (
                /* ── Drop Zone State ── */
                <Fragment>
                  <div
                    className={`drop-zone rounded-xl p-6 sm:p-9 lg:p-11 text-center relative transition-smooth ${isDragActive ? "drag-active" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                    aria-label="Drop zone for device photo. Click or drag and drop to upload."
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-upload" aria-label="Choose device photo" />

                    {/* Centered Upload Illustration */}
                    <div className="relative z-10">
                      <svg className="mx-auto mb-5 h-14 w-14 icon-on-card empty-illustration" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      
                      <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-1.5">Drop your device photo here</h2>
                      <p className="text-text-secondary mb-7 max-w-sm mx-auto">JPEG, PNG, WebP, HEIC · up to 10MB</p>

                      {/* Dual Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-7">
                        <label htmlFor="file-upload" className="btn btn-secondary w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Browse Files
                        </label>
                        <button onClick={handleCameraClick} className="btn btn-outline w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main" aria-label="Take photo with camera">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Use Camera
                        </button>
                      </div>

                      {/* Privacy Note */}
                      <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                        <svg className="h-3.5 w-3.5 icon-on-card" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Images processed locally. Nothing leaves your device until you click <strong className="text-text-primary">Analyze Device</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Supported Format Badges */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
                    {["JPEG", "PNG", "WebP", "HEIC", "≤10 MB"].map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full card-alt border border-border-card text-text-secondary font-medium">{t}</span>
                    ))}
                  </div>
                </Fragment>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm text-text-on-bg-muted">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[#15261F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Free & instant
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[#15261F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Private by default
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-[#15261F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2H11a2.5 2.5 0 002.5-2.5V3.935M8 3.935V5.5A2.5 2.5 0 0110.5 3h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2H11A2.5 2.5 0 008 3.935z" /></svg>
                Certified partners
              </span>
            </div>
          </div>
        </section>

        {/* Interactive Demo Preview Section */}
        <section id="samples" className="py-12 sm:py-18 px-4 sm:px-6 lg:px-8 bg-[#EAE6DF] border-y border-[#1B434C]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 animate-slide-up">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#15261F] mb-2">Quick Demo</h2>
              <p className="text-[#15261F]">Click a sample below to see a live diagnostic preview — no upload needed.</p>
            </div>

            {/* Sample Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8 stagger-fade-in">
              {SAMPLES.map((sample) => (
                <button
                  key={sample.key}
                  onClick={() => handleSampleClick(sample)}
                  className={`card card-interactive p-5 relative transition-smooth h-auto hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main bg-[#0F2C33] border-[#1B434C] ${selectedSample === sample.key ? "sample-card-selected ring-2 ring-[#3A828F]" : ""}`}
                  aria-pressed={selectedSample === sample.key}
                >
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className={`p-3 rounded-xl ${selectedSample === sample.key ? "bg-teal-primary/20 border border-teal-primary/40" : "bg-teal-primary/10 border border-teal-primary/20"} transition-colors`}>
                      <span className="text-[#3A828F]">{sample.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{sample.label}</h3>
                      <p className="text-sm text-[#F4F1EA] leading-relaxed truncate">{sample.description}</p>
                    </div>
                  </div>
                  {selectedSample === sample.key && (
                    <div className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-teal-primary text-white animate-scale-in">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Live Preview Area */}
            <div className="rounded-xl border border-[#1B434C] bg-[#0F2C33] overflow-hidden animate-slide-up-sm">
              {previewData ? (
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Device Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 bg-[#13353E] rounded-lg border border-[#1B434C]">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-white truncate">{previewData.device}</h3>
                      <p className="text-sm text-[#F4F1EA] mt-0.5">{previewData.condition}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getConditionColor(previewData.repairabilityScore)}`}>
                          {previewData.repairabilityScore}%
                        </div>
                        <div className="text-xs text-[#F4F1EA]">{getConditionLabel(previewData.repairabilityScore)}</div>
                      </div>
                      <div className="w-px h-8 bg-border-card sm:w-px sm:h-auto" aria-hidden="true" />
                      <button onClick={() => { setSelectedSample(null); setPreviewData(null); }} className="btn btn-ghost btn-icon p-1.5" aria-label="Close preview">
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Components Grid */}
                  <div>
                    <h4 className="text-xs font-medium text-[#F4F1EA] uppercase tracking-wider mb-2.5">Component Assessment</h4>
                    <div className="grid sm:grid-cols-2 gap-2.5 stagger-fade-in">
                      {previewData.components.map((comp, i) => {
                        const badge = getStatusBadge(comp.status);
                        return (
                          <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${badge.bg} ${badge.border}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{comp.name}</p>
                              <p className={`text-xs ${badge.text}`}>{badge.label} {comp.salvageable ? "· Salvageable" : "· Not salvageable"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recyclers + Save */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 bg-[#13353E] rounded-lg border border-[#1B434C]">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-teal-primary/15 border border-teal-primary/30">
                        <svg className="h-4 w-4 text-[#3A828F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{previewData.recyclersNearby} certified recyclers nearby</p>
                        <p className="text-xs text-[#F4F1EA]">R2v3 & e-Stewards certified</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                      <button className="btn btn-outline" disabled>Connect Recyclers</button>
                      <button onClick={() => openAuth("history")} className="btn btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Save to History
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-6 text-center">
                  <svg className="mx-auto mb-3 h-10 w-10 text-[#3A828F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[#F4F1EA]">Select a sample above to see a live diagnostic preview</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-18 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 animate-slide-up">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#15261F] mb-3">How It Works</h2>
              <p className="text-[#15261F]">Three steps from photo to circular outcome.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 stagger-fade-in">
              {[
                { num: "01", title: "Upload Photo", desc: "Drag & drop, browse, or use your camera. We accept JPEG, PNG, WebP, and HEIC up to 10MB.", icon: (
                  <svg className="h-6 w-6 text-[#3A828F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                )},
                { num: "02", title: "AI Diagnosis", desc: "Our multimodal model identifies the device, detects damage, scores repairability, and inventories salvageable parts.", icon: (
                  <svg className="h-6 w-6 text-[#3A828F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.734-.988-2.386l-.548-.547z" /></svg>
                )},
                { num: "03", title: "Get Results", desc: "Receive a repair guide, upcycling ideas, and a map of R2/e-Stewards certified recyclers near you.", icon: (
                  <svg className="h-6 w-6 text-[#3A828F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182L13.536 4.182a.996.996 0 00-1.413.001L7.389 9.015c-1.171.879-1.171 2.303 0 3.182z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              ].map((step, i) => (
                <div key={i} className="card card-interactive p-6 relative overflow-hidden transition-smooth group h-auto hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover bg-[#0F2C33] border-[#1B434C]">
                  <div className="absolute top-4 right-4 text-white font-mono text-xl font-semibold step-badge">{step.num}</div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-primary/15 border border-teal-primary/30 mb-4 group-hover:bg-teal-primary/25 group-hover:border-teal-primary/50 transition-colors">{step.icon}</div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-[#F4F1EA] text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recyclers */}
        <section id="recyclers" className="py-12 sm:py-18 px-4 sm:px-6 lg:px-8 bg-[#EAE6DF] border-y border-[#1B434C]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 animate-slide-up">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#15261F] mb-3">Certified Recycling Partners</h2>
              <p className="text-[#15261F]">We connect you with R2v3 and e-Stewards certified facilities for responsible end-of-life processing.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-fade-in">
              {["ERI", "Sims Lifecycle Services", "Call2Recycle", "Dynamic Lifecycle Innovations", "Cohen Recycling", "CompuCycle", "TechDump", "e-Stewards Network", "R2 Certified Facilities"].map((p, i) => (
                <div key={i} className="card card-interactive p-4 flex items-center justify-between group transition-smooth h-auto hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover bg-[#0F2C33] border-[#1B434C]">
                  <span className="font-medium text-white group-hover:text-teal-primary transition-colors">{p}</span>
                  <svg className="h-4 w-4 text-[#3A828F] group-hover:text-teal-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-[#15261F]">Sign in to message partners directly and schedule drop-offs or pickups.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-18 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card p-6 sm:p-10 lg:p-14 relative overflow-hidden border-border-card animate-slide-up hover:-translate-y-1.5 hover:border-teal-primary/50 hover:shadow-card-hover transition-smooth bg-[#0F2C33] border-[#1B434C]">
              <div className="absolute top-0 right-0 w-56 h-56 bg-teal-primary/10 rounded-full blur-3xl" aria-hidden="true"></div>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-3">Ready to Diagnose Your Hardware?</h2>
                <p className="text-[#F4F1EA] mb-7">Upload a photo above or try a sample. Sign up to save history and connect with certified recyclers.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <a href="#workbench" className="btn btn-primary btn-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Analyze a Device</a>
                  <button onClick={() => openAuth("history", "register")} className="btn btn-outline btn-lg border-2 border-white text-white hover:bg-white/10 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Create Free Account</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1B434C] bg-[#EAE6DF] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6 text-[#15261F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4m12 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              <span className="text-lg font-semibold text-[#15261F]">EcoTriage</span>
            </div>
            <p className="text-sm text-[#15261F] text-center md:text-left">© 2026 EcoTriage. MIT Licensed. Built for hackathons.</p>
            <div className="flex items-center gap-5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[#15261F] hover:text-[#0F2C33] transition-colors" aria-label="GitHub"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg></a>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Camera Modal ── */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="camera-title" onClick={stopCamera}>
          <div className="relative w-full max-w-md animate-slide-up modal-card overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border-card-strong px-4 py-3 flex items-center justify-between">
              <h3 id="camera-title" className="font-semibold text-text-primary">Camera Capture</h3>
              <button onClick={stopCamera} className="btn btn-ghost btn-icon p-1" aria-label="Close camera"><svg className="h-5 w-5 icon-on-card" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            {cameraError && <div className="m-4 p-3 rounded-lg bg-teal-primary/15 border border-teal-primary/30 text-text-secondary text-sm">{cameraError}</div>}
            <div className="relative aspect-[4/3] bg-bg-main m-4 rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" aria-label="Camera preview" />
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-3/4 aspect-square border-2 border-teal-primary/40 rounded-lg" aria-hidden="true" /></div>
            </div>
            <div className="border-t border-border-card-strong px-4 py-3 flex justify-end gap-2.5">
              <button onClick={stopCamera} className="btn btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Cancel</button>
              <button onClick={handleTakePhoto} className="btn btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" fill="#0F2C33" /></svg> Capture</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          onClick={closeAuth}
        >
          <div
            className="relative w-full max-w-md animate-slide-up modal-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border-card-strong px-5 py-3.5 flex items-center justify-between">
              <h3 id="auth-title" className="text-base font-semibold text-text-primary">
                {authMode === "signin" ? "Sign In to EcoTriage" : "Create Your Account"}
              </h3>
              <button onClick={closeAuth} className="btn btn-ghost btn-icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main" aria-label="Close modal and continue as guest">
                <svg className="h-5 w-5 icon-on-card" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="border-b border-border-card-strong px-5 py-2 flex">
                <button onClick={() => switchAuthMode("signin")} className={`flex-1 py-2 px-3 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main ${authMode === "signin" ? "bg-teal-primary/15 text-text-primary border-b-2 border-teal-primary" : "text-text-secondary hover:text-text-primary"}`}>Sign In</button>
                <button onClick={() => switchAuthMode("register")} className={`flex-1 py-2 px-3 text-sm font-medium rounded-t-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main ${authMode === "register" ? "bg-teal-primary/15 text-text-primary border-b-2 border-teal-primary" : "text-text-secondary hover:text-text-primary"}`}>Register</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Social Login Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("google")}
                    disabled={isAuthLoading}
                    className="btn btn-secondary w-full justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
                    aria-label="Continue with Google"
                  >
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-text-primary">Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialAuth("github")}
                    disabled={isAuthLoading}
                    className="btn btn-secondary w-full justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
                    aria-label="Continue with GitHub"
                  >
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-text-primary">Continue with GitHub</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-card" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider text-text-muted">
                    <span className="px-3 bg-bg-card-elevated">or continue with email</span>
                  </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authError && (
                    <div className="p-2.5 rounded-lg bg-teal-primary/15 border border-teal-primary/30 text-text-secondary text-sm" role="alert">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="block text-sm font-medium text-text-primary mb-0.5">Email</label>
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="input"
                      placeholder="you@example.com"
                      disabled={isAuthLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="block text-sm font-medium text-text-primary mb-0.5">Password</label>
                    <input
                      id="auth-password"
                      type="password"
                      autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="input"
                      placeholder="••••••••"
                      disabled={isAuthLoading}
                    />
                  </div>

                  {authMode === "register" && (
                    <div>
                      <label htmlFor="auth-confirm" className="block text-sm font-medium text-text-primary mb-0.5">Confirm Password</label>
                      <input
                        id="auth-confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={authConfirm}
                        onChange={(e) => setAuthConfirm(e.target.value)}
                        className="input"
                        placeholder="••••••••"
                        disabled={isAuthLoading}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="btn btn-primary w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
                  >
                    {isAuthLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {authMode === "signin" ? "Signing in…" : "Creating account…"}
                      </>
                    ) : (
                      authMode === "signin" ? "Sign In" : "Create Account"
                    )}
                  </button>
                </form>

                {/* Guest Dismissal */}
                <div className="pt-1.5 text-center">
                  <button
                    onClick={closeAuth}
                    className="btn btn-ghost text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
                    aria-label="Continue as guest without signing in"
                  >
                    <svg className="h-4 w-4 icon-on-card" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Continue as Guest
                  </button>
                  <p className="mt-1.5 text-xs text-text-muted">
                    You can always sign in later to save your triage history.
                  </p>
                </div>

                {/* Switch Mode Link */}
                <div className="text-center text-sm text-text-secondary">
                  {authMode === "signin" ? (
                    <>No account? <button onClick={() => switchAuthMode("register")} className="text-teal-primary hover:underline font-medium ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Sign up</button></>
                  ) : (
                    <>Have an account? <button onClick={() => switchAuthMode("signin")} className="text-teal-primary hover:underline font-medium ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A828F] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main">Sign in</button></>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}