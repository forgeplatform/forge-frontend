import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type {
  JobDetail,
  JobHostSummary,
  PaginatedResponse,
} from '@/api/types'

const ACTIVE_STATUSES = ['pending', 'waiting', 'running', 'new']

export function isJobActive(status: string): boolean {
  return ACTIVE_STATUSES.includes(status)
}

export function useJobDetail(id: string) {
  return useQuery<JobDetail>({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get<JobDetail>(`/jobs/${id}/`)
      return data
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isJobActive(status) ? 5000 : false
    },
  })
}

export function useJobStdout(id: string, enabled: boolean) {
  return useQuery<string>({
    queryKey: ['job-stdout', id],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${id}/stdout/?format=ansi`, {
        headers: { Accept: 'text/plain' },
        transformResponse: [(data: string) => data],
      })
      return data
    },
    enabled,
    refetchInterval: enabled ? 5000 : false,
  })
}

export function useJobHostSummaries(id: string) {
  return useQuery<PaginatedResponse<JobHostSummary>>({
    queryKey: ['job-host-summaries', id],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<JobHostSummary>>(
        `/jobs/${id}/job_host_summaries/?page_size=200`,
      )
      return data
    },
  })
}

export function useCancelJob(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/jobs/${id}/cancel/`)
    },
    onSuccess: () => {
      toast.success('Job cancelled')
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useRelaunchJob(id: string) {
  return useMutation<{ id: number }>({
    mutationFn: async () => {
      const { data } = await api.post(`/jobs/${id}/relaunch/`)
      return data
    },
  })
}
