import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, NotificationTemplate, Notification } from '@/api/types'

export interface UseNotificationTemplatesParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useNotificationTemplates(params: UseNotificationTemplatesParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<NotificationTemplate>>({
    queryKey: ['notification_templates', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<NotificationTemplate>>(
        '/notification_templates/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useNotificationTemplateDetail(id: string) {
  return useQuery<NotificationTemplate>({
    queryKey: ['notification_template', id],
    queryFn: async () => {
      const { data } = await api.get<NotificationTemplate>(`/notification_templates/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient()

  return useMutation<NotificationTemplate, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<NotificationTemplate>('/notification_templates/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Notification template created')
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    },
  })
}

export function useUpdateNotificationTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation<NotificationTemplate, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<NotificationTemplate>(`/notification_templates/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Notification template updated')
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
      queryClient.invalidateQueries({ queryKey: ['notification_template', id] })
    },
  })
}

export function useDeleteNotificationTemplate(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/notification_templates/${id}/`)
    },
    onSuccess: () => {
      toast.success('Notification template deleted')
      queryClient.invalidateQueries({ queryKey: ['notification_templates'] })
    },
  })
}

export function useTestNotificationTemplate(id: string) {
  return useMutation({
    mutationFn: async () => {
      await api.post(`/notification_templates/${id}/test/`)
    },
    onSuccess: () => {
      toast.success('Test notification sent')
    },
    onError: () => {
      toast.error('Failed to send test notification')
    },
  })
}

export function useNotificationTemplateNotifications(id: string) {
  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notification_template_notifications', id],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Notification>>(
        `/notification_templates/${id}/notifications/`,
        { params: { page_size: 10, order_by: '-created' } },
      )
      return data
    },
    enabled: !!id,
  })
}
