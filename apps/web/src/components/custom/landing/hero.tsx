import * as React from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@package/ui/components/dialog";
import { BuildDemo } from "./build-demo";
import { RotatingWord } from "./effects";
import { Container, CtaButton, MaskHeading, Reveal } from "./shared";

// three.js loads in its own chunk, after the first paint.
const SignalField = React.lazy(() => import("./signal-field"));

const DEMO_VIDEO_URL =
  "https://player.cloudinary.com/embed/?cloud_name=dzf9kamfw&public_id=Screencast_from_2026-09-04_19-44-52_v9yxns";

const BUILDS = [
  "a SaaS.",
  "a dashboard.",
  "a landing page.",
  "an internal tool.",
  "a CRM.",
];

const PIPELINE = ["Prompt", "AI agent", "Sandbox", "Working app"];

const STACK = [
  "React",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "shadcn/ui",
  "Node.js",
  "npm",
  "Git",
  "GitHub",
];

export function Hero() {
  const [videoOpen, setVideoOpen] = React.useState(false);

  return (
    <section id="product" className="relative overflow-x-clip pt-32 sm:pt-40">
      {/* Background: CSS dots first, the WebGL field on top once it loads. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[820px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 dot-grid opacity-40" />
        <React.Suspense fallback={null}>
          <SignalField className="absolute inset-0" />
        </React.Suspense>
        <div className="absolute top-24 left-1/2 h-[340px] w-[760px] -translate-x-1/2 rounded-full bg-acid/[0.07] blur-[100px]" />
      </div>

      <Container className="relative">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pr-3 pl-1 text-[13px] text-mute backdrop-blur transition-colors hover:border-white/20 hover:text-white"
            >
              <span className="rounded-full bg-acid px-2 py-0.5 font-code text-[11px] font-medium text-void">
                Agent
              </span>
              Your AI software engineer, in its own dev environment
              <ArrowRight
                className="size-[13px] transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </Reveal>

          <MaskHeading
            as="h1"
            lines={[
              "Describe it.",
              <RotatingWord
                key="rotating"
                prefix="Ship"
                words={BUILDS}
                className="font-display-serif font-normal tracking-[-0.02em] text-acid italic"
              />,
            ]}
            className="mt-8 text-[clamp(44px,7.4vw,92px)] leading-[0.98] tracking-[-0.05em] text-white"
          />

          <Reveal delay={0.2}>
            <p className="mx-auto mt-7 max-w-[56ch] text-[17px] leading-relaxed text-mute">
              Your AI agent plans, codes, runs, debugs and tests it inside a
              real sandbox — then hands you a working application.
            </p>
          </Reveal>
          <Reveal
            delay={0.3}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <CtaButton to="/dashboard">Start building for free</CtaButton>
            <CtaButton
              variant="outline"
              arrow={false}
              onClick={() => setVideoOpen(true)}
            >
              <PlayCircle className="size-4" aria-hidden="true" />
              Watch how it works
            </CtaButton>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="mt-5 font-code text-[12px] text-dim">
              No setup · A real sandbox per project · Export your code anytime
            </p>
          </Reveal>
        </div>

        <BuildDemo />

        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-2 font-code text-[12px] text-mute">
          {PIPELINE.map((step, i) => (
            <React.Fragment key={step}>
              <span
                className={
                  i === PIPELINE.length - 1
                    ? "rounded-full border border-acid/30 bg-acid/10 px-3 py-1 text-acid"
                    : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1"
                }
              >
                {step}
              </span>
              {i < PIPELINE.length - 1 ? (
                <ArrowRight className="size-3 text-dim" aria-hidden="true" />
              ) : null}
            </React.Fragment>
          ))}
        </Reveal>
      </Container>

      <div className="relative mt-20 border-y border-white/[0.06] py-10">
        <p className="text-center text-[13px] text-dim">
          Writes real code with the tools you already use
        </p>
        <div className="mt-6 overflow-hidden fade-x">
          <ul className="flex w-max animate-marquee gap-14 pr-14">
            {[...STACK, ...STACK].map((name, i) => (
              <li
                key={i}
                aria-hidden={i >= STACK.length}
                className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.03em] whitespace-nowrap text-white/35"
              >
                <span className="text-[13px] text-acid/60">◆</span>
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="w-[90vw] max-w-5xl p-0 sm:max-w-5xl">
          <DialogTitle className="sr-only">Product demo video</DialogTitle>
          <div className="aspect-video w-full overflow-hidden rounded-xl">
            <iframe
              src={videoOpen ? DEMO_VIDEO_URL : undefined}
              className="h-full w-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title="Product demo video"
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
