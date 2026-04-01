import * as React from "react"
import { cn } from "@/lib/utils"

const progressBarVariants: Record<string, string> = {
  default: "bg-primary",
  running: "bg-primary",
  completed: "bg-emerald-500",
  failed: "bg-destructive",
  cancelled: "bg-amber-500",
}

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  variant?: keyof typeof progressBarVariants
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-300", progressBarVariants[variant] ?? progressBarVariants.default)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
