import type { Sample } from "@/lib/samples";

// Updated color ramp using new teal/slate palette
const RAMP = [
  "#0F2C33",  // Deep Tech-Teal
  "#13353E",  // Lighter teal-slate
  "#1B434C",  // Border teal-slate
  "#2D5D68",  // Stronger teal-slate
  "#3A828F",  // Vibrant Cyan-Teal
  "#3B5B73",  // Technical Slate Blue
];

export function Materials({ materials }: { materials: Sample["materials"] }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="p-grow flex h-6 gap-px" role="img" aria-label="Share of device mass by material, detailed in the list below">
        {materials.map((m, i) => (
          <div key={m.name} className="min-w-0" style={{ flex: m.share, background: RAMP[i % RAMP.length] }} />
        ))}
      </div>
      <ul className="border-t border-[var(--color-border-rule)]">
        {materials.map((m, i) => (
          <li key={m.name} className="flex min-h-10 items-center gap-2.5 border-b border-[var(--color-border-rule-soft)] text-[15px]">
            <span aria-hidden="true" className="size-2.5 flex-none" style={{ background: RAMP[i % RAMP.length] }} />
            <span className="min-w-0 flex-1 text-[var(--color-text-on-light)]">{m.name}</span>
            <span className="p-num text-xs text-[var(--color-text-on-light-muted)]">{m.fate}</span>
            <span className="p-num w-10 flex-none text-right text-sm font-medium text-[var(--color-text-on-light)]">{m.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}