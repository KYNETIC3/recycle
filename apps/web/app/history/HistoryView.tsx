"use client";

import Link from "next/link";
import { routeForScore } from "@/lib/assess";
import { historyTotals, useHistory } from "@/lib/history";
import { SAMPLES } from "@/lib/samples";

const CARD_GRID = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatMetricLabel(label: string) {
  return label.replace(/CO2e/gi, "CO\u2082e").replace(/CO2/gi, "CO\u2082");
}

export function HistoryView() {
  const saved = useHistory();

  return (
    <div className="p-8 md:p-10">
      {/* Page Header */}
      <header className="card-header text-white mb-8 p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">History</h1>

        <section aria-label="Your totals" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {historyTotals(saved).map((total) => (
            <div key={total.label} className="card-elevated text-white p-6">
              <p className="p-num text-3xl leading-[36px] font-medium md:text-4xl md:leading-[42px]">{total.value}</p>
              <p className="mt-2 text-base leading-6 text-[#A3B8A8] md:mt-2 md:text-[15px] md:leading-[21px]">{formatMetricLabel(total.label)}</p>
            </div>
          ))}
        </section>
        
        {saved.length > 0 && (
          <p className="mt-4 text-sm leading-6 text-[#A3B8A8]">
            Totals use sample data. Saved in this browser.
          </p>
        )}
      </header>

      <main className="space-y-6">
        <div className="md:border-t md:border-[#15261F] pt-8">
          {saved.length === 0 ? (
            <div className="card-elevated-light text-center py-12 md:py-16">
              <h2 className="text-xl md:text-2xl font-semibold text-[#15261F] mb-2">No saved assessments</h2>
              <p className="mb-6 text-base leading-7 text-[#4A5A4D]">Saved results and your totals appear here.</p>
              <Link href="/assess" className="p-btn min-h-[52px] self-stretch md:min-h-12 md:self-center md:px-7">
                New assessment
              </Link>
            </div>
          ) : (
            <div className={CARD_GRID} role="list" aria-label="Saved assessments">
              {saved.map((item) => {
                const sample = SAMPLES[item.sample];
                return (
                  <article key={item.sample} className="card-elevated-light" role="listitem">
                    <Link
                      href={`/result/${item.sample}`}
                      className="block"
                    >
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-[#15261F] mb-1">{sample.name}</h3>
                        <p className="text-sm text-[#4A5A4D]">{formatDate(item.savedAt)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#E9EDEB]">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#4A5A4D]">Score</span>
                          <span className="p-num text-xl font-bold text-[#15261F]">{sample.score}</span>
                        </div>
                        <span className="badge-teal-dark font-medium">{routeForScore(sample.score)}</span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}