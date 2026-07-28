"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

export default function HeroHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <motion.h1
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-lg font-semibold tracking-tight"
        >
          Showcase
        </motion.h1>
        <motion.p
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-sm text-neutral-500 mt-0.5"
        >
          The best websites, all in one place.
        </motion.p>
      </div>
      <motion.form
        custom={2}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        action="/search"
        className="w-full sm:w-64"
      >
        <input
          name="q"
          placeholder="Search styles, industries…"
          className="w-full border border-neutral-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ink transition-shadow focus:shadow-[0_0_0_3px_rgba(17,17,17,0.08)]"
        />
      </motion.form>
    </div>
  );
}
