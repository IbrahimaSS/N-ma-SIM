import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { Services } from "@/components/landing/Services";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SecurityAI } from "@/components/landing/SecurityAI";
import { Multilingual } from "@/components/landing/Multilingual";
import { KioskHardware } from "@/components/landing/KioskHardware";
import { Operators } from "@/components/landing/Operators";
import { DemoSection } from "@/components/landing/DemoSection";
import { AboutCtaFooter } from "@/components/landing/AboutCtaFooter";

export default function Decouvrir() {
  return (
    <main className="overflow-x-hidden">
      <LandingHeader />
      <Hero />
      <ProblemSolution />
      <Services />
      <HowItWorks />
      <SecurityAI />
      <Multilingual />
      <KioskHardware />
      <Operators />
      <DemoSection />
      <AboutCtaFooter />
    </main>
  );
}
