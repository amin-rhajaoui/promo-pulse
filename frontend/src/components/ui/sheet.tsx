import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

function Sheet({ open, onClose, children }: SheetProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-background shadow-lg border-l",
          "transform transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="h-full overflow-y-auto p-6">{children}</div>
      </div>
    </>
  )
}

export { Sheet }
