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
    <div className="pb-24 md:px-10 md:pt-8 md:pb-10">
      <header className="flex h-[52px] items-center justify-between border-b border-rule px-4 md:hidden">
        <h1 className="text-[17px] font-semibold">New assessment</h1>
        <Link href="/" className="flex min-h-11 items-center text-[15px] font-medium text-signal">
          Cancel
        </Link>
      </header>

      <header className="mb-6 hidden flex-col gap-1.5 md:flex">
        <span className="p-label">Step 02 of 03</span>
        <p className="text-4xl leading-[42px] font-semibold tracking-[-0.7px]">New assessment</p>
      </header>

      <main className="grid items-stretch md:grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] md:gap-8">
        <div>
          <div
            className={`p-grid relative flex h-[340px] items-center justify-center overflow-hidden border-b md:min-h-[34rem] md:border ${dragging ? "border-signal" : "border-rule"}`}
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
              <video ref={video} autoPlay playsInline muted aria-label="Camera preview" className="absolute inset-0 size-full object-cover" />
            ) : source?.kind === "photo" ? (
              <Image src={source.url} alt="Your device photo" fill unoptimized className="object-contain p-6" />
            ) : source?.kind === "sample" ? (
              <>
                <div className="w-[260px] max-w-[80%] md:w-[340px]">
                  <DeviceDrawing device={source.sample} />
                </div>
                <span className="p-label absolute bottom-3 left-[34px] bg-white px-1">Sample: {SAMPLES[source.sample].name}</span>
              </>
            ) : (
              <div className="flex w-full max-w-[280px] flex-col gap-2 px-4 text-center">
                <p className="mb-2 bg-white text-[17px] leading-6 font-semibold">Add a device photo</p>
                <button type="button" className="p-btn" onClick={() => fileInput.current?.click()}>
                  Choose photo
                </button>
                <button type="button" className="p-btn2 bg-white" onClick={startCamera}>
                  Use camera
                </button>
                <p className="mt-2 bg-white text-sm leading-5 text-muted">Or drop an image here. Up to 10 MB.</p>
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
            <p role="alert" className="px-4 pt-3 text-[15px] leading-[22px] font-medium text-alert md:px-0">
              {error}
            </p>
          )}
        </div>

        {source ? (
          <section aria-label="Assessment progress" className="flex flex-col gap-4 p-4 md:p-0">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="p-label">Assessment log</h2>
                <span role="status" className="p-num text-[13px] font-medium md:text-sm">
                  {percent}%
                </span>
              </div>
              <div aria-hidden="true" className="h-[3px] bg-rule">
                <div className="p-bar h-[3px] bg-signal" style={{ width: `${percent}%` }} />
              </div>
              <ol>
                {ASSESSMENT_STEPS.map((label, i) => {
                  const running = phase === "running" && i === step;
                  const finished = i < done;
                  return (
                    <li key={label} className="flex min-h-11 items-center gap-3 border-b border-rule-soft text-[15px] md:min-h-[52px] md:gap-3.5 md:text-base">
                      <span className="p-num text-xs text-muted">0{i + 1}</span>
                      <span className={`min-w-0 flex-1 ${running ? "font-semibold" : ""}`}>{label}</span>
                      <span className={`p-num text-xs font-medium md:text-[13px] ${finished ? "text-forest" : running ? "p-run text-signal" : "text-muted"}`}>
                        {finished ? "Done" : running ? "Running" : "Queued"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            {source.kind === "photo" && (
              <p className="text-[15px] leading-[22px] text-muted">Photo analysis is not connected yet, so this run ends with a sample result.</p>
            )}
          </section>
        ) : (
          !cameraOn && (
            <section className="p-4 md:p-0">
              <h2 className="p-label mb-2">Or try a sample device</h2>
              <div className="border-t border-rule">
                {SAMPLE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="p-row flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-3 border-b border-rule py-2 text-left"
                    onClick={() => {
                      setError(null);
                      setSource({ kind: "sample", sample: key });
                    }}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-base leading-[22px] font-medium">{SAMPLES[key].name}</span>
                      <span className="text-sm leading-[19px] text-muted">{SAMPLES[key].condition}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F5B53" strokeWidth="1.8" aria-hidden="true">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-[22px] text-muted">Check that the whole device is in view, including any damage.</p>
            </section>
          )
        )}

        {(source || cameraOn) && (
          <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t border-rule bg-ground px-4 pt-3 pb-5 md:static md:col-span-full md:justify-end md:border-t-0 md:bg-transparent md:p-0">
            {cameraOn ? (
              <>
                <button type="button" className="p-btn2 min-h-[52px] flex-1 md:flex-none" onClick={stopCamera}>
                  Cancel
                </button>
                <button type="button" className="p-btn min-h-[52px] flex-[2] md:flex-none" onClick={capture}>
                  Take photo
                </button>
              </>
            ) : phase === "idle" ? (
              <>
                <button type="button" className="p-btn2 min-h-[52px] flex-1 md:flex-none" onClick={reset}>
                  {source?.kind === "photo" ? "Replace photo" : "Change device"}
                </button>
                <button type="button" className="p-btn min-h-[52px] flex-[2] md:flex-none" onClick={startAssessment}>
                  Run assessment
                </button>
              </>
            ) : phase === "running" ? (
              <button type="button" disabled className="p-btn2 min-h-[52px] flex-1 md:flex-none">
                Assessing…
              </button>
            ) : (
              <Link href={`/result/${result}`} className="p-btn min-h-[52px] flex-1 md:flex-none">
                View result
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
