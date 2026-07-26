export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="Nana & Matteo Wedding Flight"
      role="img"
    >
      <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path
        d="M24 8c-1 4-1 8 0 12M24 8c1 4 1 8 0 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 27 L20 24 L24 12 L26 12 L24 24 L38 24 L42 27 L26 27 L22 34 L26 34 L24 37 L20 37 L18 34 L22 27 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 13.5 L9.5 12 L11.5 4 L13 4 L11.7 12 L20 12 L22 13.5 L11.7 13.5 L9.7 19 L12 19 L11 21 L9 21 L7.8 19 L10 13.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
