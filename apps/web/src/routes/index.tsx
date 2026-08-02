import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  Cpu,
  Layers,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { WebglMorph } from "@/components/custom/webgl-morph/webgl-morph";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Bot,
    title: "Describe it, don't build it",
    description:
      "Type what you want in plain English — a landing page, a dashboard, a small app — and watch it get built in a live sandbox.",
  },
  {
    icon: Zap,
    title: "Live, not a preview",
    description:
      "Every change streams into a real running dev server. What you see is the actual app, hot-reloading as the agent writes files.",
  },
  {
    icon: Layers,
    title: "See every step",
    description:
      "Watch the agent read, write, and run commands in real time — no black box, just a transparent trace of exactly what changed.",
  },
  {
    icon: ShieldCheck,
    title: "Your session, remembered",
    description:
      "Every prompt, model call, and file edit is tracked end to end, so nothing about a build is ever a mystery after the fact.",
  },
];

function LandingPage() {
  return (
    <main className="text-white">
      <Hero />
      <Features />
      <ProductShowcase />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <WebglMorph
        position="background"
        particleCount={7000}
        starCount={4000}
        colorScheme="neon"
        morphInterval={5000}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-black/10 via-black/40 to-black" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-md"
      >
        <Sparkles className="size-4 text-sky-300" />
        AI-powered app builder
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl"
      >
        Describe an app.
        <br />
        <span className="text-white/60">Watch it build itself.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-6 max-w-xl text-lg text-white/60"
      >
        A chatbot that writes real code into a live sandbox — landing pages,
        dashboards, small apps — with every step visible as it happens.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
        >
          Start building
          <ArrowRight className="size-4" />
        </Link>
        <Link
          to="/auth/Login"
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          Log in
        </Link>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 text-white/40"
      >
        <ChevronDown className="size-6" />
      </motion.div>
    </section>
  );
}

function Features() {
  return (
    <section className="relative bg-black px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for building, not waiting.
          </h2>
          <p className="mt-4 text-white/60">
            Every part of the loop — thinking, writing, running — happens where
            you can see it.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/3 p-6"
            >
              <feature.icon className="size-8 text-sky-300" />
              <h3 className="mt-4 text-lg font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-white/60">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// gsap ScrollTrigger owns this section's animation — the mockup card scrubs
// in and out with scroll position (not just "reveal once"), which is a
// different feel from the plain viewport-triggered reveals used elsewhere.
function ProductShowcase() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!sectionRef.current || !cardRef.current) return;

    const tween = gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 80, scale: 0.92, rotateX: 8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 30%",
          scrub: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-black px-6 py-28">
      <div className="mx-auto max-w-4xl text-center">
        <BrainCircuit className="mx-auto size-10 text-sky-300" />
        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          See it work, not just talk.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          The chat and the live preview sit side by side — the agent's own trace
          of reads, writes, and commands, right next to the app it's producing.
        </p>
      </div>

      <div
        ref={cardRef}
        className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-2xl backdrop-blur-md"
        style={{ perspective: "1000px" }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Cpu className="size-4 text-sky-300" />
          <span className="text-xs text-white/50">agent activity</span>
        </div>
        <div className="space-y-3 p-5 text-left text-sm">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-xl bg-white px-3 py-2 text-black">
              Build a pricing page with three tiers
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/60">
            <Rocket className="size-3.5" /> Writing src/pages/Pricing.tsx
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/60">
            <Rocket className="size-3.5" /> Running npm install
          </div>
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-xl bg-white/10 px-3 py-2 text-white/90">
              Done — three-tier pricing page is live in the preview.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative bg-black px-6 py-28 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to build something?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/60">
          No setup — describe what you want and get a live sandbox in seconds.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
        >
          Start building
          <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/40">
      Built with an AI agent, a live sandbox, and a lot of tool calls.
    </footer>
  );
}
