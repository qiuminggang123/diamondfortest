import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalUI from "@/components/GlobalUI";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "养个珠子 - 手串定制",
  description: "定制属于你的独一无二的手串",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        suppressHydrationWarning
        className={`${inter.className} antialiased bg-gray-100`}
      >
        <GlobalUI />
        {children}
      </body>
    </html>
  );
}
