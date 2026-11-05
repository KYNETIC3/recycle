"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DeviceDrawing } from "@/components/DeviceDrawing";
import { Lifecycle } from "@/components/Lifecycle";
import { Materials } from "@/components/Materials";
import { RouteScale } from "@/components/RouteScale";
import { SaveDialog } from "@/components/SaveDialog";
import { routeForScore } from "@/lib/assess";
import { useHistory } from "@/lib/history";
import { SAMPLES, type Sample, type SampleKey } from "@/lib/samples";

const TABS = ["Findings", "Materials", "Impact"] as const;
type Tab = (typeof TABS)[number];

const TWO_UP = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6";

function SampleNotice() {
  return <p className="text-sm leading-5 text-muted">Sample result. Live photo analysis is not connected yet.</p>;
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="p-label">{children}</h2>
      <span className="p-label">Sample data</span>
    </div>
  );
}

function RecyclersLink() {
  return (
    <Link href="/recyclers" className="p-row flex min-h-12 items-center justify-between text-[15px] font-medium text-signal">
      See certified recyclers
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="1.8" aria-hidden="true">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function PartsHeading({ sample }: { sample: Sample }) {
  return <h2 className="p-label mb-2">{sample.parts.length} parts worth saving</h2>;
}

export function ResultView({ sampleKey }: { sampleKey: SampleKey }) {
  const sample = SAMPLES[sampleKey];
  const route = routeForScore(sample.score);
  const saved = useHistory().some((item) => item.sample === sampleKey);
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("Findings");

  const openSave = () => dialog.current?.showModal();

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
      <div className="pb-24 md:hidden">
        <header className="flex h-[52px] items-center justify-between border-b border-rule pr-4 pl-2">
          <Link href="/" aria-label="Back to overview" className="flex size-11 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14241A" strokeWidth="1.8" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="p-label">Assessment</span>
          {route !== "Recycle" ? (
            <span className="w-11" />
          ) : saved ? (
            <Link href="/history" className="flex min-h-11 items-center text-[15px] font-medium text-signal">
              Saved
            </Link>
          ) : (
            <button type="button" className="min-h-11 cursor-pointer text-[15px] font-medium text-signal" onClick={openSave}>
              Save
            </button>
          )}
        </header>

        <main>
          <section className="p-in flex flex-col gap-1 bg-forest px-4 py-5 text-white">
            <span className="p-label text-mint">Recommended route</span>
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-[44px] leading-[52px] font-semibold tracking-[-1px]">{route}</h1>
              <span className="p-num text-xl font-medium">{sample.score}/100</span>
            </div>
            <p className="p-num text-[13px] leading-[18px] text-mint">{sample.device}</p>
            <p className="mt-2 text-base leading-[23px]">{sample.reason}</p>
          </section>

          <section className="p-in d1 flex flex-col gap-[18px] border-b border-rule p-4">
            <SampleNotice />
            <RouteScale score={sample.score} />
            <Lifecycle route={route} />
          </section>

          <div role="group" aria-label="Result details" className="grid grid-cols-3 border-b border-rule">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={name === tab}
                className={`-mb-px h-12 cursor-pointer border-b-2 text-[15px] ${name === tab ? "border-forest font-semibold text-forest" : "border-transparent font-medium text-muted"}`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {tab === "Findings" && (
            <section className="p-in flex flex-col gap-4 p-4">
              <div className="p-grid border border-rule p-3">
                <DeviceDrawing device={sampleKey} />
              </div>
              <div className="border-t border-rule">
                {sample.findings.map((f, i) => (
                  <div key={f.name} className="flex min-h-11 items-center gap-3 border-b border-rule-soft text-[15px]">
                    <span className="p-num text-xs text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-muted">{f.name}</span>
                    <span className="text-right font-semibold">{f.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <PartsHeading sample={sample} />
                <ul className="border-t border-rule">
                  {sample.parts.map((part) => (
                    <li key={part} className="flex min-h-10 items-center border-b border-rule-soft text-[15px]">
                      {part}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {tab === "Materials" && (
            <section className="p-in flex flex-col gap-3 p-4">
              <PanelHeading>Share of {sample.mass}</PanelHeading>
              <Materials materials={sample.materials} />
            </section>
          )}

          {tab === "Impact" && (
            <section className="p-in flex flex-col gap-3 p-4">
              <PanelHeading>If you follow this route</PanelHeading>
              <div className="border-t border-rule">
                {sample.impact.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between gap-3 border-b border-rule-soft py-3">
                    <span className="text-[15px] text-muted">{m.label}</span>
                    <span className="p-num text-2xl leading-[30px] font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
              <RecyclersLink />
            </section>
          )}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-ground px-4 pt-3 pb-5">{primary}</div>
      </div>

      {/* Tablet and desktop: everything on one sheet */}
      <main className="hidden flex-col gap-6 px-10 pt-6 pb-10 md:flex">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="p-num text-[13px] text-muted">
            <Link href="/" className="text-signal">
              Overview
            </Link>{" "}
            / {sample.device}
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

        <SampleNotice />

        <div className={`p-in items-stretch ${TWO_UP}`}>
          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-1 bg-forest p-6 text-white">
              <span className="p-label text-mint">Recommended route</span>
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="text-[64px] leading-[72px] font-semibold tracking-[-1.6px]">{route}</h1>
                <span className="p-num text-[28px] font-medium">{sample.score}/100</span>
              </div>
              <p className="mt-1.5 text-[17px] leading-[25px]">{sample.reason}</p>
            </div>
            <RouteScale score={sample.score} />
            <Lifecycle route={route} />
          </section>

          <section className="flex flex-wrap border border-rule bg-white">
            <div className="p-grid flex min-w-0 flex-[1_1_200px] items-center p-3">
              <DeviceDrawing device={sampleKey} />
            </div>
            <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-2 border-l border-rule p-4">
              <h2 className="p-label">Findings</h2>
              <div className="border-t border-rule">
                {sample.findings.map((f, i) => (
                  <div key={f.name} className="flex gap-2.5 border-b border-rule-soft py-2.5">
                    <span className="p-num text-xs leading-5 text-muted">{i + 1}</span>
                    <span className="flex flex-col">
                      <span className="text-sm leading-5 text-muted">{f.name}</span>
                      <span className="text-base leading-[22px] font-semibold">{f.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className={`p-in d1 ${TWO_UP}`}>
          <section className="flex flex-col gap-2.5">
            <PanelHeading>Materials, share of {sample.mass}</PanelHeading>
            <Materials materials={sample.materials} />
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <PanelHeading>Impact of this route</PanelHeading>
              <div className="grid grid-cols-3 gap-0.5 border border-rule bg-rule">
                {sample.impact.map((m) => (
                  <div key={m.label} className="flex flex-col gap-1 bg-white px-3 py-3.5">
                    <span className="p-num text-2xl leading-[30px] font-medium">{m.value}</span>
                    <span className="text-[13px] leading-[18px] text-muted">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <PartsHeading sample={sample} />
              <ul className="grid grid-cols-2 gap-x-4 border-t border-rule text-[15px] leading-5">
                {sample.parts.map((part) => (
                  <li key={part} className="flex min-h-9 items-center border-b border-rule-soft">
                    {part}
                  </li>
                ))}
              </ul>
            </div>
            <RecyclersLink />
          </section>
        </div>
      </main>

      <SaveDialog ref={dialog} sampleKey={sampleKey} />
    </>
  );
}
