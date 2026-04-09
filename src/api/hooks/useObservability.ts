import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ObservabilityConfig } from '@/api/types'

export function useObservability() {
  return useQuery<ObservabilityConfig>({
    queryKey: ['observability'],
    queryFn: async () => {
      const { data } = await api.get<ObservabilityConfig>('/observability/')
      return data
    },
    refetchInterval: 30000,
  })
}
