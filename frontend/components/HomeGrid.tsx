"use client";

import { motion } from "framer-motion";
import { Design } from "@/lib/api";
import DesignCard from "./DesignCard";
import { gridContainer } from "@/lib/motion";

export default function HomeGrid({ items }: { items: Design[] }) {
  return (
    <motion.div
      className="columns-2 sm:columns-3 xl:columns-4 gap-3"
      variants={gridContainer}
      initial="hidden"
      animate="show"
    >
      {items.map((d) => (
        <DesignCard key={d.id} design={d} />
      ))}
    </motion.div>
  );
}
