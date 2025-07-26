import * as React from "react"
import { cn } from "../../lib/utils"

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean
  onClose?: () => void
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen = false, onClose, children, ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/50" 
          onClick={onClose}
        />
        <div
          ref={ref}
          className={cn(
            "relative z-50 w-full max-w-md rounded-lg bg-background p-6 shadow-lg",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)
Modal.displayName = "Modal"

export { Modal } 