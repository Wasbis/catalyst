// SVG logo Cliste (ribbon/wave mark) — versi statis & versi "trim path" loading loop.
// pathLength="100" dipakai supaya stroke-dasharray/dashoffset di globals.css selalu proporsional
// terhadap panjang path, terlepas dari ukuran tampil (responsive lewat prop size).
export default function CatalystLogo({ size = 20, className = "", animate = false }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Catalyst"
      className={className}
    >
      <path
        d="M68 18C49 15 32 27 31 43c-1 15 11 25 25 29 14 4 24 15 22 28-2 13-18 21-33 18"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
        className={animate ? "catalyst-logo-trace" : ""}
      />
      <path
        d="M80 22l8 8-8 8-8-8z"
        fill="currentColor"
        className={animate ? "catalyst-logo-dot-pulse" : ""}
      />
    </svg>
  );
}
