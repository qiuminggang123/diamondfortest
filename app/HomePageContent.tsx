"use client";

import Image from "next/image";
import Header from "@/components/Header";
import StageWrapper from "@/components/StageWrapper";
import BeadLibrary from "@/components/BeadLibrary";
import Overlays from "@/components/Overlays";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStatus } from "@/lib/useAuthStatus";
import { useUIStore } from "@/lib/uiStore";

export default function HomePageContent() {
  const { currentDesignId, savedDesigns, setCurrentDesign } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuthStatus();
  const { setShowLogin, showToast } = useUIStore();

  useEffect(() => {
    // Check if URL parameters contain showLogin=1, if so automatically open login modal
    if (searchParams.get('showLogin') === '1' && !isLoggedIn) {
      setShowLogin(true);
      // Clear URL parameters to prevent repeated opening
      const urlWithoutParams = window.location.pathname;
      window.history.replaceState({}, document.title, urlWithoutParams);
    }
    
    // Check if URL parameters contain error, if so display error message
    const error = searchParams.get('error');
    if (error) {
      // Clear URL parameters to prevent repeated displaying errors
      const urlWithoutParams = window.location.pathname;
      window.history.replaceState({}, document.title, urlWithoutParams);
      
      // Display error message
      if (error === 'OAuthSignin') {
        showToast('Google login failed, please check your credentials configuration', 'error');
      }
    }
  }, [searchParams, isLoggedIn, setShowLogin, showToast]);


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