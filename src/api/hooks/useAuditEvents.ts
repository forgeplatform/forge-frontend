import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PaginatedResponse, AuditEvent } from '@/api/types'

export interface UseAuditEventsParams {
  page?: number
  page_size?: number
  category?: string
  severity?: string
  action?: string
  actor__username?: string
  resource_type?: string
  timestamp__gte?: string
  timestamp__lte?: string
}

export function useAuditEvents(params: UseAuditEventsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params

  return useQuery<PaginatedResponse<AuditEvent>>({
    queryKey: ['audit_events', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<AuditEvent>>(
        '/audit_events/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useAuditEventsCsvUrl(filters: Omit<UseAuditEventsParams, 'page' | 'page_size'> = {}) {
  const params = new URLSearchParams({ format: 'csv' })
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  return `/api/v2/audit_events/?${params.toString()}`
}
