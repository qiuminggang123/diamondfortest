"use client";
import { useAuthStatus } from "@/lib/useAuthStatus";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AddressManager from "@/components/AddressManager";
import Header from "@/components/Header"; // 导入Header组件

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
  return (
    <main className="min-h-screen bg-gray-50 pt-14"> {/* 添加pt-14为Header留出空间 */}
      <Header /> {/* 添加Header组件 */}
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Address Management</h1> {/* Add title */}
        <AddressManager userEmail={""} />
      </div>
    </main>
  );
}