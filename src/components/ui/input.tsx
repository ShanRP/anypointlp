
import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startContent?: React.ReactNode
  endContent?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startContent, endContent, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {startContent && <div className="absolute left-3 flex items-center pointer-events-none">{startContent}</div>}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            startContent && "pl-10",
            endContent && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {endContent && <div className="absolute right-3 flex items-center">{endContent}</div>}
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }
