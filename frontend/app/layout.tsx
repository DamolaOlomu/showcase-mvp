import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { BackdropProvider } from "@/lib/backdrop-context";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";
import MirrorBackdrop from "@/components/MirrorBackdrop";
import LiquidCursor from "@/components/LiquidCursor";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const meta = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-meta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Showcase — The best websites, all in one place",
  description: "Discover exceptional website designs, curated and AI-tagged.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${meta.variable}`}>
      <body className="min-h-screen antialiased font-sans bg-void text-mist">
        <BackdropProvider>
          <MirrorBackdrop />
          <LiquidCursor />
          <SmoothScroll />
          <AuthProvider>
            <div className="relative z-10">
              <Navbar />
              <main>
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </AuthProvider>
        </BackdropProvider>
      </body>
    </html>
  );
}
