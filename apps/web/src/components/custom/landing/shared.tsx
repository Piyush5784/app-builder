import * as React from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@package/ui/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const EASE = [0.16, 1, 0.3, 1] as const;

// Scrubs a list of "terminal line" elements in one by one as the container
// scrolls through the viewport — lines are tied to scroll position (via
// ScrollTrigger's scrub) rather than firing once on first view, so scrolling
// back up un-reveals them too. One ScrollTrigger per mount, cleaned up on
// unmount/dep change.
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
  y = 20,
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
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </div>
  );
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
      {kicker ? <SectionKicker>{kicker}</SectionKicker> : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-balance text-muted-foreground">{description}</p>
      ) : null}
    </Reveal>
  );
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative border-t border-border px-6 py-24 sm:py-28",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

// Cursor-follow glow: track pointer position as CSS vars so the radial
// highlight in the pseudo-layer below tracks the mouse instead of sitting
// fixed — plain pointermove + CSS var, no extra render/state involved.
function useCursorGlow<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);

  const onPointerMove = React.useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }, []);

  return { ref, onPointerMove };
}

export function GlowCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, onPointerMove } = useCursorGlow<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-foreground/[0.02] transition-colors duration-300 hover:border-foreground/20 hover:bg-foreground/[0.035]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(400px_circle_at_var(--x,50%)_var(--y,0%),color-mix(in_oklch,var(--color-foreground),transparent_94%),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {children}
    </div>
  );
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
  const { ref, onPointerMove } = useCursorGlow<HTMLDivElement>();

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "group/window relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_30px_80px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(220px_circle_at_var(--x,50%)_var(--y,0%),black,transparent_70%)] opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/window:opacity-100" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(260px_circle_at_var(--x,50%)_var(--y,0%),color-mix(in_oklch,var(--color-foreground),transparent_94%),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover/window:opacity-100" />

      <div className="relative flex items-center gap-2 border-b border-border bg-foreground/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-foreground/10" />
          <span className="size-2.5 rounded-full bg-foreground/10" />
          <span className="size-2.5 rounded-full bg-foreground/10" />
        </div>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
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
      className="flex items-center gap-2 font-mono text-[13px]"
    >
      <motion.span
        key={done ? "done" : "pending"}
        initial={done ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
          done
            ? "bg-emerald-400/15 text-emerald-500 dark:text-emerald-400"
            : "bg-foreground/10 text-muted-foreground",
        )}
      >
        {done ? "✓" : "…"}
      </motion.span>
      <span className={done ? "text-foreground/80" : "text-muted-foreground"}>
        {children}
      </span>
    </motion.div>
  );
}
