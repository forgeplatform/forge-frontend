import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, DriftDetection, DriftAlertRule, DriftAlert, HostFactSnapshot, DriftSummary } from '@/api/types'

// ---------------------------------------------------------------------------
// Drift Detections
// ---------------------------------------------------------------------------

export interface UseDriftDetectionsParams {
  page?: number
  page_size?: number
  host?: string
  inventory?: string
  category?: string
  severity?: string
  acknowledged?: string
  detected_at__gte?: string
  detected_at__lte?: string
  search?: string
}

export function useDriftDetections(params: UseDriftDetectionsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params

  return useQuery<PaginatedResponse<DriftDetection>>({
    queryKey: ['drift_detections', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<DriftDetection>>(
        '/drift_detections/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useDriftDetectionDetail(id: string) {
  return useQuery<DriftDetection>({
    queryKey: ['drift_detection', id],
    queryFn: async () => {
      const { data } = await api.get<DriftDetection>(`/drift_detections/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useAcknowledgeDrift(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/drift_detections/${id}/acknowledge/`)
      return data
    },
    onSuccess: () => {
      toast.success('Drift acknowledged')
      queryClient.invalidateQueries({ queryKey: ['drift_detections'] })
      queryClient.invalidateQueries({ queryKey: ['drift_detection', id] })
      queryClient.invalidateQueries({ queryKey: ['drift_summary'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Drift Summary (dashboard)
// ---------------------------------------------------------------------------

export function useDriftSummary(days = 7) {
  return useQuery<DriftSummary>({
    queryKey: ['drift_summary', days],
    queryFn: async () => {
      const { data } = await api.get<DriftSummary>('/drift_detections/summary/', {
        params: { days },
      })
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Fact Snapshots
// ---------------------------------------------------------------------------

export interface UseFactSnapshotsParams {
  page?: number
  page_size?: number
  host?: string
  inventory?: string
  job?: string
}

export function useFactSnapshots(params: UseFactSnapshotsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params

  return useQuery<PaginatedResponse<HostFactSnapshot>>({
    queryKey: ['fact_snapshots', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<HostFactSnapshot>>(
        '/fact_snapshots/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useFactSnapshotDetail(id: string) {
  return useQuery<HostFactSnapshot>({
    queryKey: ['fact_snapshot', id],
    queryFn: async () => {
      const { data } = await api.get<HostFactSnapshot>(`/fact_snapshots/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// Drift Alert Rules
// ---------------------------------------------------------------------------

export interface UseDriftAlertRulesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
  organization?: string
  enabled?: string
}

export function useDriftAlertRules(params: UseDriftAlertRulesParams = {}) {
  const { page = 1, page_size = 25, order_by = 'name', search, ...filters } = params

  return useQuery<PaginatedResponse<DriftAlertRule>>({
    queryKey: ['drift_alert_rules', { page, page_size, order_by, search, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size, order_by }
      if (search) queryParams.search = search
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<DriftAlertRule>>(
        '/drift_alert_rules/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useDriftAlertRuleDetail(id: string) {
  return useQuery<DriftAlertRule>({
    queryKey: ['drift_alert_rule', id],
    queryFn: async () => {
      const { data } = await api.get<DriftAlertRule>(`/drift_alert_rules/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDriftAlertRule() {
  const queryClient = useQueryClient()

  return useMutation<DriftAlertRule, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<DriftAlertRule>('/drift_alert_rules/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Drift alert rule created')
      queryClient.invalidateQueries({ queryKey: ['drift_alert_rules'] })
    },
  })
}

export function useUpdateDriftAlertRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation<DriftAlertRule, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<DriftAlertRule>(`/drift_alert_rules/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Drift alert rule updated')
      queryClient.invalidateQueries({ queryKey: ['drift_alert_rules'] })
      queryClient.invalidateQueries({ queryKey: ['drift_alert_rule', id] })
    },
  })
}

export function useDeleteDriftAlertRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/drift_alert_rules/${id}/`)
    },
    onSuccess: () => {
      toast.success('Drift alert rule deleted')
      queryClient.invalidateQueries({ queryKey: ['drift_alert_rules'] })
    },
  })
}

export function useToggleDriftAlertRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation<{ enabled: boolean }, Error, boolean>({
    mutationFn: async (enable) => {
      const action = enable ? 'enable' : 'disable'
      const { data } = await api.post<{ enabled: boolean }>(`/drift_alert_rules/${id}/${action}/`)
      return data
    },
    onSuccess: (_data, enable) => {
      toast.success(`Alert rule ${enable ? 'enabled' : 'disabled'}`)
      queryClient.invalidateQueries({ queryKey: ['drift_alert_rules'] })
      queryClient.invalidateQueries({ queryKey: ['drift_alert_rule', id] })
    },
  })
}

// ---------------------------------------------------------------------------
// Drift Alerts (read-only)
// ---------------------------------------------------------------------------

export interface UseDriftAlertsParams {
  page?: number
  page_size?: number
  alert_rule?: string
  host?: string
  notification_status?: string
}

export function useDriftAlerts(params: UseDriftAlertsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params

  return useQuery<PaginatedResponse<DriftAlert>>({
    queryKey: ['drift_alerts', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<DriftAlert>>(
        '/drift_alerts/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useDriftAlertDetail(id: string) {
  return useQuery<DriftAlert>({
    queryKey: ['drift_alert', id],
    queryFn: async () => {
      const { data } = await api.get<DriftAlert>(`/drift_alerts/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// Drift Compare
// ---------------------------------------------------------------------------

export function useDriftCompare() {
  return useMutation<
    { snapshot_a: number; snapshot_b: number; diff_count: number; diffs: unknown[] },
    Error,
    { snapshot_a: number; snapshot_b: number }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post('/drift_detections/compare/', payload)
      return data
    },
  })
}

// ---------------------------------------------------------------------------
// Drift Export
// ---------------------------------------------------------------------------

export function useDriftExport() {
  return useMutation<Blob, Error, Record<string, string>>({
    mutationFn: async (params) => {
      const { data } = await api.get('/drift_detections/export/', {
        params,
        responseType: 'blob',
      })
      return data
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'drift_report.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report downloaded')
    },
  })
}
