import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, Team } from '@/api/types'

export interface UseTeamsParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useTeams(params: UseTeamsParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'name',
    search,
  } = params

  return useQuery<PaginatedResponse<Team>>({
    queryKey: ['teams', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<Team>>(
        '/teams/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useTeamDetail(id: string) {
  return useQuery<Team>({
    queryKey: ['team', id],
    queryFn: async () => {
      const { data } = await api.get<Team>(`/teams/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation<Team, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Team>('/teams/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('Team created')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam(id: string) {
  const queryClient = useQueryClient()

  return useMutation<Team, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<Team>(`/teams/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Team updated')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', id] })
    },
  })
}

export function useDeleteTeam(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/teams/${id}/`)
    },
    onSuccess: () => {
      toast.success('Team deleted')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}
