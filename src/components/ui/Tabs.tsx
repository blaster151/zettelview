import * as React from "react"
import { cn } from "../../lib/utils"

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export interface TabProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '')
    const controlled = value !== undefined
    const currentValue = controlled ? value : internalValue

    const handleValueChange = (newValue: string) => {
      if (!controlled) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              value: currentValue,
              onValueChange: handleValueChange,
              ...(child.props as any)
            })
          }
          return child
        })}
      </div>
    )
  }
)
Tabs.displayName = "Tabs"

const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Tab.displayName = "Tab"

export { Tabs, Tab } 