import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

function Sheet({ open, onClose, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-background shadow-xl border-l",
              "flex flex-col"
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-lg p-2 opacity-70 hover:opacity-100 hover:bg-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="h-full overflow-y-auto p-6 pt-14">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { Sheet }
