"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Design } from "@/lib/api";
import Avatar from "./Avatar";
import { cardReveal, springy } from "@/lib/motion";

export default function DesignCard({ design }: { design: Design }) {
  const cover =
    design.images.find((i) => i.type === "desktop")?.thumbnail_url ||
    design.images.find((i) => i.type === "desktop")?.original_url ||
    design.images[0]?.original_url;

  const shotCount = design.images.length;

  return (
    <motion.div variants={cardReveal} className="break-inside-avoid mb-3">
      <Link href={`/design/${design.slug}`} className="group block">
        <motion.div
          layoutId={`design-photo-${design.id}`}
          className="glass card-frame glass-edge-soft glass-sweep relative overflow-hidden rounded-[22px] p-1"
          whileHover="hover"
          initial="rest"
          animate="rest"
          whileTap={{ scale: 0.985 }}
          transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
        >
          {cover ? (
            <motion.div
              variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
              transition={springy}
              className="overflow-hidden rounded-[16px] relative z-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={design.title}
                loading="lazy"
                className="w-full h-auto object-cover block"
              />
            </motion.div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-[16px] flex items-center justify-center text-mist-faint text-sm bg-black/5">
              No preview
            </div>
          )}

          {shotCount > 1 && (
            <motion.span
              variants={{ rest: { opacity: 0.9 }, hover: { opacity: 1, scale: 1.05 } }}
              className="glass-thin absolute top-3.5 right-3.5 z-10 text-mist text-[11px] leading-none font-mono px-1.5 py-1 rounded-full min-w-[22px] text-center"
            >
              {shotCount}
            </motion.span>
          )}

          <motion.div
            className="absolute left-3.5 top-3.5 z-10"
            variants={{ rest: { opacity: 0.95, y: 0 }, hover: { opacity: 1, y: 0 } }}
          >
            <Avatar username={design.designer.username} avatarUrl={design.designer.avatar_url} size={26} ring />
          </motion.div>

          <motion.div
            variants={{
              rest: { opacity: 0, y: 10 },
              hover: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="glass-thin absolute inset-x-1.5 bottom-1.5 rounded-[16px] px-3 py-2.5 flex items-end justify-between z-10"
          >
            <div className="min-w-0">
              <p className="text-mist text-xs font-medium truncate">{design.title}</p>
              <p className="text-mist-dim text-[11px] truncate">@{design.designer.username}</p>
            </div>
            <span className="text-mist text-[11px] font-mono shrink-0 ml-2 flex items-center gap-1">
              <span className="text-mist-dim">♥</span> {design.like_count}
            </span>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
