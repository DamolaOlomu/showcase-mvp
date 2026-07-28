"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Avatar from "./Avatar";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
  });

  const links = [
    ...NAV_LINKS,
    ...(!loading && user ? [{ href: "/saved", label: "Saved" }] : []),
    ...(!loading && user?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <motion.header
      animate={{ height: scrolled ? 52 : 64 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`border-b sticky top-0 z-50 flex items-center transition-colors duration-300 ${
        scrolled ? "bg-paper/90 backdrop-blur border-neutral-200" : "bg-paper/60 backdrop-blur-sm border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Showcase
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-neutral-500 relative">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1.5 transition-colors ${active ? "text-ink" : "hover:text-ink"}`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-ink rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/submit"
            className="px-3.5 py-1.5 border border-neutral-300 rounded-full hover:border-ink hover:scale-[1.03] active:scale-[0.97] transition"
          >
            Submit
          </Link>

          {!loading && user ? (
            <>
              <Link href={`/designer/${user.username}`} className="flex items-center gap-1.5 hover:opacity-70 transition">
                <Avatar username={user.username} avatarUrl={user.avatar_url} size={22} />
                <span className="hidden sm:inline text-neutral-700">{user.username}</span>
              </Link>
              <button onClick={logout} className="text-neutral-400 hover:text-ink transition">
                Log out
              </button>
            </>
          ) : (
            !loading && (
              <Link href="/login" className="text-neutral-600 hover:text-ink transition">
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </motion.header>
  );
}
