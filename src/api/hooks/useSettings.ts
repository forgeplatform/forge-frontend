import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

export function useSettingsCategory(slug: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['settings', slug],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>(`/settings/${slug}/`)
      return data
    },
    enabled: !!slug,
  })
}

export function useUpdateSettings(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data } = await api.patch<Record<string, unknown>>(`/settings/${slug}/`, values)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', slug] })
    },
  })
}
