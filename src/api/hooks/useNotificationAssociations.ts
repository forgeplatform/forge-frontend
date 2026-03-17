import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, NotificationTemplate } from '@/api/types'

type EventType = 'started' | 'success' | 'error'

function buildUrl(resourceType: string, resourceId: string, event: EventType) {
  return `/${resourceType}/${resourceId}/notification_templates_${event}/`
}

export function useNotificationAssociations(
  resourceType: string,
  resourceId: string,
  event: EventType,
) {
  return useQuery<PaginatedResponse<NotificationTemplate>>({
    queryKey: ['notification_associations', resourceType, resourceId, event],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<NotificationTemplate>>(
        buildUrl(resourceType, resourceId, event),
        { params: { page_size: 200 } },
      )
      return data
    },
    enabled: !!resourceId,
  })
}

export function useAssociateNotification(
  resourceType: string,
  resourceId: string,
  event: EventType,
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (notificationTemplateId) => {
      await api.post(buildUrl(resourceType, resourceId, event), {
        id: notificationTemplateId,
      })
    },
    onSuccess: () => {
      toast.success('Notification template associated')
      queryClient.invalidateQueries({
        queryKey: ['notification_associations', resourceType, resourceId, event],
      })
    },
  })
}

export function useDisassociateNotification(
  resourceType: string,
  resourceId: string,
  event: EventType,
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (notificationTemplateId) => {
      await api.post(buildUrl(resourceType, resourceId, event), {
        id: notificationTemplateId,
        disassociate: true,
      })
    },
    onSuccess: () => {
      toast.success('Notification template removed')
      queryClient.invalidateQueries({
        queryKey: ['notification_associations', resourceType, resourceId, event],
      })
    },
  })
}
