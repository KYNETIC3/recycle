"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeviceDrawing } from "@/components/DeviceDrawing";
import { ASSESSMENT_STEPS, assessDevice } from "@/lib/assess";
import { SAMPLE_KEYS, SAMPLES, type SampleKey } from "@/lib/samples";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type Source = { kind: "sample"; sample: SampleKey } | { kind: "photo"; file: File; url: string };
type Phase = "idle" | "running" | "ready";

export function AssessmentFlow() {
  const [source, setSource] = useState<Source | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<SampleKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const run = useRef<AbortController | null>(null);

  const photoUrl = source?.kind === "photo" ? source.url : null;
  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    if (cameraOn && video.current) video.current.srcObject = stream.current;
  }, [cameraOn]);

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      run.current?.abort();
    },
    [],
  );

  const acceptPhoto = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file, such as a JPEG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Choose a photo under 10 MB.");
      return;
    }
    setError(null);
    setSource({ kind: "photo", file, url: URL.createObjectURL(file) });
  };

  const startCamera = async () => {
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCameraOn(true);
    } catch {
      setError("The camera is not available. Check its permission, or choose a photo instead.");
    }
  };

  const capture = () => {
    const frame = video.current;
    if (!frame) return;
    const canvas = document.createElement("canvas");
    canvas.width = frame.videoWidth;
    canvas.height = frame.videoHeight;
    canvas.getContext("2d")?.drawImage(frame, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) acceptPhoto(new File([blob], "device-capture.jpg", { type: "image/jpeg" }));
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const reset = () => {
    run.current?.abort();
    setSource(null);
    setPhase("idle");
    setStep(0);
    setResult(null);
    setError(null);
  };

  const startAssessment = async () => {
    if (!source) return;
    const controller = new AbortController();
    run.current = controller;
    setPhase("running");
    try {
      const input = source.kind === "sample" ? { sample: source.sample } : { photo: source.file };
      setResult(await assessDevice(input, setStep, controller.signal));
      setPhase("ready");
    } catch {
      // Aborted: the person left or started over.
    }
  };

  const done = phase === "ready" ? ASSESSMENT_STEPS.length : phase === "running" ? step : 0;
  const percent = Math.round((done / ASSESSMENT_STEPS.length) * 100);

  return (
    <div className="p-8 md:p-10 pb-24 md:pb-10">
      <header className="flex h-[52px] items-center justify-between border-b border-[#D5DBD8] md:hidden">
        <h1 className="text-lg font-semibold text-[#15261F]">New assessment</h1>
        <Link href="/" className="flex min-h-11 items-center text-sm font-medium text-[#81D8D0]">
          Cancel
        </Link>
      </header>

      <header className="mb-6 hidden flex-col gap-1.5 md:flex">
        <span className="p-label">Step 02 of 03</span>
        <p className="text-2xl md:text-3xl font-bold text-[#15261F]">New assessment</p>
      </header>

      <main className="grid items-stretch md:grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] md:gap-8">
        <div>
          {/* Photo Dropzone */}
          <div
            className={`p-grid relative flex h-[340px] md:min-h-[34rem] items-center justify-center overflow-hidden border border-[#1B434C] rounded-2xl ${
              dragging ? "border-[#81D8D0]" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (phase === "idle") setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && phase === "idle") acceptPhoto(file);
            }}
          >
            <span className="p-tick tl" />
            <span className="p-tick tr" />
            <span className="p-tick bl" />
            <span className="p-tick bh" />

            {cameraOn ? (
              <video ref={video} autoPlay playsInline muted aria-label="Camera preview" className="absolute inset-0 size-full object-cover rounded-2xl" />
            ) : source?.kind === "photo" ? (
              <Image src={source.url} alt="Your device photo" fill unoptimized className="object-contain p-6 rounded-2xl" />
            ) : source?.kind === "sample" ? (
              <>
                <div className="w-[260px] max-w-[80%] md:w-[340px]">
                  <DeviceDrawing device={source.sample} />
                </div>
                <span className="p-label absolute bottom-3 left-[34px] bg-white/90 backdrop-blur-sm px-2 rounded-lg text-[#15261F]">Sample: {SAMPLES[source.sample].name}</span>
              </>
            ) : (
              <div className="flex w-full max-w-[280px] flex-col gap-3 px-4 text-center">
                <p className="mb-1 bg-white/90 backdrop-blur-sm text-base font-semibold text-[#15261F] rounded-lg py-2 px-4">Add a device photo</p>
                <button type="button" className="p-btn">
                  Choose photo
                </button>
                <button type="button" className="p-btn2-light">
                  Use camera
                </button>
                <p className="text-sm text-[#4A5A4D]">Or drop an image here. Up to 10 MB.</p>
              </div>
            )}

            {phase === "running" && <div className="p-sweep" />}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) acceptPhoto(file);
              e.target.value = "";
            }}
          />

          {error && (
            <p role="alert" className="mt-4 px-4 text-sm font-medium text-[#B3261E] md:px-0">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {source ? (
            <section aria-label="Assessment progress" className="card-elevated">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Assessment log</h2>
                <span role="status" className="p-num text-sm font-medium text-white">{percent}%</span>
              </div>
              <div aria-hidden="true" className="h-[6px] bg-[#1B434C] rounded-full overflow-hidden mb-4">
                <div className="p-bar h-[6px] bg-[#81D8D0] rounded-full" style={{ width: `${percent}%` }} />
              </div>
              <ol className="space-y-2">
                {ASSESSMENT_STEPS.map((label, i) => {
                  const running = phase === "running" && i === step;
                  const finished = i < done;
                  return (
                    <li key={label} className="card-content-dark flex items-center gap-3">
                      <span className="p-num text-xs text-[#A3B8A8] shrink-0">0{i + 1}</span>
                      <span className={`flex-1 ${running ? "font-semibold text-white" : "text-white"}`}>{label}</span>
                      <span className={`p-num text-xs font-medium shrink-0 ${
                        finished ? "text-[#81D8D0]" : running ? "p-run text-[#81D8D0]" : "text-[#A3B8A8]"
                      }`}>
                        {finished ? "Done" : running ? "Running" : "Queued"}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {source.kind === "photo" && (
                <p className="mt-4 text-sm text-[#A3B8A8]">Photo analysis is not connected yet, so this run ends with a sample result.</p>
              )}
            </section>
          ) : (
            !cameraOn && (
              <section className="card-elevated">
                <h2 className="text-lg font-semibold text-white mb-4">Or try a sample device</h2>
                <div className="space-y-2">
                  {SAMPLE_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="card-content-dark w-full flex items-center justify-between gap-3 text-left"
                      onClick={() => {
                        setError(null);
                        setSource({ kind: "sample", sample: key });
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-base font-medium text-white block truncate">{SAMPLES[key].name}</span>
                        <span className="text-sm text-[#A3B8A8]">{SAMPLES[key].condition}</span>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A3B8A8" strokeWidth="1.8" aria-hidden="true">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#A3B8A8]">Check that the whole device is in view, including any damage.</p>
              </section>
            )
          )}

          {/* Bottom Action Bar - Mobile */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#1B434C] bg-[#EAE6DF] p-4">
            {cameraOn ? (
              <div className="flex gap-3">
                <button type="button" className="p-btn2-light min-h-[48px] flex-1" onClick={stopCamera}>
                  Cancel
                </button>
                <button type="button" className="p-btn min-h-[48px] flex-[2]" onClick={capture}>
                  Take photo
                </button>
              </div>
            ) : phase === "idle" ? (
              <div className="flex gap-3">
                <button type="button" className="p-btn2-light min-h-[48px] flex-1" onClick={reset}>
                  {source?.kind === "photo" ? "Replace photo" : "Change device"}
                </button>
                <button type="button" className="p-btn min-h-[48px] flex-[2]" onClick={startAssessment}>
                  Run assessment
                </button>
              </div>
            ) : phase === "running" ? (
              <button type="button" disabled className="p-btn2-light min-h-[48px] w-full">
                Assessing…
              </button>
            ) : (
              <Link href={`/result/${result}`} className="p-btn min-h-[48px] w-full">
                View result
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Action Bar - Desktop */}
        <div className="hidden md:static md:col-span-full flex justify-end gap-3 pt-4">
          {cameraOn ? (
            <>
              <button type="button" className="p-btn2-light min-h-[48px] md:w-36" onClick={stopCamera}>
                Cancel
              </button>
              <button type="button" className="p-btn min-h-[48px] md:w-40" onClick={capture}>
                Take photo
              </button>
            </>
          ) : phase === "idle" ? (
            <>
              <button type="button" className="p-btn2-light min-h-[48px] md:w-40" onClick={reset}>
                {source?.kind === "photo" ? "Replace photo" : "Change device"}
              </button>
              <button type="button" className="p-btn min-h-[48px] md:w-44" onClick={startAssessment}>
                Run assessment
              </button>
            </>
          ) : phase === "running" ? (
            <button type="button" disabled className="p-btn2-light min-h-[48px] md:w-40">
              Assessing…
            </button>
          ) : (
            <Link href={`/result/${result}`} className="p-btn min-h-[48px] md:w-44">
              View result
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}