"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

export default function HeroHeader() {
  return (
    <div className="glass glass-edge relative overflow-hidden rounded-[32px] px-6 sm:px-10 py-10 sm:py-14 mb-8 mt-2">
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <motion.h1
            custom={0}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="font-display italic font-normal text-4xl sm:text-5xl tracking-tight text-mist"
          >
            The best websites,
            <br />
            <span className="text-gradient-silver not-italic font-medium">all in one place.</span>
          </motion.h1>
          <motion.p
            custom={1}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="text-sm sm:text-[15px] text-mist-dim mt-3 max-w-sm"
          >
            A curated gallery of exceptional design, screenshotted, tagged, and sorted by an eye that never blinks.
          </motion.p>
        </div>

        <motion.form
          custom={2}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          action="/search"
          className="w-full sm:w-72 shrink-0"
        >
          <div className="glass-thin glass-edge rounded-full px-1.5 py-1 flex items-center focus-within:shadow-glow transition-shadow">
            <input
              name="q"
              placeholder="Search styles, industries…"
              className="w-full bg-transparent px-3.5 py-2 text-sm text-mist placeholder:text-mist-faint focus:outline-none"
            />
          </div>
        </motion.form>
      </div>
    </div>
  );
}
