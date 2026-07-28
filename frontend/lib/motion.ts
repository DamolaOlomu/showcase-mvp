import { Variants, Transition } from "framer-motion";

// Shared easing — a soft "expo out" feel, matching the snappy-but-smooth
// reveals seen on heavily-animated design-inspiration sites.
export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

export const springy: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

export const gridContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.03,
    },
  },
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easeOut },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut, delay: i * 0.06 },
  }),
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.25, ease: easeOut },
  },
};
