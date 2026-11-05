import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { routeForScore } from "@/lib/assess";
import { SAMPLE_KEYS, SAMPLES } from "@/lib/samples";

const DEVICES = SAMPLE_KEYS.map((key) => SAMPLES[key]);

const STEPS = [
  { title: "Capture", text: "Photograph the device." },
  { title: "Assess", text: "eLoop identifies it and checks for damage." },
  { title: "Route", text: "Repair, reuse or recycle, with certified recyclers to hand it to." },
];

const TABLE_COLUMNS = "grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_80px_110px_24px] items-center gap-4";

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F5B53" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function OverviewPage() {
  return (
    <div className="pb-16 md:pb-0">
      <header className="flex h-[52px] items-center gap-2 border-b border-rule px-4 text-lg font-semibold tracking-[-0.2px] md:hidden">
        <LogoMark />
        eLoop
      </header>

      <main className="flex flex-col md:gap-8 md:px-10 md:pt-8 md:pb-10">
        <div className="p-in grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] md:gap-8">
          <section className="flex flex-col items-stretch gap-3 px-4 py-6 md:items-start md:p-0">
            <span className="p-label">Device assessment</span>
            <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.5px] md:text-[44px] md:leading-[50px] md:tracking-[-1px]">
              Assess a device before it becomes waste.
            </h1>
            <p className="text-base leading-6 text-muted md:text-[17px] md:leading-[26px]">
              One photo tells you whether to repair, reuse or recycle it.
            </p>
            <Link href="/assess" className="p-btn mt-2 min-h-[52px] md:px-7">
              Upload device photo
            </Link>
          </section>

          <section aria-label="Global e-waste" className="flex flex-col justify-between gap-3 bg-forest px-4 py-5 text-white md:gap-5 md:p-6">
            <span className="p-label hidden text-mint md:block">The e-waste gap</span>
            <div className="grid grid-cols-2 gap-4 md:gap-5">
              <div>
                <p className="p-num text-[32px] leading-[38px] font-medium md:text-[44px] md:leading-[50px]">62 Mt</p>
                <p className="mt-0.5 text-sm leading-[19px] md:mt-1 md:text-[15px] md:leading-[21px]">e-waste generated in 2022</p>
              </div>
              <div>
                <p className="p-num text-[32px] leading-[38px] font-medium md:text-[44px] md:leading-[50px]">22.3%</p>
                <p className="mt-0.5 text-sm leading-[19px] md:mt-1 md:text-[15px] md:leading-[21px]">formally collected and recycled</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div aria-hidden="true" className="h-1.5 bg-leaf">
                <div className="p-grow h-1.5 w-[22.3%] bg-white" />
              </div>
              <p className="text-xs leading-4 text-mint">Source: Global E-waste Monitor 2024</p>
            </div>
          </section>
        </div>

        <section className="p-in d1 px-4 pt-6 pb-2 md:p-0">
          <h2 className="p-label mb-2">Sample devices</h2>

          <div className="border-t border-rule md:hidden">
            {DEVICES.map((d) => (
              <Link key={d.key} href={`/result/${d.key}`} className="p-row flex min-h-[60px] items-center gap-3 border-b border-rule py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base leading-[22px] font-medium">{d.name}</span>
                  <span className="text-sm leading-[19px] text-muted">{d.condition}</span>
                </span>
                <span className="p-num text-sm font-medium">{d.score}</span>
                <span className="p-num w-[62px] text-[13px] font-medium text-forest">{routeForScore(d.score)}</span>
              </Link>
            ))}
          </div>

          <div className="hidden border-t border-ink md:block">
            <div className={`${TABLE_COLUMNS} p-label min-h-9 border-b border-rule`}>
              <span>Device</span>
              <span>Condition</span>
              <span>Score</span>
              <span>Route</span>
              <span />
            </div>
            {DEVICES.map((d) => (
              <Link key={d.key} href={`/result/${d.key}`} className={`${TABLE_COLUMNS} p-row min-h-12 border-b border-rule text-[15px]`}>
                <span className="font-medium">{d.name}</span>
                <span className="text-muted">{d.condition}</span>
                <span className="p-num font-medium">{d.score}</span>
                <span className="p-num font-medium text-forest">{routeForScore(d.score)}</span>
                <Chevron />
              </Link>
            ))}
          </div>
        </section>

        <section className="p-in d2 px-4 pt-6 pb-7 md:p-0">
          <h2 className="p-label mb-2">How it works</h2>
          <ol className="border-t border-rule md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] md:gap-6 md:border-t-0">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex gap-3.5 border-b border-rule py-3 md:flex-col md:gap-1 md:border-t-[3px] md:border-b-0 md:border-t-forest md:pt-2.5 md:pb-0"
              >
                <span className="p-num text-[13px] leading-[22px] font-medium text-forest md:text-xs md:text-muted">0{i + 1}</span>
                <span className="text-[15px] leading-[22px]">
                  <strong className="font-semibold md:block md:text-[17px] md:leading-6">{step.title}</strong>{" "}
                  <span className="md:mt-1 md:block md:text-muted">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
