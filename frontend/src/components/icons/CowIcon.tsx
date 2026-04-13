// Inek ikonu — Lucide stiliyle birebir uyumlu (stroke, round caps, 24x24)
interface CowIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CowIcon({ size = 24, strokeWidth = 1.5, className = '' }: CowIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Kulaklar — sol */}
      <path d="M4 9c-1.2 0-2 1-2 2.2 0 1.4 1 2.4 2.3 2.4" />
      {/* Kulaklar — sag */}
      <path d="M20 9c1.2 0 2 1 2 2.2 0 1.4-1 2.4-2.3 2.4" />
      {/* Boynuzlar */}
      <path d="M7 7.5c0-1.5-.5-3-1.5-3.5" />
      <path d="M17 7.5c0-1.5.5-3 1.5-3.5" />
      {/* Yuz konturu (yumrulu yuvarlak) */}
      <path d="M5 12c0-3.3 3.1-6 7-6s7 2.7 7 6v3c0 3-3.1 5.5-7 5.5s-7-2.5-7-5.5Z" />
      {/* Gozler */}
      <circle cx="9.5" cy="12" r="0.6" fill="currentColor" />
      <circle cx="14.5" cy="12" r="0.6" fill="currentColor" />
      {/* Burun ovali */}
      <ellipse cx="12" cy="16" rx="2.8" ry="2" />
      {/* Burun deligi */}
      <path d="M10.8 16v.8" />
      <path d="M13.2 16v.8" />
    </svg>
  );
}
