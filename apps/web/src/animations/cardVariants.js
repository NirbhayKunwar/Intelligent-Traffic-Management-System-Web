// Card reveal and hover state variants for Framer Motion
export const cardContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const cardItemVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 1, 0.5, 1], // easeOutQuart
    },
  },
};

export const cardHoverVariants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.99,
  },
};
