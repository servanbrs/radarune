import Navbar from "@/components/layout/Navbar";

import Hero from "@/components/landing/Hero";
import Logos from "@/components/landing/Logos";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";

export default function Home() {
  return (
    <main className="bg-[#050505] text-white">

      <Navbar />

      <Hero />

      <Logos />

      <Features />

      <HowItWorks />

    </main>
  );
}