import type { Metadata } from "next";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTM Interceptor | Manex AI",
  description:
    "AI-powered prospect discovery for Manex AI sales team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#fafafa] text-gray-900`}
        suppressHydrationWarning
      >
        <header className="glass sticky top-0 z-50 border-b border-gray-200/60">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="GTM Interceptor" width={32} height={32} className="rounded-lg shadow-md shadow-indigo-500/20" />
              <div className="flex items-baseline gap-2">
                <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                  GTM Interceptor
                </span>
                <span className="text-[11px] font-medium text-gray-400 tracking-wide">
                  by Manex AI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:block">AI-powered prospect discovery</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-ring" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
