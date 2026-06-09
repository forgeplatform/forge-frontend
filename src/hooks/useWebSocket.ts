import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface JobStatusEvent {
  unified_job_id: number
  status: string
  type: string
  started?: string
  finished?: string
  unified_job_template_id?: number
  group_name: string
}

interface SubscriptionMessage {
  groups_current?: string[]
  groups_left?: string[]
  groups_joined?: string[]
}

type WSMessage = JobStatusEvent | SubscriptionMessage

function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match?.[1] ?? ''
}

function getWebSocketUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/websocket/`
}

/**
 * Connects to Forail WebSocket for real-time job status updates.
 * Automatically invalidates React Query caches when jobs change status.
 *
 * @param enabled - Whether the WebSocket should be connected
 * @param jobIds - Optional array of specific job IDs to subscribe to for event streams
 */
export function useWebSocket(enabled = true, jobIds?: number[]) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const reconnectDelay = useRef(1000)

  const subscribe = useCallback((ws: WebSocket) => {
    const groups: Record<string, string[] | number[]> = {
      jobs: ['status_changed'],
      schedules: ['changed'],
    }

    if (jobIds?.length) {
      groups.job_events = jobIds
    }

    ws.send(JSON.stringify({
      xrftoken: getCsrfToken(),
      groups,
    }))
  }, [jobIds])

  const handleMessage = useCallback((event: MessageEvent) => {
    let data: WSMessage
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }

    // Skip subscription acknowledgments
    if ('groups_current' in data) return

    const msg = data as JobStatusEvent
    if (msg.group_name === 'jobs' && msg.unified_job_id) {
      // Invalidate job-related queries
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', String(msg.unified_job_id)] })
      queryClient.invalidateQueries({ queryKey: ['job-stdout', String(msg.unified_job_id)] })
      queryClient.invalidateQueries({ queryKey: ['job-host-summaries', String(msg.unified_job_id)] })

      // Also refresh dashboard and template data
      if (msg.status === 'successful' || msg.status === 'failed' || msg.status === 'error' || msg.status === 'canceled') {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard_jobs_graph'] })
        if (msg.unified_job_template_id) {
          queryClient.invalidateQueries({ queryKey: ['job_template', String(msg.unified_job_template_id)] })
          queryClient.invalidateQueries({ queryKey: ['job_templates'] })
        }
      }
    }

    if (msg.group_name === 'job_events' && msg.unified_job_id) {
      queryClient.invalidateQueries({ queryKey: ['job-stdout', String(msg.unified_job_id)] })
      queryClient.invalidateQueries({ queryKey: ['job-host-summaries', String(msg.unified_job_id)] })
    }

    if (msg.group_name === 'schedules') {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    }
  }, [queryClient])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(getWebSocketUrl())

    ws.onopen = () => {
      reconnectDelay.current = 1000
      subscribe(ws)
    }

    ws.onmessage = handleMessage

    ws.onclose = () => {
      wsRef.current = null
      if (enabled) {
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000)
          connect()
        }, reconnectDelay.current)
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [enabled, subscribe, handleMessage])

  useEffect(() => {
    if (!enabled) return

    connect()

    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [enabled, connect])

  // Re-subscribe when jobIds change
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribe(wsRef.current)
    }
  }, [jobIds, subscribe])
}
