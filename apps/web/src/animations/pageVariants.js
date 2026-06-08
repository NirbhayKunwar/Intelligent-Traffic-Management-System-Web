// Centralized page transition variants for Framer Motion
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: [0.7, 0, 0.84, 0], // easeInExpo
    },
  },
};

export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
};
