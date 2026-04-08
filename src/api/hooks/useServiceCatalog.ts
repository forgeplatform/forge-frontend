import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type {
  PaginatedResponse,
  ServiceCatalogItem,
  ServiceCatalogItemLaunchData,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestSubmitPayload,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Catalog items
// ---------------------------------------------------------------------------

export interface UseServiceCatalogItemsParams {
  page?: number
  page_size?: number
  category?: string
  enabled?: string
  organization?: string | number
  search?: string
}

export function useServiceCatalogItems(params: UseServiceCatalogItemsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params
  return useQuery<PaginatedResponse<ServiceCatalogItem>>({
    queryKey: ['service_catalog_items', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') queryParams[k] = v as string
      const { data } = await api.get<PaginatedResponse<ServiceCatalogItem>>('/service_catalog_items/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useServiceCatalogItem(id: string | number | undefined) {
  return useQuery<ServiceCatalogItem>({
    queryKey: ['service_catalog_item', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceCatalogItem>(`/service_catalog_items/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useServiceCatalogItemLaunchData(id: string | number | undefined) {
  return useQuery<ServiceCatalogItemLaunchData>({
    queryKey: ['service_catalog_item_launch_data', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceCatalogItemLaunchData>(`/service_catalog_items/${id}/launch_data/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateServiceCatalogItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<ServiceCatalogItem>) => {
      const { data } = await api.post<ServiceCatalogItem>('/service_catalog_items/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Catalog item created')
      qc.invalidateQueries({ queryKey: ['service_catalog_items'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to create catalog item')
    },
  })
}

export function useUpdateServiceCatalogItem(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<ServiceCatalogItem>) => {
      const { data } = await api.patch<ServiceCatalogItem>(`/service_catalog_items/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Catalog item updated')
      qc.invalidateQueries({ queryKey: ['service_catalog_items'] })
      qc.invalidateQueries({ queryKey: ['service_catalog_item', id] })
    },
    onError: () => toast.error('Failed to update catalog item'),
  })
}

export function useDeleteServiceCatalogItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/service_catalog_items/${id}/`)
    },
    onSuccess: () => {
      toast.success('Catalog item deleted')
      qc.invalidateQueries({ queryKey: ['service_catalog_items'] })
    },
    onError: () => toast.error('Failed to delete catalog item'),
  })
}

// ---------------------------------------------------------------------------
// Service requests
// ---------------------------------------------------------------------------

export interface UseServiceRequestsParams {
  page?: number
  page_size?: number
  mine?: boolean
  status?: ServiceRequestStatus
  catalog_item?: string | number
}

export function useServiceRequests(params: UseServiceRequestsParams = {}) {
  const { page = 1, page_size = 25, mine, status, catalog_item } = params
  return useQuery<PaginatedResponse<ServiceRequest>>({
    queryKey: ['service_requests', { page, page_size, mine, status, catalog_item }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      if (mine) queryParams.mine = 1
      if (status) queryParams.status = status
      if (catalog_item) queryParams.catalog_item = catalog_item
      const { data } = await api.get<PaginatedResponse<ServiceRequest>>('/service_requests/', { params: queryParams })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useServiceRequest(id: string | number | undefined) {
  return useQuery<ServiceRequest>({
    queryKey: ['service_request', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceRequest>(`/service_requests/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useSubmitServiceRequest(catalogItemId: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ServiceRequestSubmitPayload) => {
      const { data } = await api.post<ServiceRequest>(`/service_catalog_items/${catalogItemId}/submit/`, payload)
      return data
    },
    onSuccess: (data) => {
      toast.success(
        data.status === 'pending_approval'
          ? 'Request submitted for approval'
          : 'Request submitted and launched',
      )
      qc.invalidateQueries({ queryKey: ['service_requests'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to submit request')
    },
  })
}

export function useApproveServiceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await api.post<ServiceRequest>(`/service_requests/${id}/approve/`)
      return data
    },
    onSuccess: () => {
      toast.success('Request approved')
      qc.invalidateQueries({ queryKey: ['service_requests'] })
      qc.invalidateQueries({ queryKey: ['service_request_pending_approvals'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to approve')
    },
  })
}

export function useRejectServiceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string | number; reason?: string }) => {
      const { data } = await api.post<ServiceRequest>(`/service_requests/${id}/reject/`, { reason })
      return data
    },
    onSuccess: () => {
      toast.success('Request rejected')
      qc.invalidateQueries({ queryKey: ['service_requests'] })
      qc.invalidateQueries({ queryKey: ['service_request_pending_approvals'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to reject')
    },
  })
}

export function useDeleteServiceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/service_requests/${id}/`)
    },
    onSuccess: () => {
      toast.success('Request deleted')
      qc.invalidateQueries({ queryKey: ['service_requests'] })
    },
    onError: () => toast.error('Failed to delete request'),
  })
}

export function usePendingApprovals(params: { page?: number; page_size?: number } = {}) {
  const { page = 1, page_size = 25 } = params
  return useQuery<PaginatedResponse<ServiceRequest>>({
    queryKey: ['service_request_pending_approvals', { page, page_size }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ServiceRequest>>('/service_requests/pending_approvals/', {
        params: { page, page_size },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })
}
