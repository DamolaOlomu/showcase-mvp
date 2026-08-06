"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
  });

  // Close the mobile menu on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    ...NAV_LINKS,
    ...(!loading && user ? [{ href: "/saved", label: "Saved" }] : []),
    ...(!loading && user?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <motion.header
      animate={{ height: scrolled || menuOpen ? 52 : 64 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`border-b sticky top-0 z-50 flex items-center transition-colors duration-300 ${
        scrolled || menuOpen ? "bg-paper/90 backdrop-blur border-neutral-200" : "bg-paper/60 backdrop-blur-sm border-transparent"
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

        <div className="flex items-center gap-3 sm:gap-4 text-sm">
          <Link
            href="/submit"
            className="px-3 sm:px-3.5 py-1.5 border border-neutral-300 rounded-full hover:border-ink hover:scale-[1.03] active:scale-[0.97] transition text-xs sm:text-sm"
          >
            Submit
          </Link>

          {!loading && user ? (
            <Link href={`/designer/${user.username}`} className="hidden sm:flex items-center gap-1.5 hover:opacity-70 transition">
              <Avatar username={user.username} avatarUrl={user.avatar_url} size={22} />
              <span className="text-neutral-700">{user.username}</span>
            </Link>
          ) : (
            !loading && (
              <Link href="/login" className="hidden sm:inline text-neutral-600 hover:text-ink transition">
                Sign in
              </Link>
            )
          )}

          {/* Mobile menu toggle — links + auth actions collapse under here below md */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8 shrink-0"
          >
            <motion.span
              animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }}
              className="block w-5 h-[1.5px] bg-ink rounded-full"
            />
            <motion.span
              animate={{ opacity: menuOpen ? 0 : 1 }}
              className="block w-5 h-[1.5px] bg-ink rounded-full"
            />
            <motion.span
              animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }}
              className="block w-5 h-[1.5px] bg-ink rounded-full"
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden absolute top-full left-0 right-0 bg-paper border-b border-neutral-200 shadow-sm"
          >
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col text-sm">
              {links.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-2.5 border-b border-neutral-100 last:border-0 ${
                      active ? "text-ink font-medium" : "text-neutral-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {!loading && user ? (
                <>
                  <Link
                    href={`/designer/${user.username}`}
                    className="py-2.5 border-b border-neutral-100 flex items-center gap-2 text-neutral-600"
                  >
                    <Avatar username={user.username} avatarUrl={user.avatar_url} size={20} />
                    {user.username}
                  </Link>
                  <Link href="/settings/profile" className="py-2.5 border-b border-neutral-100 text-neutral-600">
                    Edit profile
                  </Link>
                  <button onClick={logout} className="py-2.5 text-left text-neutral-400">
                    Log out
                  </button>
                </>
              ) : (
                !loading && (
                  <Link href="/login" className="py-2.5 text-neutral-600">
                    Sign in
                  </Link>
                )
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
