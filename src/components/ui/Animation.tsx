
import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variant, TargetAndTransition } from 'framer-motion';

// Define types for our animation variants
interface AnimationVariants {
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
}

// Type for custom animation objects
type CustomAnimationObject = Record<string, any>;

// Props interface for our Animation component
interface AnimationProps {
  animation: "fadeIn" | "slideIn" | "zoomIn" | "bounce" | "custom" | CustomAnimationObject;
  duration?: number;
  delay?: number;
  triggerOnce?: boolean;
  className?: string;
  iterationCount?: string | number;
  children: ReactNode;
  stagger?: number;
  customVariants?: AnimationVariants;
}

export const Animation: React.FC<AnimationProps> = ({
  animation,
  duration = 0.5,
  delay = 0,
  triggerOnce = false,
  className = '',
  iterationCount = 1,
  children,
  stagger = 0,
  customVariants
}) => {
  // Define preset animation variants
  const presetVariants = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration, delay } },
      exit: { opacity: 0, transition: { duration } }
    },
    slideIn: {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1, transition: { duration, delay } },
      exit: { x: 100, opacity: 0, transition: { duration } }
    },
    zoomIn: {
      initial: { scale: 0.7, opacity: 0 },
      animate: { scale: 1, opacity: 1, transition: { duration, delay } },
      exit: { scale: 0.7, opacity: 0, transition: { duration } }
    },
    bounce: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { 
        scale: 1, 
        opacity: 1, 
        transition: { 
          duration, 
          delay,
          type: "spring", 
          stiffness: 300,
          damping: 10
        } 
      },
      exit: { scale: 0.9, opacity: 0, transition: { duration } }
    },
    custom: customVariants || {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  };

  // Determine if using a preset or custom animation
  const isPreset = typeof animation === 'string';
  
  // Set up the animation variant to use
  let selectedVariant: AnimationVariants;
  
  if (isPreset && presetVariants[animation as keyof typeof presetVariants]) {
    // Use a preset animation
    selectedVariant = presetVariants[animation as keyof typeof presetVariants];
  } else if (!isPreset) {
    // Use a custom animation object
    const customAnimation = animation as CustomAnimationObject;
    
    // Create a variant with the custom animation
    selectedVariant = {
      initial: { opacity: 0 },
      animate: customAnimation,
      exit: { opacity: 0 }
    };
  } else {
    // Fallback to fadeIn
    selectedVariant = presetVariants.fadeIn;
  }
  
  // Handle staggered children if stagger prop is provided
  const childrenArray = React.Children.toArray(children);
  const staggeredChildren = stagger > 0 && childrenArray.length > 1
    ? childrenArray.map((child, i) => (
        <motion.div
          key={i}
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedVariant.exit}
          transition={{
            ...((selectedVariant.animate as any)?.transition || {}),
            delay: delay + (stagger * i)
          }}
        >
          {child}
        </motion.div>
      ))
    : children;

  return (
    <AnimatePresence>
      <motion.div 
        className={className}
        initial={stagger > 0 ? undefined : selectedVariant.initial}
        animate={stagger > 0 ? undefined : selectedVariant.animate}
        exit={stagger > 0 ? undefined : selectedVariant.exit}
        transition={
          stagger > 0 
            ? undefined 
            : {
                repeat: iterationCount === 'infinite' ? Infinity : Number(iterationCount) - 1,
                repeatType: "reverse"
              }
        }
      >
        {staggeredChildren}
      </motion.div>
    </AnimatePresence>
  );
};
