"use client";

import Image from "next/image";
import Header from "@/components/Header";
import StageWrapper from "@/components/StageWrapper";
import BeadLibrary from "@/components/BeadLibrary";
import Overlays from "@/components/Overlays";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function Home() {
  const { currentDesignId, savedDesigns, setCurrentDesign } = useStore();
  const router = useRouter();



  return (
    <main className="flex flex-col h-dvh bg-white overflow-hidden relative shadow-2xl">
      <Header />
      {/* Visual Stage Area */}
      <section className="flex-none relative mt-14 z-0">
        <StageWrapper />
        <Overlays />
      </section>
      {/* Bead Library / Controls */}
      <section className="flex-1 min-h-0 z-10 bg-white relative rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 overflow-hidden">
        <BeadLibrary />
      </section>
    </main>
  );
}
