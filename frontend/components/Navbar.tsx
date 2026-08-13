"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import Avatar from "./Avatar";

const NAV_LINKS = [{ href: "/explore", label: "Explore" }];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8);
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    ...NAV_LINKS,
    ...(!loading && user ? [{ href: "/saved", label: "Saved" }] : []),
    ...(!loading && user?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="sticky top-0 z-50 px-3 sm:px-5 pt-3 sm:pt-4">
      <motion.header
        animate={{
          paddingTop: scrolled || menuOpen ? 8 : 12,
          paddingBottom: scrolled || menuOpen ? 8 : 12,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`glass glass-edge relative mx-auto max-w-6xl rounded-full px-5 sm:px-6 flex items-center justify-between transition-shadow duration-300 ${
          scrolled ? "shadow-glow/0" : ""
        }`}
      >
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-mist" />
            <span className="font-display italic text-[17px] tracking-tight text-mist">
              Showcase
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-mist-dim relative">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1.5 transition-colors ${active ? "text-mist" : "hover:text-mist"}`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-mist"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3.5 text-sm">
          <Link
            href="/submit"
            className="glass-thin glass-sweep px-3.5 sm:px-4 py-1.5 rounded-full hover:bg-white/50 active:scale-[0.97] transition text-xs sm:text-sm text-mist"
          >
            Submit
          </Link>

          {!loading && user ? (
            <Link href={`/designer/${user.username}`} className="hidden sm:flex items-center gap-1.5 hover:opacity-80 transition">
              <Avatar username={user.username} avatarUrl={user.avatar_url} size={22} />
              <span className="text-mist-dim">{user.username}</span>
            </Link>
          ) : (
            !loading && (
              <Link href="/login" className="hidden sm:inline text-mist-dim hover:text-mist transition">
                Sign in
              </Link>
            )
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8 shrink-0"
          >
            <motion.span
              animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }}
              className="block w-5 h-[1.5px] bg-mist rounded-full"
            />
            <motion.span
              animate={{ opacity: menuOpen ? 0 : 1 }}
              className="block w-5 h-[1.5px] bg-mist rounded-full"
            />
            <motion.span
              animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }}
              className="block w-5 h-[1.5px] bg-mist rounded-full"
            />
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="glass glass-edge md:hidden absolute top-full mt-2 left-0 right-0 rounded-3xl overflow-hidden"
            >
              <nav className="px-4 py-2 flex flex-col text-sm">
                {links.map((link) => {
                  const active = pathname === link.href || pathname?.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`py-2.5 border-b border-mist/10 last:border-0 ${
                        active ? "text-mist font-medium" : "text-mist-dim"
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
                      className="py-2.5 border-b border-mist/10 flex items-center gap-2 text-mist-dim"
                    >
                      <Avatar username={user.username} avatarUrl={user.avatar_url} size={20} />
                      {user.username}
                    </Link>
                    <Link href="/settings/profile" className="py-2.5 border-b border-mist/10 text-mist-dim">
                      Edit profile
                    </Link>
                    <button onClick={logout} className="py-2.5 text-left text-mist-faint">
                      Log out
                    </button>
                  </>
                ) : (
                  !loading && (
                    <Link href="/login" className="py-2.5 text-mist-dim">
                      Sign in
                    </Link>
                  )
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
