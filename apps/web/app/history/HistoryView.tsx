"use client";

import Link from "next/link";
import { routeForScore } from "@/lib/assess";
import { historyTotals, useHistory } from "@/lib/history";
import { SAMPLES } from "@/lib/samples";

const TABLE_COLUMNS = "md:grid md:grid-cols-[minmax(0,2fr)_120px_80px_110px] md:items-center md:gap-4";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function HistoryView() {
  const saved = useHistory();

  return (
    <div className="pb-16 md:px-10 md:pt-8 md:pb-10">
      <header className="p-in flex flex-col gap-3.5 bg-forest px-4 py-5 text-white md:gap-6 md:bg-transparent md:p-0 md:text-ink">
        <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.5px] md:text-4xl md:leading-[42px] md:tracking-[-0.7px]">History</h1>
        <section aria-label="Your totals" className="grid grid-cols-3 gap-3 md:grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] md:gap-0.5 md:bg-leaf">
          {historyTotals(saved).map((total) => (
            <div key={total.label} className="md:bg-forest md:p-5 md:text-white">
              <p className="p-num text-2xl leading-[30px] font-medium md:text-4xl md:leading-[42px]">{total.value}</p>
              <p className="mt-0.5 text-[13px] leading-[17px] text-mint md:mt-1 md:text-[15px] md:leading-[21px]">{total.label}</p>
            </div>
          ))}
        </section>
        {saved.length > 0 && <p className="text-[13px] leading-[18px] text-mint md:text-muted">Totals use sample data. Saved in this browser.</p>}
      </header>

      <main className="p-in d1 md:mt-6">
        <div className="md:border-t md:border-ink">
          <div className={`p-label hidden min-h-9 border-b border-rule ${TABLE_COLUMNS}`}>
            <span>Device</span>
            <span>Date</span>
            <span>Score</span>
            <span>Route</span>
          </div>

          {saved.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center md:border-b md:border-rule md:py-[72px]">
              <h2 className="text-xl leading-[26px] font-semibold">No saved assessments</h2>
              <p className="mb-3 text-[15px] leading-[22px] text-muted">Saved results and your totals appear here.</p>
              <Link href="/assess" className="p-btn min-h-[52px] self-stretch md:min-h-12 md:self-center md:px-7">
                New assessment
              </Link>
            </div>
          ) : (
            <ul className="px-4 md:px-0">
              {saved.map((item) => {
                const sample = SAMPLES[item.sample];
                return (
                  <li key={item.sample}>
                    <Link
                      href={`/result/${item.sample}`}
                      className={`p-row flex min-h-[60px] items-center gap-3 border-b border-rule py-2 text-[15px] md:min-h-12 md:py-0 ${TABLE_COLUMNS}`}
                    >
                      <span className="flex min-w-0 flex-1 flex-col font-medium">
                        {sample.name}
                        <span className="text-sm leading-[19px] font-normal text-muted md:hidden">{formatDate(item.savedAt)}</span>
                      </span>
                      <span className="hidden text-muted md:block">{formatDate(item.savedAt)}</span>
                      <span className="p-num font-medium">{sample.score}</span>
                      <span className="p-num w-[62px] font-medium text-forest md:w-auto">{routeForScore(sample.score)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
