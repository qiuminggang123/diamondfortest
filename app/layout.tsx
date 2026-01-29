import type { Metadata } from "next";
import { Inter, Cinzel, Anton } from "next/font/google"; // Import Anton
import "./globals.css";
import GlobalUI from "@/components/GlobalUI";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-cinzel" }); 
const anton = Anton({ subsets: ["latin"], weight: ["400"], variable: "--font-anton" }); // Configure Anton

export const metadata: Metadata = {
  title: "AURA LOOP - 手串定制",
  description: "定制属于你的独一无二的手串",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const SessionProviderWrapper = require("@/components/SessionProviderWrapper").default;
  return (
    <html lang="zh-CN">
      <body
        suppressHydrationWarning
        className={`${inter.className} ${cinzel.variable} ${anton.variable} antialiased bg-gray-100`}
      >
        <SessionProviderWrapper>
          <GlobalUI />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
