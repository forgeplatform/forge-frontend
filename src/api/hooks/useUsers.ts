import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, User } from '@/api/types'

export interface UseUsersParams {
  page?: number
  page_size?: number
  order_by?: string
  search?: string
}

export function useUsers(params: UseUsersParams = {}) {
  const {
    page = 1,
    page_size = 25,
    order_by = 'username',
    search,
  } = params

  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', { page, page_size, order_by, search }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
        order_by,
      }
      if (search) queryParams.search = search

      const { data } = await api.get<PaginatedResponse<User>>(
        '/users/',
        { params: queryParams },
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useUserDetail(id: string) {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data } = await api.get<User>(`/users/${id}/`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation<User, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<User>('/users/', payload)
      return data
    },
    onSuccess: () => {
      toast.success('User created')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<User>(`/users/${id}/`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
    },
  })
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/users/${id}/`)
    },
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
