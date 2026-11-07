import type { SampleKey } from "@/lib/samples";

function Callout({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="9" fill="#FFFFFF" stroke="#0F2C33" />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="#0F2C33" stroke="none">
        {n}
      </text>
    </>
  );
}

const LABELS: Record<SampleKey, string> = {
  iphone: "Line drawing of a phone with three numbered inspection points",
  motherboard: "Line drawing of a motherboard with three numbered inspection points",
  battery: "Line drawing of a laptop battery with three numbered inspection points",
};

const DRAWINGS: Record<SampleKey, React.ReactNode> = {
  iphone: (
    <>
      <rect x="70" y="14" width="100" height="212" rx="14" />
      <rect x="76" y="20" width="88" height="200" rx="9" />
      <rect x="84" y="30" width="72" height="62" />
      <rect x="88" y="34" width="28" height="28" />
      <circle cx="96" cy="42" r="5" />
      <circle cx="108" cy="42" r="5" />
      <circle cx="96" cy="54" r="5" />
      <rect x="84" y="98" width="72" height="92" />
      <path d="M84 118h72M84 138h72M84 158h72" strokeDasharray="2 3" />
      <path d="M84 200h72" strokeDasharray="2 3" />
      <path d="M118 124l14 16-9 10 18 28M132 140l16-8M123 150l-20 8" stroke="#3B5B73" strokeWidth="1.5" />
      <path d="M50 14v212M46 14h8M46 226h8" stroke="#3A828F" />
      <Callout x={170} y={134} n={1} />
      <Callout x={170} y={62} n={2} />
      <Callout x={70} y={170} n={3} />
    </>
  ),
  motherboard: (
    <>
      <rect x="24" y="24" width="192" height="192" />
      <circle cx="34" cy="34" r="3" />
      <circle cx="206" cy="34" r="3" />
      <circle cx="34" cy="206" r="3" />
      <circle cx="206" cy="206" r="3" />
      <rect x="84" y="44" width="56" height="56" />
      <rect x="94" y="54" width="36" height="36" />
      <rect x="154" y="40" width="7" height="92" />
      <rect x="166" y="40" width="7" height="92" />
      <rect x="178" y="40" width="7" height="92" stroke="#3B5B73" strokeWidth="1.5" />
      <rect x="190" y="40" width="7" height="92" stroke="#3B5B73" strokeWidth="1.5" />
      <rect x="44" y="146" width="120" height="9" />
      <rect x="44" y="172" width="120" height="6" />
      <rect x="44" y="190" width="120" height="6" />
      <rect x="36" y="44" width="30" height="72" />
      <path d="M36 62h30M36 80h30M36 98h30" strokeDasharray="2 3" />
      <rect x="176" y="150" width="28" height="28" />
      <Callout x={84} y={44} n={1} />
      <Callout x={197} y={132} n={2} />
      <Callout x={44} y={150} n={3} />
    </>
  ),
  battery: (
    <>
      <rect x="20" y="58" width="200" height="124" />
      <rect x="30" y="68" width="52" height="104" />
      <rect x="94" y="68" width="52" height="104" />
      <rect x="158" y="68" width="52" height="104" />
      <path d="M30 94h52M30 120h52M30 146h52M94 94h52M94 120h52M94 146h52M158 94h52M158 120h52M158 146h52" strokeDasharray="2 3" />
      <rect x="60" y="30" width="120" height="16" />
      <path d="M72 46v12M168 46v12" />
      <path d="M180 38h24v20" stroke="#3B5B73" strokeWidth="1.5" />
      <path d="M20 200h200M20 196v8M220 196v8" stroke="#3A828F" />
      <Callout x={30} y={68} n={1} />
      <Callout x={146} y={172} n={2} />
      <Callout x={60} y={38} n={3} />
    </>
  ),
};

export function DeviceDrawing({ device }: { device: SampleKey }) {
  return (
    <svg viewBox="0 0 240 240" fill="none" stroke="#0F2C33" strokeWidth="1.2" role="img" aria-label={LABELS[device]} className="mx-auto block h-auto w-full max-w-60">
      {DRAWINGS[device]}
    </svg>
  );
}