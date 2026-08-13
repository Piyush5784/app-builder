import { createFileRoute } from "@tanstack/react-router";
import SplashCursor from "@package/ui/components/SplashCursor";
import { Navbar } from "@/components/custom/landing/navbar";
import { Hero } from "@/components/custom/landing/hero";
import { TrustBar } from "@/components/custom/landing/trust-bar";
import { LiveDemo } from "@/components/custom/landing/live-demo";
import { HowItWorks } from "@/components/custom/landing/how-it-works";
import { SandboxSection } from "@/components/custom/landing/sandbox";
import { Capabilities } from "@/components/custom/landing/capabilities";
import { ErrorFixShowcase } from "@/components/custom/landing/error-fix";
import { Lifecycle } from "@/components/custom/landing/lifecycle";
import { Templates } from "@/components/custom/landing/templates";
import { Gallery } from "@/components/custom/landing/gallery";
import { GithubSection } from "@/components/custom/landing/github";
import { Deployment } from "@/components/custom/landing/deployment";
import { Security } from "@/components/custom/landing/security";
import { Pricing } from "@/components/custom/landing/pricing";
import { Faq } from "@/components/custom/landing/faq";
import { FinalCta } from "@/components/custom/landing/final-cta";
import { Footer } from "@/components/custom/landing/footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="bg-background text-foreground">
      <SplashCursor
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={0.5}
        PRESSURE={0}
        CURL={3}
        SPLAT_RADIUS={0.01}
        SPLAT_FORCE={3000}
        COLOR_UPDATE_SPEED={10}
        SHADING
        RAINBOW_MODE={false}
        COLOR="#ffffff"
      />
      <Navbar />
      <Hero />
      <TrustBar />
      <LiveDemo />
      <HowItWorks />
      <SandboxSection />
      <Capabilities />
      <ErrorFixShowcase />
      <Lifecycle />
      <Templates />
      <Gallery />
      <GithubSection />
      <Deployment />
      <Security />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
