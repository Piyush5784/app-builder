import { Check } from "lucide-react";
import { LogoMark } from "./brand";
import { Container, CtaButton, H2, MaskHeading, Reveal } from "./shared";

const POINTS = ["Free plan", "A real sandbox per project", "Export anytime"];

export function FinalCta() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <div className="kestrel-card relative overflow-hidden px-6 py-20 text-center sm:py-28">
          <div
            className="absolute inset-0 dot-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-50"
            aria-hidden="true"
          />
          <div
            className="absolute top-0 left-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/20 blur-[110px]"
            aria-hidden="true"
          />
          {/* Falling beams */}
          {[18, 34, 66, 82].map((left, i) => (
            <span
              key={left}
              className="absolute top-0 h-40 w-px animate-beam bg-linear-to-b from-transparent via-acid/50 to-transparent"
              style={{
                left: `${left}%`,
                animationDuration: `${4 + i}s`,
                animationDelay: `${i * 0.8}s`,
              }}
              aria-hidden="true"
            />
          ))}
          <div className="relative flex flex-col items-center">
            <Reveal>
              <span className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-coal shadow-[0_0_60px_-10px_rgba(200,255,61,0.7)]">
                <LogoMark className="size-9" />
              </span>
            </Reveal>
            <MaskHeading
              lines={["What will you", "build today?"]}
              accentFrom={1}
              accentClassName="font-display-serif font-normal italic text-acid tracking-[-0.02em]"
              className={`${H2} !text-[clamp(36px,5.4vw,68px)]`}
            />
            <Reveal delay={0.15}>
              <p className="mx-auto mt-5 max-w-[46ch] text-[16px] leading-relaxed text-mute">
                Turn an idea into a working application with your AI software
                engineer.
              </p>
            </Reveal>
            <Reveal
              delay={0.25}
              className="mt-9 flex flex-wrap justify-center gap-3"
            >
              <CtaButton to="/dashboard">Start building for free</CtaButton>
              <CtaButton href="#how-it-works" variant="outline" arrow={false}>
                See how it works
              </CtaButton>
            </Reveal>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-mute">
              {POINTS.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-acid" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
