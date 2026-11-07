import type { Route } from "@/lib/assess";

const ENDS: Record<Route, string> = {
  Repair: "Back in use",
  Reuse: "Parts reused",
  Recycle: "Materials recovered",
};

// Updated to use new color system: turquoise for active, teal-light for secondary, border-rule for inactive
const RULES = [
  "bg-[#81D8D0]",
  "bg-[#81D8D0]",
  "bg-[#81D8D0]",
  "bg-[var(--color-border-rule)]",
];

export function Lifecycle({ route }: { route: Route }) {
  const labels = ["Collected", "Assessed", route, ENDS[route]];

  return (
    <ol aria-label="Device lifecycle" className="grid w-full grid-cols-4 gap-0.5">
      {labels.map((label, i) => (
        <li key={label} aria-current={i === 2 ? "step" : undefined} className="flex min-w-0 flex-col gap-1.5">
          <div className={`h-[3px] ${RULES[i]}`} />
          <span className="p-num text-xs leading-4 text-[var(--color-text-on-light-muted)]">0{i + 1}</span>
          <span className={`text-sm leading-[18px] ${i === 2 ? "font-semibold text-[var(--color-text-on-light)]" : "text-[var(--color-text-on-light-muted)]"} ${i === 3 ? "" : ""}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}