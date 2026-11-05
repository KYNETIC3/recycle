import type { Sample } from "@/lib/samples";

const RAMP = ["#1B5E20", "#2E7D32", "#4CAF50", "#81C784", "#C8E6C9", "#1565C0"];

export function Materials({ materials }: { materials: Sample["materials"] }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="p-grow flex h-6 gap-px" role="img" aria-label="Share of device mass by material, detailed in the list below">
        {materials.map((m, i) => (
          <div key={m.name} className="min-w-0" style={{ flex: m.share, background: RAMP[i] }} />
        ))}
      </div>
      <ul className="border-t border-rule">
        {materials.map((m, i) => (
          <li key={m.name} className="flex min-h-10 items-center gap-2.5 border-b border-rule-soft text-[15px]">
            <span aria-hidden="true" className="size-2.5 flex-none" style={{ background: RAMP[i] }} />
            <span className="min-w-0 flex-1">{m.name}</span>
            <span className="p-num text-xs text-muted">{m.fate}</span>
            <span className="p-num w-10 flex-none text-right text-sm font-medium">{m.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
