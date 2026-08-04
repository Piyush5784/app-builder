import { ParticleMorph } from "@/components/custom/particle-morph/particle-morph";

/**
 * Example: a full-bleed AI-product hero using ParticleMorph as the
 * centerpiece, auto-morphing through shapes with mouse repulsion enabled.
 */
export default function ExampleHero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center">
      <ParticleMorph
        width={500}
        height={500}
        particleCount={10000}
        particleSize={1}
        particleColor="blue"
        shape="sphere"
        autoMorph
        morphDuration={2000}
        rotation
        rotationSpeed={0.5}
        glow
        className="rounded-3xl"
      />
      {/* <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-white">
          Intelligence, in motion.
        </h1>
        <p className="mt-4 max-w-md text-white/60">
          A living particle field that never stops moving.
        </p>
      </div> */}
    </section>
  );
}
