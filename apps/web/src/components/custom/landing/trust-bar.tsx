import { Reveal } from "./shared";

const TECHNOLOGIES = [
  "React",
  "Next.js",
  "Vite",
  "Node.js",
  "PostgreSQL",
  "Tailwind CSS",
  "GitHub",
];

export function TrustBar() {
  return (
    <section className="border-t border-border px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Built for the technologies developers already use
          </p>
        </Reveal>
        <Reveal
          delay={0.1}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {TECHNOLOGIES.map((tech) => (
            <span
              key={tech}
              className="font-mono text-sm text-muted-foreground transition-colors hover:text-foreground/70"
            >
              {tech}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
