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

/**
 * The platform exposes each unified-job subtype on its own REST collection; the
 * /unified_jobs/ list returns all of them together but there is no
 * /unified_jobs/{id}/ detail endpoint. So when a row is clicked in the
 * Jobs page we carry the `type` in the query string and map it here to
 * the right detail path. Unknown types fall back to `/jobs/` which is
 * what ordinary playbook runs use.
 */
export function endpointForJobType(type: string | null | undefined): string {
  switch (type) {
    case 'project_update':
      return 'project_updates'
    case 'inventory_update':
      return 'inventory_updates'
    case 'workflow_job':
      return 'workflow_jobs'
    case 'system_job':
      return 'system_jobs'
    case 'ad_hoc_command':
      return 'ad_hoc_commands'
    case 'job':
    default:
      return 'jobs'
  }
}

// Host summaries, relaunch and host_status_counts only apply to ordinary
// playbook runs (the `job` type). Other types have no hosts (project
// updates clone a git repo, system jobs run server-side maintenance,
// etc) so the caller should hide those UI affordances.
export function jobTypeHasHosts(type: string | null | undefined): boolean {
  return !type || type === 'job'
}

export function jobTypeCanRelaunch(type: string | null | undefined): boolean {
  return !type || type === 'job' || type === 'workflow_job'
}

export function useJobDetail(id: string, type?: string | null) {
  const base = endpointForJobType(type)
  return useQuery<JobDetail>({
    queryKey: ['job', base, id],
    queryFn: async () => {
      const { data } = await api.get<JobDetail>(`/${base}/${id}/`)
      return data
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isJobActive(status) ? 5000 : false
    },
  })
}

export function useJobStdout(id: string, enabled: boolean, type?: string | null) {
  const base = endpointForJobType(type)
  return useQuery<string>({
    queryKey: ['job-stdout', base, id],
    queryFn: async () => {
      const { data } = await api.get(`/${base}/${id}/stdout/?format=ansi`, {
        headers: { Accept: 'text/plain' },
        transformResponse: [(data: string) => data],
      })
      return data
    },
    enabled,
    refetchInterval: enabled ? 5000 : false,
  })
}

export function useJobHostSummaries(id: string, type?: string | null) {
  const enabled = jobTypeHasHosts(type)
  return useQuery<PaginatedResponse<JobHostSummary>>({
    queryKey: ['job-host-summaries', id],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<JobHostSummary>>(
        `/jobs/${id}/job_host_summaries/?page_size=200`,
      )
      return data
    },
    enabled,
  })
}

export function useCancelJob(id: string, type?: string | null) {
  const base = endpointForJobType(type)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`/${base}/${id}/cancel/`)
    },
    onSuccess: () => {
      toast.success('Job cancelled')
      queryClient.invalidateQueries({ queryKey: ['job', base, id] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useRelaunchJob(id: string, type?: string | null) {
  const base = endpointForJobType(type)
  return useMutation<{ id: number }>({
    mutationFn: async () => {
      const { data } = await api.post(`/${base}/${id}/relaunch/`)
      return data
    },
  })
}
