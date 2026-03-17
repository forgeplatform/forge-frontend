import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { PaginatedResponse, UnifiedJob } from '@/api/types'

export interface UseJobsParams {
  page?: number
  page_size?: number
  order_by?: string
  status?: string
  search?: string
}

export function useJobs(params: UseJobsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = '-finished',
    status,
    search,
  } = params

  return useQuery<PaginatedResponse<UnifiedJob>>({
    queryKey: ['jobs', { page, page_size, order_by, status, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (status) queryParams.status = status
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<UnifiedJob>>(
        '/unified_jobs/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}
