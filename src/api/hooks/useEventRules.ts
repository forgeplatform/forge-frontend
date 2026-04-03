import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, EventRule, EventLog, OutboundWebhook } from '@/api/types'

// ---------------------------------------------------------------------------
// Event Rules
// ---------------------------------------------------------------------------

export interface UseEventRulesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
  organization?: string
  source_type?: string
  enabled?: string
}

export function useEventRules(params: UseEventRulesParams = {}) {
  const { page = 1, page_size = 25, order_by = 'name', search, ...filters } = params

  return useQuery<PaginatedResponse<EventRule>>({
    queryKey: ['event_rules', { page, page_size, order_by, search, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size, order_by }
      if (search) queryParams.search = search
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<EventRule>>(
        '/event_rules/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useEventRuleDetail(id: string) {
  return useQuery<EventRule>({
    queryKey: ['event_rule', id],
    queryFn: async () => {
      const { data } = await api.get<EventRule>(`/event_rules/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateEventRule() {
  const queryClient = useQueryClient()

  return useMutation<EventRule, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<EventRule>('/event_rules/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Event rule created')
      queryClient.invalidateQueries({ queryKey: ['event_rules'] })
    },
  })
}

export function useUpdateEventRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation<EventRule, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<EventRule>(`/event_rules/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Event rule updated')
      queryClient.invalidateQueries({ queryKey: ['event_rules'] })
      queryClient.invalidateQueries({ queryKey: ['event_rule', id] })
    },
  })
}

export function useDeleteEventRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/event_rules/${id}/`)
    },
    onSuccess: () => {
      toast.success('Event rule deleted')
      queryClient.invalidateQueries({ queryKey: ['event_rules'] })
    },
  })
}

export function useToggleEventRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation<{ enabled: boolean }, Error, boolean>({
    mutationFn: async (enable) => {
      const action = enable ? 'enable' : 'disable'
      const { data } = await api.post<{ enabled: boolean }>(`/event_rules/${id}/${action}/`)
      return data
    },
    onSuccess: (_data, enable) => {
      toast.success(`Event rule ${enable ? 'enabled' : 'disabled'}`)
      queryClient.invalidateQueries({ queryKey: ['event_rules'] })
      queryClient.invalidateQueries({ queryKey: ['event_rule', id] })
    },
  })
}

export function useTestEventRule(id: string) {
  return useMutation<
    { matched: boolean; condition_results: unknown[]; would_fire: boolean; actions: unknown[] },
    Error,
    { payload: Record<string, unknown>; headers?: Record<string, string> }
  >({
    mutationFn: async (testData) => {
      const { data } = await api.post(`/event_rules/${id}/test/`, testData)
      return data
    },
  })
}

export function useEventRuleWebhookKey(id: string) {
  return useQuery<{ webhook_key: string }>({
    queryKey: ['event_rule_webhook_key', id],
    queryFn: async () => {
      const { data } = await api.get<{ webhook_key: string }>(`/event_rules/${id}/webhook_key/`)
      return data
    },
    enabled: !!id,
  })
}

export function useRotateEventRuleWebhookKey(id: string) {
  const queryClient = useQueryClient()

  return useMutation<{ webhook_key: string }>({
    mutationFn: async () => {
      const { data } = await api.post<{ webhook_key: string }>(`/event_rules/${id}/webhook_key/`)
      return data
    },
    onSuccess: () => {
      toast.success('Webhook key rotated')
      queryClient.invalidateQueries({ queryKey: ['event_rule_webhook_key', id] })
    },
  })
}

// ---------------------------------------------------------------------------
// Event Logs
// ---------------------------------------------------------------------------

export interface UseEventLogsParams {
  page?: number
  page_size?: number
  event_rule?: string
  status?: string
  source_type?: string
  created__gte?: string
  created__lte?: string
  search?: string
}

export function useEventLogs(params: UseEventLogsParams = {}) {
  const { page = 1, page_size = 25, ...filters } = params

  return useQuery<PaginatedResponse<EventLog>>({
    queryKey: ['event_logs', { page, page_size, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size }
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<EventLog>>(
        '/event_logs/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useEventLogDetail(id: string) {
  return useQuery<EventLog>({
    queryKey: ['event_log', id],
    queryFn: async () => {
      const { data } = await api.get<EventLog>(`/event_logs/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useEventRuleEventLogs(ruleId: string, params: { page?: number; page_size?: number } = {}) {
  const { page = 1, page_size = 10 } = params

  return useQuery<PaginatedResponse<EventLog>>({
    queryKey: ['event_rule_event_logs', ruleId, { page, page_size }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<EventLog>>(
        `/event_rules/${ruleId}/event_logs/`,
        { params: { page, page_size } },
      )
      return data
    },
    enabled: !!ruleId,
    placeholderData: keepPreviousData,
  })
}

// ---------------------------------------------------------------------------
// Outbound Webhooks
// ---------------------------------------------------------------------------

export interface UseOutboundWebhooksParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
  organization?: string
}

export function useOutboundWebhooks(params: UseOutboundWebhooksParams = {}) {
  const { page = 1, page_size = 25, order_by = 'name', search, ...filters } = params

  return useQuery<PaginatedResponse<OutboundWebhook>>({
    queryKey: ['outbound_webhooks', { page, page_size, order_by, search, ...filters }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, page_size, order_by }
      if (search) queryParams.search = search
      for (const [key, value] of Object.entries(filters)) {
        if (value) queryParams[key] = value
      }
      const { data } = await api.get<PaginatedResponse<OutboundWebhook>>(
        '/outbound_webhooks/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useOutboundWebhookDetail(id: string) {
  return useQuery<OutboundWebhook>({
    queryKey: ['outbound_webhook', id],
    queryFn: async () => {
      const { data } = await api.get<OutboundWebhook>(`/outbound_webhooks/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateOutboundWebhook() {
  const queryClient = useQueryClient()

  return useMutation<OutboundWebhook, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<OutboundWebhook>('/outbound_webhooks/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Outbound webhook created')
      queryClient.invalidateQueries({ queryKey: ['outbound_webhooks'] })
    },
  })
}

export function useUpdateOutboundWebhook(id: string) {
  const queryClient = useQueryClient()

  return useMutation<OutboundWebhook, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<OutboundWebhook>(`/outbound_webhooks/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Outbound webhook updated')
      queryClient.invalidateQueries({ queryKey: ['outbound_webhooks'] })
      queryClient.invalidateQueries({ queryKey: ['outbound_webhook', id] })
    },
  })
}

export function useDeleteOutboundWebhook(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/outbound_webhooks/${id}/`)
    },
    onSuccess: () => {
      toast.success('Outbound webhook deleted')
      queryClient.invalidateQueries({ queryKey: ['outbound_webhooks'] })
    },
  })
}

export function useTestOutboundWebhook(id: string) {
  return useMutation({
    mutationFn: async () => {
      await api.post(`/outbound_webhooks/${id}/test/`)
    },
    onSuccess: () => {
      toast.success('Test webhook queued for delivery')
    },
    onError: () => {
      toast.error('Failed to send test webhook')
    },
  })
}
