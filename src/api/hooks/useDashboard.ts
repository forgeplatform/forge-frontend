import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  DashboardResponse,
  DashboardJobGraphResponse,
  PaginatedResponse,
  UnifiedJob,
} from '@/api/types'

export interface JobGraphPoint {
  date: string
  successful: number
  failed: number
}

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardResponse>('/dashboard/')
      return data
    },
  })
}

export function useRecentJobs(pageSize = 7) {
  return useQuery<PaginatedResponse<UnifiedJob>>({
    queryKey: ['recent-jobs', pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<UnifiedJob>>(
        '/unified_jobs/',
        { params: { order_by: '-finished', page_size: pageSize } },
      )
      return data
    },
  })
}

export function useJobGraph(period = 'month', job_type = 'all') {
  return useQuery<JobGraphPoint[]>({
    queryKey: ['job-graph', period, job_type],
    queryFn: async () => {
      const { data } = await api.get<DashboardJobGraphResponse>(
        '/dashboard/graphs/jobs/',
        { params: { period, job_type } },
      )
      // API returns {jobs: {successful: [[ts, count], ...], failed: [[ts, count], ...]}}
      // Transform to [{date, successful, failed}, ...]
      const successMap = new Map(
        data.jobs.successful.map(([ts, count]) => [ts, count]),
      )
      const failedMap = new Map(
        data.jobs.failed.map(([ts, count]) => [ts, count]),
      )
      const allTimestamps = [
        ...new Set([...successMap.keys(), ...failedMap.keys()]),
      ].sort()
      return allTimestamps.map((ts) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        successful: successMap.get(ts) ?? 0,
        failed: failedMap.get(ts) ?? 0,
      }))
    },
  })
}
