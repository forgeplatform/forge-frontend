import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, RoleUser, RoleTeam } from '@/api/types'

export function useRoleUsers(roleId: number | undefined) {
  return useQuery<PaginatedResponse<RoleUser>>({
    queryKey: ['role_users', roleId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<RoleUser>>(
        `/roles/${roleId}/users/`,
        { params: { page_size: 200 } },
      )
      return data
    },
    enabled: !!roleId,
  })
}

export function useRoleTeams(roleId: number | undefined) {
  return useQuery<PaginatedResponse<RoleTeam>>({
    queryKey: ['role_teams', roleId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<RoleTeam>>(
        `/roles/${roleId}/teams/`,
        { params: { page_size: 200 } },
      )
      return data
    },
    enabled: !!roleId,
  })
}

export function useAssignRoleUser(roleId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (userId) => {
      await api.post(`/roles/${roleId}/users/`, { id: userId })
    },
    onSuccess: () => {
      toast.success('User assigned to role')
      queryClient.invalidateQueries({ queryKey: ['role_users', roleId] })
    },
  })
}

export function useUnassignRoleUser(roleId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (userId) => {
      await api.post(`/roles/${roleId}/users/`, { id: userId, disassociate: true })
    },
    onSuccess: () => {
      toast.success('User removed from role')
      queryClient.invalidateQueries({ queryKey: ['role_users', roleId] })
    },
  })
}

export function useAssignRoleTeam(roleId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (teamId) => {
      await api.post(`/roles/${roleId}/teams/`, { id: teamId })
    },
    onSuccess: () => {
      toast.success('Team assigned to role')
      queryClient.invalidateQueries({ queryKey: ['role_teams', roleId] })
    },
  })
}

export function useUnassignRoleTeam(roleId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (teamId) => {
      await api.post(`/roles/${roleId}/teams/`, { id: teamId, disassociate: true })
    },
    onSuccess: () => {
      toast.success('Team removed from role')
      queryClient.invalidateQueries({ queryKey: ['role_teams', roleId] })
    },
  })
}
