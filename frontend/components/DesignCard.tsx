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
    <motion.div variants={cardReveal} className="break-inside-avoid mb-2.5">
      <Link href={`/design/${design.slug}`} className="group block">
        <motion.div
          layoutId={`design-photo-${design.id}`}
          className="relative overflow-hidden rounded-sm bg-neutral-100"
          whileHover="hover"
          initial="rest"
          animate="rest"
          whileTap={{ scale: 0.985 }}
          transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }}
        >
          {cover ? (
            <motion.div
              variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
              transition={springy}
              className="overflow-hidden"
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
            <div className="w-full aspect-[4/3] flex items-center justify-center text-neutral-400 text-sm">
              No preview
            </div>
          )}

          {shotCount > 1 && (
            <motion.span
              variants={{ rest: { opacity: 0.85 }, hover: { opacity: 1, scale: 1.05 } }}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] leading-none font-medium px-1.5 py-1 rounded-full min-w-[20px] text-center"
            >
              {shotCount}
            </motion.span>
          )}

          <motion.div
            className="absolute left-2 top-2"
            variants={{ rest: { opacity: 0.9, y: 0 }, hover: { opacity: 1, y: 0 } }}
          >
            <Avatar username={design.designer.username} avatarUrl={design.designer.avatar_url} size={26} ring />
          </motion.div>

          <motion.div
            variants={{
              rest: { opacity: 0, y: 10 },
              hover: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent px-3 pt-8 pb-2.5 flex items-end justify-between"
          >
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{design.title}</p>
              <p className="text-white/70 text-[11px] truncate">@{design.designer.username}</p>
            </div>
            <span className="text-white/90 text-[11px] shrink-0 ml-2 flex items-center gap-0.5">
              ♥ {design.like_count}
            </span>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
