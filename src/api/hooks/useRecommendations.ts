import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Recommendation, RecommendationScope } from '@/api/types'

interface RecommendationsResponse {
  count: number
  results: Recommendation[]
}

export function useRecommendations(scope: RecommendationScope) {
  return useQuery<RecommendationsResponse>({
    queryKey: ['recommendations', scope],
    queryFn: async () => {
      const { data } = await api.get<RecommendationsResponse>('/recommendations/', {
        params: { scope },
      })
      return data
    },
    refetchInterval: 60_000,
  })
}
