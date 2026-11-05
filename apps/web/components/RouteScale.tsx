import { routeForScore, type Route } from "@/lib/assess";

const BANDS: { route: Route; flex: number }[] = [
  { route: "Recycle", flex: 45 },
  { route: "Reuse", flex: 15 },
  { route: "Repair", flex: 40 },
];

export function RouteScale({ score }: { score: number }) {
  const active = routeForScore(score);

  return (
    <div role="img" aria-label={`Score ${score} of 100, in the ${active} band`} className="w-full font-mono text-ink">
      <div className="relative h-[26px]">
        <div className="p-in d1 absolute bottom-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${score}%` }}>
          <span className="text-sm leading-[18px] font-semibold">{score}</span>
          <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden="true">
            <path d="M0 0h9L4.5 6z" fill="#14241A" />
          </svg>
        </div>
      </div>
      <div className="mt-0.5 flex h-2.5 gap-0.5">
        {BANDS.map((band) => (
          <div key={band.route} className={band.route === active ? "bg-forest" : "bg-mint"} style={{ flex: band.flex }} />
        ))}
      </div>
      <div className="mt-1.5 flex gap-0.5 text-xs leading-4">
        {BANDS.map((band) => (
          <span
            key={band.route}
            className={`min-w-0 ${band.route === active ? "font-semibold text-ink" : "text-muted"}`}
            style={{ flex: band.flex }}
          >
            {band.route}
          </span>
        ))}
      </div>
    </div>
  );
}
