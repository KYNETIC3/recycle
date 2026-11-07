"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DeviceDrawing } from "@/components/DeviceDrawing";
import { Lifecycle } from "@/components/Lifecycle";
import { Materials } from "@/components/Materials";
import { RouteScale } from "@/components/RouteScale";
import { SaveDialog } from "@/components/SaveDialog";
import { routeForScore, getDiagnosis, type DiagnoseResponse } from "@/lib/assess";
import { useHistory } from "@/lib/history";
import { SAMPLES, type Sample, type SampleKey } from "@/lib/samples";

const TABS = ["Findings", "Materials", "Impact"] as const;
type Tab = (typeof TABS)[number];

const TWO_UP = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6";

function PanelHeading({ children, isSample }: { children: React.ReactNode; isSample?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="p-label">{children}</h2>
      {isSample && <span className="p-label text-on-dark-muted">Sample data</span>}
    </div>
  );
}

function RecyclersLink() {
  return (
    <Link href="/recyclers" className="p-row flex min-h-12 items-center justify-between text-[15px] font-medium text-[#81D8D0]">
      See certified recyclers
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function PartsHeading({ count }: { count: number }) {
  return <h2 className="p-label mb-2 text-on-light">{count} parts worth saving</h2>;
}

function SampleNotice({ isSample }: { isSample: boolean }) {
  if (!isSample) return null;
  return <p className="text-sm leading-5 text-muted">Sample result. Live photo analysis is not connected yet.</p>;
}

export function ResultView({ sampleKey }: { sampleKey: string }) {
  const [diagnosis, setDiagnosis] = useState<DiagnoseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saved = useHistory().some((item) => item.sample === sampleKey);
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("Findings");

  const openSave = () => dialog.current?.showModal();

  useEffect(() => {
    async function loadDiagnosis() {
      setLoading(true);
      setError(null);
      try {
        const result = await getDiagnosis(sampleKey);
        if (!result) {
          setError("Assessment not found");
        } else {
          setDiagnosis(result);
        }
      } catch (e) {
        setError("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    }
    loadDiagnosis();
  }, [sampleKey]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="p-spin" aria-label="Loading assessment" />
      </div>
    );
  }

  if (error || !diagnosis) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-center px-4">
        <div>
          <p className="text-primary text-lg font-medium">Unable to load assessment</p>
          <p className="mt-2 text-muted">{error || "Unknown error"}</p>
          <Link href="/assess" className="mt-4 inline-block p-btn">
            Start new assessment
          </Link>
        </div>
      </div>
    );
  }

  const sample = SAMPLES[diagnosis.key as SampleKey];
  const route = diagnosis.route;
  const isSampleData = diagnosis.sample_data;
  const displaySample = sample || diagnosis;

  // Recycle has a next step to take; Repair and Reuse have only Save for now.
  const primary =
    route === "Recycle" ? (
      <Link href="/recyclers" className="p-btn min-h-[52px] md:min-h-12">
        Find a recycler
      </Link>
    ) : saved ? (
      <Link href="/history" className="p-btn2 min-h-[52px] md:min-h-12">
        Saved. View history
      </Link>
    ) : (
      <button type="button" className="p-btn min-h-[52px] w-full md:min-h-12 md:w-auto" onClick={openSave}>
        Save assessment
      </button>
    );

  return (
    <>
      {/* Phone: one column, details behind tabs */}
      <div className="px-4 pb-24 md:hidden">
        <header className="flex h-[52px] items-center justify-between border-b border-[var(--color-border-rule)] pr-4 pl-2">
          <Link href="/" aria-label="Back to overview" className="flex size-11 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-light)" strokeWidth="1.8" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="p-label text-[var(--color-text-on-light)]">Assessment</span>
          {route !== "Recycle" ? (
            <span className="w-11" />
          ) : saved ? (
            <Link href="/history" className="flex min-h-11 items-center text-[15px] font-medium text-[#81D8D0]">
              Saved
            </Link>
          ) : (
            <button type="button" className="min-h-11 cursor-pointer text-[15px] font-medium text-[#81D8D0]" onClick={openSave}>
              Save
            </button>
          )}
        </header>

        <main>
          <section className="p-in flex flex-col gap-1 card-elevated px-4 py-5 text-white md:px-6 md:py-8">
            <span className="p-label text-[#A3B8A8]">Recommended route</span>
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-[44px] leading-[52px] font-semibold tracking-[-1px]">{route}</h1>
              <span className="p-num text-xl font-medium">{diagnosis.score}/100</span>
            </div>
            <p className="p-num text-[13px] leading-[18px] text-[#A3B8A8]">{displaySample.device}</p>
            <p className="mt-2 text-base leading-[23px] text-[#F4F1EA]">{diagnosis.reason}</p>
          </section>

          <section className="p-in d1 flex flex-col gap-[18px] border-b border-[var(--color-border-rule)] p-4">
            <SampleNotice isSample={isSampleData} />
            <RouteScale score={diagnosis.score} />
            <Lifecycle route={route} />
          </section>

          <div role="group" aria-label="Result details" className="grid grid-cols-3 border-b border-[var(--color-border-rule)]">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={name === tab}
                className={`-mb-px h-12 cursor-pointer border-b-2 text-[15px] ${name === tab ? "border-[#81D8D0] font-semibold text-[#81D8D0]" : "border-transparent font-medium text-[var(--color-text-on-light-muted)]"}`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {tab === "Findings" && (
            <section className="p-in flex flex-col gap-4 p-4">
              <div className="p-grid border border-[var(--color-border-rule)] p-3 card-elevated-light rounded-xl">
                <DeviceDrawing device={diagnosis.key as SampleKey} />
              </div>
              <div className="border-t border-[var(--color-border-rule)]">
                {diagnosis.findings.map((f, i) => (
                  <div key={f.name} className="flex min-h-11 items-center gap-3 border-b border-[var(--color-border-rule-soft)] text-[15px]">
                    <span className="p-num text-xs text-[var(--color-text-on-light-muted)]">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-[var(--color-text-on-light-muted)]">{f.name}</span>
                    <span className="text-right font-semibold text-[var(--color-text-on-light)]">{f.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <PartsHeading count={diagnosis.parts.length} />
                <ul className="border-t border-[var(--color-border-rule)]">
                  {diagnosis.parts.map((part) => (
                    <li key={part} className="flex min-h-10 items-center border-b border-[var(--color-border-rule-soft)] text-[15px] text-[var(--color-text-on-light)]">
                      {part}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {tab === "Materials" && (
            <section className="p-in flex flex-col gap-3 p-4">
              <PanelHeading isSample={isSampleData}>Share of {diagnosis.mass}</PanelHeading>
              <Materials materials={diagnosis.materials} />
            </section>
          )}

          {tab === "Impact" && (
            <section className="p-in flex flex-col gap-3 p-4">
              <PanelHeading isSample={isSampleData}>If you follow this route</PanelHeading>
              <div className="border-t border-[var(--color-border-rule)]">
                {diagnosis.impact.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-rule-soft)] py-3">
                    <span className="text-[15px] text-[var(--color-text-on-light-muted)]">{m.label}</span>
                    <span className="p-num text-2xl leading-[30px] font-medium text-[var(--color-text-on-light)]">{m.value}</span>
                  </div>
                ))}
              </div>
              <RecyclersLink />
            </section>
          )}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--color-border-rule)] bg-[var(--color-bg-main)] px-4 pt-3 pb-5">{primary}</div>
      </div>

      {/* Tablet and desktop: everything on one sheet */}
      <main className="hidden flex-col gap-6 px-10 pt-6 pb-10 md:flex">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="p-num text-[13px] text-[var(--color-text-on-light-muted)]">
            <Link href="/" className="text-[#81D8D0]">
              Overview
            </Link>{" "}
            / {displaySample.device}
          </p>
          <div className="flex gap-2">
            {route === "Recycle" &&
            (saved ? (
              <Link href="/history" className="p-btn2">
                Saved. View history
              </Link>
            ) : (
              <button type="button" className="p-btn2" onClick={openSave}>
                Save
              </button>
            ))}
            {primary}
          </div>
        </div>

        <SampleNotice isSample={isSampleData} />

        <div className={`p-in items-stretch ${TWO_UP}`}>
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 card-elevated p-6 text-white md:p-8">
              <span className="p-label text-[#A3B8A8]">Recommended route</span>
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="text-[64px] leading-[72px] font-semibold tracking-[-1.6px]">{route}</h1>
                <span className="p-num text-[28px] font-medium">{diagnosis.score}/100</span>
              </div>
              <p className="mt-1.5 text-[17px] leading-[25px] text-[#F4F1EA]">{diagnosis.reason}</p>
            </div>
            <RouteScale score={diagnosis.score} />
            <Lifecycle route={route} />
          </section>

          <section className="card-elevated-light rounded-2xl overflow-hidden">
            <div className="p-grid flex min-w-0 flex-[1_1_200px] items-center p-3">
              <DeviceDrawing device={diagnosis.key as SampleKey} />
            </div>
            <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-2 border-l border-[var(--color-border-rule)] p-4 md:p-6">
              <h2 className="p-label text-[var(--color-text-on-light)]">Findings</h2>
              <div className="border-t border-[var(--color-border-rule)]">
                {diagnosis.findings.map((f, i) => (
                  <div key={f.name} className="flex gap-2.5 border-b border-[var(--color-border-rule-soft)] py-2.5">
                    <span className="p-num text-xs leading-5 text-[var(--color-text-on-light-muted)]">{i + 1}</span>
                    <span className="flex flex-col">
                      <span className="text-sm leading-5 text-[var(--color-text-on-light-muted)]">{f.name}</span>
                      <span className="text-base leading-[22px] font-semibold text-[var(--color-text-on-light)]">{f.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className={`p-in d1 ${TWO_UP}`}>
          <section className="flex flex-col gap-2.5">
            <PanelHeading isSample={isSampleData}>Materials, share of {diagnosis.mass}</PanelHeading>
            <Materials materials={diagnosis.materials} />
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <PanelHeading isSample={isSampleData}>Impact of this route</PanelHeading>
              <div className="card-elevated-light rounded-2xl overflow-hidden">
                {diagnosis.impact.map((m, idx) => (
                  <div key={m.label} className={`flex flex-col gap-1 p-3.5 px-4 md:p-4 ${idx < diagnosis.impact.length - 1 ? 'border-b border-[var(--color-border-rule-soft)]' : ''}`}>
                    <span className="p-num text-2xl leading-[30px] font-medium text-[var(--color-text-on-light)]">{m.value}</span>
                    <span className="text-[13px] leading-[18px] text-[var(--color-text-on-light-muted)]">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <PartsHeading count={diagnosis.parts.length} />
              <ul className="card-elevated-light rounded-2xl overflow-hidden">
                {diagnosis.parts.map((part, idx) => (
                  <li key={part} className={`flex min-h-9 items-center px-4 py-2 ${idx < diagnosis.parts.length - 1 ? 'border-b border-[var(--color-border-rule-soft)]' : ''} text-[15px] leading-5 text-[var(--color-text-on-light)]`}>
                    {part}
                  </li>
                ))}
              </ul>
            </div>
            <RecyclersLink />
          </section>
        </div>
      </main>

      <SaveDialog ref={dialog} sampleKey={diagnosis.key as SampleKey} />
    </>
  );
}