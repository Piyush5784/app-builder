import * as React from "react";
import { Link } from "@tanstack/react-router";
import { animate, motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { cn } from "@package/ui/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Wraps the page in GSAP's ScrollSmoother for inertia-based smooth
 * scrolling. Expects the DOM structure ScrollSmoother requires:
 * a wrapper ref on the outer element and a content ref on its only
 * child (see `smooth-wrapper`/`smooth-content` usage in routes/index.tsx).
 * Any `position: fixed` chrome (e.g. the navbar) must live outside the
 * wrapper — ScrollSmoother transforms its content, which breaks `fixed`
 * positioning for anything nested inside it.
 */
export function useSmoothScroll() {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.2,
      effects: false,
      normalizeScroll: true,
    });

    return () => {
      smoother.kill();
    };
  }, []);

  return { wrapperRef, contentRef };
}

export function useScrollLines<T extends HTMLElement>(count: number) {
  const containerRef = React.useRef<T>(null);
  const lineRefs = React.useRef<Array<HTMLElement | null>>([]);

  const setLineRef = React.useCallback(
    (i: number) => (el: HTMLElement | null) => {
      lineRefs.current[i] = el;
    },
    [],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    const lines = lineRefs.current.filter((el): el is HTMLElement => !!el);
    if (!container || lines.length === 0) return;

    gsap.set(lines, { opacity: 0, y: 6 });

    const tween = gsap.to(lines, {
      opacity: 1,
      y: 0,
      stagger: 1,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top 75%",
        end: "bottom 55%",
        scrub: 0.5,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [count]);

  return { containerRef, setLineRef };
}

export function Reveal({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Headline whose lines rise out of a mask, one after another. */
export function MaskHeading({
  lines,
  className,
  accentFrom,
  accentClassName = "text-mute",
  as = "h2",
}: {
  lines: React.ReactNode[];
  className?: string;
  accentFrom?: number;
  accentClassName?: string;
  as?: "h1" | "h2";
}) {
  const Tag = as === "h1" ? motion.h1 : motion.h2;
  return (
    <Tag
      className={cn("font-medium", className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em]">
          <motion.span
            className={cn(
              "block",
              accentFrom !== undefined && i >= accentFrom && accentClassName,
            )}
            variants={{
              hidden: { y: "110%" },
              shown: {
                y: "0%",
                transition: { duration: 1.05, ease: EASE, delay: i * 0.08 },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Counts up once in view; the final value is in the markup for first paint. */
export function Counter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  React.useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !inView ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => (el.textContent = `${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, value, suffix]);
  return (
    <span ref={ref} className="tabular-nums">
      {`${value}${suffix}`}
    </span>
  );
}

export const H2 =
  "mt-6 text-[clamp(32px,4.4vw,52px)] leading-[1.04] tracking-[-0.04em] text-white";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1240px] px-5 sm:px-6", className)}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-code text-[11px] tracking-[0.14em] text-mute uppercase">
      <span
        className="size-1.5 rounded-full bg-acid shadow-[0_0_10px_#C8FF3D]"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  copy,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start",
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      {title}
      {copy ? (
        <p
          className={cn(
            "mt-5 max-w-[52ch] text-[16px] leading-relaxed text-mute",
            align === "center" && "mx-auto",
          )}
        >
          {copy}
        </p>
      ) : null}
    </div>
  );
}

const BUTTON_STYLES = {
  acid: "bg-acid text-void shadow-[0_0_0_1px_rgba(200,255,61,0.4),0_8px_30px_-8px_rgba(200,255,61,0.55)] hover:bg-[#d6ff6b]",
  outline:
    "border border-white/15 bg-white/[0.03] text-white hover:border-white/30 hover:bg-white/[0.06]",
};

/** Pill button. Internal routes use the router; `#hash` and external links stay plain anchors. */
export function CtaButton({
  to,
  href,
  onClick,
  children,
  variant = "acid",
  arrow = true,
  className,
}: {
  to?: "/dashboard" | "/auth/login";
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: keyof typeof BUTTON_STYLES;
  arrow?: boolean;
  className?: string;
}) {
  const classes = cn(
    "group inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-300",
    BUTTON_STYLES[variant],
    className,
  );
  const content = (
    <>
      {children}
      {arrow ? (
        <ArrowRight
          className="size-[15px] transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
  if (to)
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  if (href)
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

/** A card whose border and surface light up around the cursor. */
export function Spotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <div
      onPointerMove={onMove}
      className={cn("group/spot kestrel-card overflow-hidden", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--x) var(--y), rgba(200,255,61,0.07), transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(300px circle at var(--x) var(--y), rgba(200,255,61,0.55), transparent 50%)",
          // Paint only the 1px padding ring: a border that follows the cursor.
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Older helpers, kept for the sections that are switched off in      */
/* routes/index.tsx. They share the Kestrel look with everything else. */
/* ------------------------------------------------------------------ */

export function SectionKicker({ children }: { children: React.ReactNode }) {
  return <Eyebrow>{children}</Eyebrow>;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "mx-auto max-w-2xl",
        align === "center" ? "text-center" : "ml-0 text-left",
        className,
      )}
    >
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <h2 className={cn(H2, "font-medium")}>{title}</h2>
      {description ? (
        <p className="mt-5 text-[16px] leading-relaxed text-balance text-mute">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}

export function Section({
  id,
  className,
  contentClassName,
  children,
}: {
  id?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-20 py-24 sm:py-32", className)}
    >
      <Container className={contentClassName}>{children}</Container>
    </section>
  );
}

export function GlowCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Spotlight className={className}>{children}</Spotlight>;
}

export function WindowChrome({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-coal shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-white/10" />
          <span className="size-3 rounded-full bg-white/10" />
          <span className="size-3 rounded-full bg-white/10" />
        </span>
        <span className="flex items-center gap-1.5 font-code text-[12px] text-mute">
          {icon}
          {label}
        </span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export function CheckLine({
  children,
  delay = 0,
  done = true,
}: {
  children: React.ReactNode;
  delay?: number;
  done?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
      className="flex items-center gap-2.5 font-code text-[13px]"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
          done ? "bg-acid text-void" : "border border-white/15 text-dim",
        )}
      >
        {done ? "✓" : "…"}
      </span>
      <span className={done ? "text-white/85" : "text-dim"}>{children}</span>
    </motion.div>
  );
}
