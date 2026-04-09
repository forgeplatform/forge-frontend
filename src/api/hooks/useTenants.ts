import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type {
  PaginatedResponse,
  Tenant,
  TenantProvisionPayload,
  TenantQuotaEvent,
  TenantQuotaKind,
  TenantQuotaDecision,
  Branding,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Tenants CRUD
// ---------------------------------------------------------------------------

export interface UseTenantsParams {
  page?: number
  page_size?: number
  search?: string
}

export function useTenants(params: UseTenantsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<Tenant>>({
    queryKey: ['tenants', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string
      const { data } = await api.get<PaginatedResponse<Tenant>>('/tenants/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useTenant(id: string | number | undefined) {
  return useQuery<Tenant>({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data } = await api.get<Tenant>(`/tenants/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TenantProvisionPayload) => {
      const { data } = await api.post<Tenant>('/tenants/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Tenant created')
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to create tenant')
    },
  })
}

export function useUpdateTenant(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Tenant>) => {
      const { data } = await api.patch<Tenant>(`/tenants/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Tenant updated')
      qc.invalidateQueries({ queryKey: ['tenants'] })
      qc.invalidateQueries({ queryKey: ['tenant', id] })
    },
    onError: () => toast.error('Failed to update tenant'),
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/tenants/${id}/?confirm=true`)
    },
    onSuccess: () => {
      toast.success('Tenant deleted')
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: () => toast.error('Failed to delete tenant'),
  })
}

export function useRecalculateTenant(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/tenants/${id}/recalculate/`)
      return data
    },
    onSuccess: () => {
      toast.success('Usage recalculated')
      qc.invalidateQueries({ queryKey: ['tenant', id] })
      qc.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: () => toast.error('Failed to recalculate usage'),
  })
}

// ---------------------------------------------------------------------------
// Tenant Quota Events
// ---------------------------------------------------------------------------

export interface UseTenantQuotaEventsParams {
  page?: number
  page_size?: number
  organization?: string | number
  quota_kind?: TenantQuotaKind | ''
  decision?: TenantQuotaDecision | ''
  since?: string
}

export function useTenantQuotaEvents(params: UseTenantQuotaEventsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<TenantQuotaEvent>>({
    queryKey: ['tenant_quota_events', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string | number
      const { data } = await api.get<PaginatedResponse<TenantQuotaEvent>>('/tenant_quota_events/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

// ---------------------------------------------------------------------------
// Public Branding (no auth)
// ---------------------------------------------------------------------------

export function useBranding(host: string | undefined) {
  return useQuery<Branding | null>({
    queryKey: ['branding', host],
    queryFn: async () => {
      try {
        const { data } = await axios.get<Branding>('/api/v2/branding/', {
          params: { host },
          withCredentials: false,
        })
        return data
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return null
        }
        throw err
      }
    },
    enabled: !!host,
  })
}
