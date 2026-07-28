"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Design } from "@/lib/api";
import DesignCard from "./DesignCard";
import { gridContainer } from "@/lib/motion";

type Props = {
  category?: string;
  tag?: string;
  q?: string;
  emptyMessage?: string;
  pageSize?: number;
};

export default function DesignGrid({ category, tag, q, emptyMessage, pageSize = 24 }: Props) {
  const [items, setItems] = useState<Design[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const params: Record<string, string> = { page: String(pageNum), page_size: String(pageSize) };
      if (category) params.category = category;
      if (tag) params.tag = tag;
      if (q) params.q = q;
      return api.listDesigns(params);
    },
    [category, tag, q, pageSize]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    fetchPage(1).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setTotal(res.total);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function handleLoadMore() {
    setLoadingMore(true);
    const next = page + 1;
    const res = await fetchPage(next);
    setItems((prev) => [...prev, ...res.items]);
    setTotal(res.total);
    setPage(next);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 xl:columns-4 gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="mb-2.5 break-inside-avoid rounded-sm bg-neutral-100 aspect-[4/3]"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-neutral-500 text-sm">{emptyMessage || "No designs found."}</p>;
  }

  return (
    <div>
      <motion.div
        className="columns-2 sm:columns-3 xl:columns-4 gap-2.5"
        variants={gridContainer}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {items.map((d) => (
            <DesignCard key={d.id} design={d} />
          ))}
        </AnimatePresence>
      </motion.div>

      {items.length < total && (
        <div className="flex justify-center mt-6">
          <motion.button
            onClick={handleLoadMore}
            disabled={loadingMore}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 border border-neutral-300 rounded-full text-sm hover:border-ink transition disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : `Load more (${items.length} of ${total})`}
          </motion.button>
        </div>
      )}
    </div>
  );
}
