
import { HTMLMotionProps } from "framer-motion";

type SpringAnimationProps = {
  whileHover?: any;
  whileTap?: any;
};

type FadeAnimationProps = {
  duration?: number;
  delay?: number;
};

export const useAnimations = () => {
  /**
   * Creates spring animation properties for buttons and interactive elements
   */
  const spring = (props: SpringAnimationProps = {}): HTMLMotionProps<"div"> => ({
    initial: { scale: 1 },
    whileHover: props.whileHover || { scale: 1.05 },
    whileTap: props.whileTap || { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  });

  /**
   * Creates fade in animation properties
   */
  const fadeIn = (props: FadeAnimationProps = {}): HTMLMotionProps<"div"> => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: props.duration || 0.3, 
      delay: props.delay || 0, 
      ease: "easeOut" 
    }
  });

  return {
    spring,
    fadeIn
  };
};
