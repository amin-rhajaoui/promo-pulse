import { useEffect, useRef, useState, useCallback } from "react"
import type { ScrapeProgress } from "./types"

export function useWebSocket(runId: string | null) {
  const [progress, setProgress] = useState<ScrapeProgress | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const connect = useCallback(() => {
    if (!runId) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/${runId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as ScrapeProgress
      setProgress(data)
    }

    ws.onclose = () => {
      setConnected(false)
      // Reconnect after 2s if still active
      reconnectTimer.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => ws.close()
  }, [runId])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { progress, connected }
}
