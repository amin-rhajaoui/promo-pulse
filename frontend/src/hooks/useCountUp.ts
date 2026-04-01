import { useEffect, useState } from "react"

const DURATION_MS = 700

export function useCountUp(value: number, enabled: boolean): number {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!enabled || value === 0) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    let startVal = display
    const diff = value - startVal

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / DURATION_MS, 1)
      const eased = 1 - (1 - progress) ** 2
      const next = Math.round(startVal + diff * eased)
      setDisplay(next)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, enabled])

  return display
}
