import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'

export function useCopyResource(resourceType: string, resourceId: string) {
  const queryClient = useQueryClient()

  return useMutation<{ id: number }, Error, { name: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/${resourceType}/${resourceId}/copy/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Resource copied')
      queryClient.invalidateQueries({ queryKey: [resourceType] })
    },
  })
}
