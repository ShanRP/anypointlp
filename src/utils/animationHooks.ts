
import { useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * Custom hook for fade-in animations
 */
export const useFadeIn = () => {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };
};

/**
 * Custom hook for animating elements with framer-motion
 */
export const useAnimate = () => {
  const ref = useRef(null);
  const controls = useAnimation();

  return { 
    ref, 
    animate: controls, 
    start: (vars: any) => controls.start(vars)
  };
};
