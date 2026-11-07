export function LogoMark({ size = 20, color = "#81D8D0" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" aria-hidden="true">
      <path d="M6 19H3V3h18v16H10" />
      <path d="M13.5 15.5L10 19l3.5 3.5" />
    </svg>
  );
}