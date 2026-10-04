import * as React from "react";
import { motion, useScroll, useSpring } from "motion/react";
import {
  Check,
  GitBranch,
  Hammer,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Rocket,
  X,
} from "lucide-react";
import { Container, H2, MaskHeading, Reveal, SectionHeader } from "./shared";

function DescribeVisual() {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-void/70 p-3">
      <p className="text-[13px] text-white/80">
        a booking app for a yoga studio, with a schedule and payments
        <span
          className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] animate-blink bg-acid"
          aria-hidden="true"
        />
      </p>
    </div>
  );
}

function BuildVisual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid size-20 place-items-center">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#C8FF3D"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42 * 0.64} 999`}
          />
        </svg>
        <Hammer className="size-5 text-acid" aria-hidden="true" />
      </div>
      <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-code text-[11px] text-mute">
        <Loader2
          className="size-[11px] animate-spin text-acid"
          aria-hidden="true"
        />
        Schedule.tsx
      </span>
    </div>
  );
}

function IterateVisual() {
  return (
    <div className="flex w-full flex-col gap-2 font-code text-[11px]">
      <span className="flex items-center gap-2 rounded-lg border border-del/25 bg-del/[0.07] px-2.5 py-1.5 text-del">
        <X className="size-3" aria-hidden="true" /> TS2322 in Booking.tsx
      </span>
      <span className="flex items-center gap-2 px-2.5 text-dim">
        <RefreshCcw className="size-3" aria-hidden="true" /> fixing types…
      </span>
      <span className="flex items-center gap-2 rounded-lg border border-acid/25 bg-acid/[0.07] px-2.5 py-1.5 text-acid">
        <Check className="size-3" aria-hidden="true" /> build passed
      </span>
    </div>
  );
}

function ShipVisual() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <svg
        viewBox="0 0 220 80"
        className="w-full max-w-[200px]"
        aria-hidden="true"
      >
        <path d="M10 60 H210" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        <path
          d="M50 60 C 70 60, 70 22, 95 22 H140 C 165 22, 165 60, 185 60"
          fill="none"
          stroke="#C8FF3D"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="animate-dash"
        />
        {[10, 50, 210].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="60"
            r="5"
            fill="#14171C"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
        ))}
        {[95, 140].map((x) => (
          <circle
            key={x}
            cx={x}
            cy="22"
            r="5"
            fill="#14171C"
            stroke="#C8FF3D"
            strokeWidth="2"
          />
        ))}
        <circle cx="185" cy="60" r="7" fill="#C8FF3D" />
      </svg>
      <span className="flex items-center gap-2 rounded-full border border-acid/30 bg-acid/10 px-3 py-1 font-code text-[11px] text-acid">
        <GitBranch className="size-3" aria-hidden="true" /> pushed to GitHub
      </span>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    icon: MessageSquareText,
    title: "Describe",
    description: "Tell the agent what you want to build, in plain words.",
    Visual: DescribeVisual,
  },
  {
    n: "02",
    icon: Hammer,
    title: "Build",
    description:
      "The agent creates and modifies the application inside its sandbox.",
    Visual: BuildVisual,
  },
  {
    n: "03",
    icon: RefreshCcw,
    title: "Iterate",
    description:
      "It runs the app, reads errors, tests changes and fixes problems.",
    Visual: IterateVisual,
  },
  {
    n: "04",
    icon: Rocket,
    title: "Ship",
    description:
      "Preview it, export it, connect GitHub and deploy your application.",
    Visual: ShipVisual,
  },
];

export function HowItWorks() {
  const track = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start 0.8", "end 0.6"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section id="how-it-works" className="scroll-mt-20 pb-24 sm:pb-32">
      <Container>
        <SectionHeader
          eyebrow="How it works"
          copy="From a sentence to a running app, in one continuous loop."
          title={
            <MaskHeading
              lines={["From idea to", "running app."]}
              accentFrom={1}
              className={H2}
            />
          }
        />
        <div ref={track} className="relative mt-16">
          <div
            className="absolute top-[22px] right-[12.5%] left-[12.5%] hidden h-px bg-white/10 lg:block"
            aria-hidden="true"
          >
            <motion.div
              style={{ scaleX: fill }}
              className="h-full origin-left bg-linear-to-r from-teal to-acid shadow-[0_0_12px_#C8FF3D]"
            />
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal
                  delay={i * 0.12}
                  className="flex h-full flex-col items-center"
                >
                  <span className="relative z-10 grid size-11 place-items-center rounded-full border border-white/15 bg-void font-code text-[13px] text-white">
                    {s.n}
                  </span>
                  <div className="kestrel-card mt-6 flex w-full flex-1 flex-col">
                    <div className="flex h-40 items-center justify-center rounded-t-2xl border-b border-white/[0.06] dot-grid px-5">
                      <s.Visual />
                    </div>
                    <div className="p-6">
                      <p className="flex items-center gap-2 font-code text-[11px] tracking-[0.14em] text-acid uppercase">
                        <s.icon className="size-[13px]" aria-hidden="true" />
                        Step {s.n}
                      </p>
                      <h3 className="mt-3 text-[20px] font-medium tracking-[-0.02em] text-white">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-mute">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
