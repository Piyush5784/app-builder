import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, PlayCircle, Sparkles, User2 } from "lucide-react";
import DotField from "@package/ui/components/DotField";
import ColorBends from "@package/ui/components/ColorBends";
import { WindowChrome, CheckLine, EASE } from "./shared";

const BUILD_STEPS = [
  "Project structure created",
  "Dependencies installed",
  "Authentication configured",
  "Database schema created",
  "Dashboard generated",
  "Running application",
  "Build successful",
];

export function Hero() {
  return (
    <section
      id="product"
      className="relative flex flex-col items-center overflow-hidden px-6 pt-40 pb-20 text-center"
    >
      {/* DotField/ColorBends need `position: absolute` forced via inline
          style, not className — their own bundled .css sets `position:
          relative` on the same class Tailwind's `absolute` targets, and
          that stylesheet wins the cascade over the utility class. */}
      <div
        className="absolute inset-0 -z-10"
        style={{ position: "absolute", inset: 0 }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <DotField
            dotRadius={1.5}
            dotSpacing={16}
            cursorRadius={480}
            bulgeOnly
            bulgeStrength={50}
            glowRadius={180}
            gradientFrom="rgba(113, 113, 122, 0.35)"
            gradientTo="rgba(113, 113, 122, 0.12)"
            glowColor="rgba(161, 161, 170, 0.5)"
          />
        </div>
        <ColorBends
          colors={["#71717a", "#a1a1aa", "#52525b"]}
          speed={0.12}
          scale={1.4}
          intensity={1.1}
          warpStrength={1}
          noise={0.08}
          mouseInfluence={0.6}
          style={{ position: "absolute", inset: 0, opacity: 0.55 }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-background via-background/70 to-background" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--color-foreground),transparent_92%),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-4 py-1.5 text-sm text-muted-foreground"
      >
        <Sparkles className="size-3.5 text-foreground" />
        Your AI software engineer, in its own dev environment
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
        className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl"
      >
        Build and ship apps with AI.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
        className="mt-6 max-w-2xl text-lg text-balance text-muted-foreground"
      >
        Describe what you want to build. Your AI agent plans, codes, runs,
        debugs, and tests it inside a real sandbox — then gives you a working
        application.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.03] active:scale-[0.98] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
        >
          Start building for free
          <ArrowRight className="size-4" />
        </Link>
        <a
          href="#live-demo"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/5"
        >
          <PlayCircle className="size-4" />
          Watch how it works
        </a>
      </motion.div>

      {/* Prompt → Agent → Sandbox → App */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        className="relative mt-20 grid w-full max-w-6xl gap-4 text-left lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      >
        {/* Chat / prompt panel */}
        <WindowChrome
          label="agent · session"
          icon={<User2 className="size-3" />}
        >
          <div className="flex h-full flex-col gap-3 p-4">
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary-foreground">
                Build a modern project management SaaS with authentication, a
                dashboard, projects, tasks, team members, and dark mode.
              </div>
            </div>

            <div className="max-w-[90%] rounded-xl rounded-tl-sm border border-border bg-foreground/[0.03] px-3.5 py-2.5 text-[13px] text-foreground/70">
              Planning your application…
            </div>

            <div className="mt-1 flex flex-col gap-2 rounded-xl border border-border bg-foreground/[0.03] p-3.5">
              {BUILD_STEPS.map((step, i) => (
                <CheckLine key={step} delay={0.5 + i * 0.12}>
                  {step}
                </CheckLine>
              ))}
            </div>
          </div>
        </WindowChrome>

        {/* Browser preview */}
        <WindowChrome label="preview · localhost:3000">
          <div className="border-b border-border bg-foreground/[0.02] px-4 py-2">
            <div className="w-fit rounded-md bg-foreground/[0.06] px-3 py-1 font-mono text-[11px] text-muted-foreground">
              your-app.dev/dashboard
            </div>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-0 bg-muted/40">
            <div className="flex flex-col gap-2 border-r border-border p-3">
              <div className="h-6 w-full rounded-md bg-foreground/10" />
              {["Dashboard", "Projects", "Tasks", "Team", "Settings"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`rounded-md px-2 py-1.5 text-[11px] ${
                      i === 0
                        ? "bg-foreground/10 text-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-foreground/15" />
                <div className="h-7 w-20 rounded-md bg-primary/90" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg border border-border bg-foreground/[0.03] p-2.5"
                  >
                    <div className="h-2 w-10 rounded bg-foreground/20" />
                    <div className="mt-2 h-3 w-14 rounded bg-foreground/30" />
                  </div>
                ))}
              </div>
              <div className="flex-1 rounded-lg border border-border bg-foreground/[0.02] p-3">
                <div className="mb-3 h-2.5 w-24 rounded bg-foreground/15" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md bg-foreground/[0.03] p-2"
                    >
                      <div className="size-5 rounded-full bg-foreground/10" />
                      <div className="h-2 flex-1 rounded bg-foreground/10" />
                      <div className="h-4 w-10 rounded bg-emerald-400/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </WindowChrome>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mt-6 flex items-center gap-3 text-xs text-muted-foreground"
      >
        <span>Prompt</span>
        <ArrowRight className="size-3" />
        <span>AI Agent</span>
        <ArrowRight className="size-3" />
        <span>Sandbox</span>
        <ArrowRight className="size-3" />
        <span>Working App</span>
      </motion.div>
    </section>
  );
}
