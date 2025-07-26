import * as React from "react"
import { cn } from "../../lib/utils"

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string
}

const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ className, name, children, ...props }, ref) => {
    return (
      <span
        className={cn("inline-flex items-center justify-center", className)}
        ref={ref}
        {...props}
      >
        {children || name}
      </span>
    )
  }
)
Icon.displayName = "Icon"

export { Icon } 