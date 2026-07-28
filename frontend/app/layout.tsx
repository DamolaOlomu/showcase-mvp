import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Showcase — The best websites, all in one place",
  description: "Discover exceptional website designs, curated and AI-tagged.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased font-sans">
        <SmoothScroll />
        <AuthProvider>
          <Navbar />
          <main>
            <PageTransition>{children}</PageTransition>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
