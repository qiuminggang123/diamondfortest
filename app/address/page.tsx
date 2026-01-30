"use client";
import { useAuthStatus } from "@/lib/useAuthStatus";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AddressManager from "@/components/AddressManager";

export default function AddressPage() {
  const { status, isLoggedIn } = useAuthStatus();
  const router = useRouter();
  useEffect(() => {
    console.log('address page loaded', { isLoggedIn, status });
    if (status === "unauthenticated") {
      // 跳转到首页并加上参数以弹出登录框
      router.push('/?showLogin=1');
    }
  }, [status, router]);
  if (status === "loading") return <div className="p-8 text-center">加载中...</div>;
  if (!isLoggedIn) return null;
  return <AddressManager userEmail={""} />;
}