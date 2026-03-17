import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { PaginatedResponse, WorkflowNode } from '@/api/types'

export function useWorkflowNodes(workflowId: string) {
  return useQuery<PaginatedResponse<WorkflowNode>>({
    queryKey: ['workflow_nodes', workflowId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<WorkflowNode>>(
        `/workflow_job_templates/${workflowId}/workflow_nodes/`,
        { params: { page_size: 200 } },
      )
      return data
    },
    enabled: !!workflowId,
  })
}

export function useCreateWorkflowNode(workflowId: string) {
  const queryClient = useQueryClient()

  return useMutation<WorkflowNode, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<WorkflowNode>(
        `/workflow_job_templates/${workflowId}/workflow_nodes/`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      toast.success('Node added')
      queryClient.invalidateQueries({ queryKey: ['workflow_nodes', workflowId] })
    },
  })
}

export function useUpdateWorkflowNode(nodeId: string) {
  const queryClient = useQueryClient()

  return useMutation<WorkflowNode, Error, Record<string, unknown>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch<WorkflowNode>(
        `/workflow_nodes/${nodeId}/`,
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      toast.success('Node updated')
      queryClient.invalidateQueries({
        queryKey: ['workflow_nodes', String(data.workflow_job_template)],
      })
    },
  })
}

export function useDeleteWorkflowNode(nodeId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/workflow_nodes/${nodeId}/`)
    },
    onSuccess: () => {
      toast.success('Node removed')
      queryClient.invalidateQueries({ queryKey: ['workflow_nodes'] })
    },
  })
}

export function useLinkWorkflowNode(
  sourceId: string,
  linkType: 'success_nodes' | 'failure_nodes' | 'always_nodes',
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (targetId) => {
      await api.post(`/workflow_nodes/${sourceId}/${linkType}/`, {
        id: targetId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow_nodes'] })
    },
  })
}

export function useUnlinkWorkflowNode(
  sourceId: string,
  linkType: 'success_nodes' | 'failure_nodes' | 'always_nodes',
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (targetId) => {
      await api.post(`/workflow_nodes/${sourceId}/${linkType}/`, {
        id: targetId,
        disassociate: true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow_nodes'] })
    },
  })
}
