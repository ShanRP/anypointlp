
import { useEffect, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber = ({ value, suffix = "", className = "" }: AnimatedNumberProps) => {
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    if (!hasAnimated) {
      const controls = animate(count, value, {
        duration: 2,
        onUpdate: (latest) => {
          setDisplayValue(Math.floor(latest));
        },
        onComplete: () => {
          setHasAnimated(true);
        }
      });

      return controls.stop;
    }
  }, [count, value, hasAnimated]);

  return (
    <motion.span 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {displayValue}
      {suffix}
    </motion.span>
  );
};

export default AnimatedNumber;
