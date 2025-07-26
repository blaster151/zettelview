import * as React from "react"
import { cn } from "../../lib/utils"

export interface DropdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ className, trigger, children, isOpen = false, onToggle, ...props }, ref) => {
    const [internalIsOpen, setInternalIsOpen] = React.useState(false)
    const controlled = isOpen !== undefined
    const open = controlled ? isOpen : internalIsOpen

    const handleToggle = () => {
      const newState = !open
      if (!controlled) {
        setInternalIsOpen(newState)
      }
      onToggle?.(newState)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        if (!controlled) {
          setInternalIsOpen(false)
        }
        onToggle?.(false)
      }
    }

    React.useEffect(() => {
      if (open) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [open, handleClickOutside])

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        {...props}
      >
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
        {open && (
          <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[8rem]">
            {children}
          </div>
        )}
      </div>
    )
  }
)
Dropdown.displayName = "Dropdown"

export { Dropdown } 