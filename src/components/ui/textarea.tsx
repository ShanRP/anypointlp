
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  focused?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, focused, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <motion.div
            className="relative w-full"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
                isFocused || focused ? "shadow-md border-blue-300" : "shadow-sm",
                className
              )}
              ref={ref}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...props}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
