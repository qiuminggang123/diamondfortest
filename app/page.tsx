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

export default function Home() {
  const { currentDesignId, savedDesigns, setCurrentDesign } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuthStatus();
  const { setShowLogin, showToast } = useUIStore();

  useEffect(() => {
    // 检查URL参数中是否有showLogin=1，如果有则自动打开登录框
    if (searchParams.get('showLogin') === '1' && !isLoggedIn) {
      setShowLogin(true);
      // 清除URL参数，防止重复打开
      const urlWithoutParams = window.location.pathname;
      window.history.replaceState({}, document.title, urlWithoutParams);
    }
    
    // 检查URL参数中是否有error，如果有则显示错误信息
    const error = searchParams.get('error');
    if (error) {
      // 清除URL参数，防止重复显示错误
      const urlWithoutParams = window.location.pathname;
      window.history.replaceState({}, document.title, urlWithoutParams);
      
      // 显示错误信息
      if (error === 'OAuthSignin') {
        showToast('Google登录失败，请检查您的凭据配置', 'error');
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