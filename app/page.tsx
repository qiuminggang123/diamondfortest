import Image from "next/image";
import Header from "@/components/Header";
import StageWrapper from "@/components/StageWrapper";
import BeadLibrary from "@/components/BeadLibrary";
import Overlays from "@/components/Overlays";

export default function Home() {
  return (
    <main className="flex flex-col h-[100dvh] bg-white overflow-hidden relative max-w-[768px] mx-auto shadow-2xl">
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
