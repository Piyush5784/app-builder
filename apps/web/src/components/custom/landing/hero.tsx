import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import DotField from "@package/ui/components/DotField";
import ColorBends from "@package/ui/components/ColorBends";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@package/ui/components/dialog";
import { WindowChrome, EASE } from "./shared";

const DEMO_VIDEO_URL =
  "https://player.cloudinary.com/embed/?cloud_name=dzf9kamfw&public_id=Screencast_from_2026-09-04_19-44-52_v9yxns";

export function Hero() {
  const [videoOpen, setVideoOpen] = React.useState(false);

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
          {/* <DotField
            dotRadius={1.2}
            dotSpacing={16}
            cursorRadius={480}
            bulgeOnly
            bulgeStrength={50}
            glowRadius={180}
            gradientFrom="rgba(113, 113, 122, 0.35)"
            gradientTo="rgba(113, 113, 122, 0.12)"
            glowColor="rgba(161, 161, 170, 0.5)"
          /> */}
        </div>
        {/* <ColorBends
          colors={["#71717a", "#a1a1aa", "#52525b"]}
          speed={0.12}
          scale={2}
          frequency={2.5}
          intensity={1}
          warpStrength={1}
          noise={0.08}
          mouseInfluence={0.6}
          style={{ position: "absolute", inset: 0, opacity: 0.55 }}
        /> */}
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
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/5"
        >
          <PlayCircle className="size-4" />
          Watch how it works
        </button>
      </motion.div>

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

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        className="relative mt-20 w-[70vw] max-w-[1600px] text-left"
      >
        <WindowChrome label="preview · localhost:3000">
          <img
            src="https://res.cloudinary.com/dzf9kamfw/image/upload/v1788531819/Screenshot_from_2026-09-04_19-46-29_acx9xa.png"
            alt="App preview"
            className="h-full w-full object-cover"
          />
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
