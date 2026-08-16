"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, Design } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import DesignCard from "./DesignCard";
import { fadeUp } from "@/lib/motion";

export default function RecommendedSection() {
  const { user, loading } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setFetching(false);
      return;
    }
    api
      .getRecommendedDesigns(6)
      .then(setDesigns)
      .catch(() => setDesigns([]))
      .finally(() => setFetching(false));
  }, [user, loading]);

  if (loading || fetching || !user || designs.length === 0) return null;

  return (
    <motion.section
      className="mb-8"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-15% 0px" }}
      variants={fadeUp}
    >
      <h2 className="text-xs font-mono font-medium tracking-widest uppercase text-mist-faint mb-3">Picked for you</h2>
      <motion.div className="columns-2 sm:columns-3 xl:columns-4 gap-3">
        {designs.map((d) => (
          <DesignCard key={d.id} design={d} />
        ))}
      </motion.div>
    </motion.section>
  );
}
