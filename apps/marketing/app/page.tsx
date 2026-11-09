import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { JobTypes } from "@/components/job-types";
import { HowItWorks } from "@/components/how-it-works";
import { Trust } from "@/components/trust";
import { EmployerPitch } from "@/components/employer-pitch";
import { SiteFooter } from "@/components/site-footer";
import { LAUNCH_GATE_ACTIVE } from "@/lib/launch-gate";
import ComingSoonPage from "@/app/coming-soon/page";

export default function Home() {
  if (LAUNCH_GATE_ACTIVE) return <ComingSoonPage />;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <JobTypes />
        <HowItWorks />
        <Trust />
        <EmployerPitch />
      </main>
      <SiteFooter />
    </>
  );
}
