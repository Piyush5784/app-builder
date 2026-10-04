import { Link } from "@tanstack/react-router";

export const BRAND = "Wb";

/** An acid tile with a terminal prompt: ">_". */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#C8FF3D" />
      <path
        d="m9 10.5 6 5.5-6 5.5M17 22h7"
        fill="none"
        stroke="#07080A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2.5"
      aria-label={`${BRAND} home`}
    >
      <LogoMark className="size-7" />
      <span className="text-[18px] font-semibold tracking-[-0.03em] text-white">
        {BRAND}
      </span>
    </Link>
  );
}
