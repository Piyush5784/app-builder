import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { Reveal, Section } from "./shared";

export function FinalCta() {
  return (
    <Section className="text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,color-mix(in_oklch,var(--color-foreground),transparent_94%),transparent)]" />
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          What will you build?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-balance text-muted-foreground">
          Turn an idea into a working application with your AI software
          engineer.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Start building for free
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#templates"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/5"
          >
            <Compass className="size-4" />
            Explore examples
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
