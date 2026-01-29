"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AddressManager from "@/components/AddressManager";

export default function AddressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    console.log('address page loaded', { session, status });
    if (status === "unauthenticated") router.replace("/");
  }, [status, router, session]);
  if (status === "loading") return <div className="p-8 text-center">加载中...</div>;
  if (!session) return null;
  return <AddressManager userEmail={session.user?.email || ""} />;
}
