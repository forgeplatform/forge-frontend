import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PaginatedResponse, ActivityStreamEntry } from '@/api/types'

export interface UseActivityStreamParams {
  page?: number
  page_size?: number
}

export function useActivityStream(params: UseActivityStreamParams = {}) {
  const { page = 1, page_size = 25 } = params

  return useQuery<PaginatedResponse<ActivityStreamEntry>>({
    queryKey: ['activity_stream', { page, page_size }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ActivityStreamEntry>>(
        '/activity_stream/',
        { params: { page, page_size, order_by: '-timestamp' } },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}
