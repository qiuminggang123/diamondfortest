"use client";
import { SessionProvider } from "next-auth/react";
import { useAutoLogin } from "@/lib/useAutoLogin";

function AutoLoginHandler() {
  useAutoLogin();
  return null;
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AutoLoginHandler />
      {children}
    </SessionProvider>
  );
}