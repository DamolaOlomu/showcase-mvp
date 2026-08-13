"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CategoryTabs({
  categories,
  active,
}: {
  categories: string[];
  active?: string;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8 text-sm border-b border-mist/10 pb-4 overflow-x-auto">
      <Link href="/explore" className="relative whitespace-nowrap pb-0.5">
        <span className={!active ? "text-mist font-medium" : "text-mist-dim hover:text-mist transition"}>
          All
        </span>
        {!active && (
          <motion.span
            layoutId="category-underline"
            className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-mist"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
      </Link>
      {categories.map((c) => (
        <Link
          key={c}
          href={`/explore?category=${encodeURIComponent(c)}`}
          className="relative whitespace-nowrap pb-0.5"
        >
          <span className={active === c ? "text-mist font-medium" : "text-mist-dim hover:text-mist transition"}>
            {c}
          </span>
          {active === c && (
            <motion.span
              layoutId="category-underline"
              className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-mist"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
        </Link>
      ))}
    </div>
  );
}
