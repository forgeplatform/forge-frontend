import { useState, useEffect } from 'react'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CodeEditor } from '@/components/CodeEditor'
import { useUpdateWorkflowNode, useDeleteWorkflowNode } from '@/api/hooks/useWorkflowNodes'
import type { WorkflowNode } from '@/api/types'

interface WorkflowNodeConfigPanelProps {
  node: WorkflowNode
  onClose: () => void
}

export function WorkflowNodeConfigPanel({ node, onClose }: WorkflowNodeConfigPanelProps) {
  const updateMutation = useUpdateWorkflowNode(String(node.id))
  const deleteMutation = useDeleteWorkflowNode(String(node.id))

  const [converge, setConverge] = useState(node.all_parents_must_converge)
  const [limit, setLimit] = useState(node.limit ?? '')
  const [verbosity, setVerbosity] = useState(node.verbosity != null ? String(node.verbosity) : '')
  const [extraData, setExtraData] = useState(
    node.extra_data ? JSON.stringify(node.extra_data, null, 2) : '{}',
  )

  useEffect(() => {
    setConverge(node.all_parents_must_converge)
    setLimit(node.limit ?? '')
    setVerbosity(node.verbosity != null ? String(node.verbosity) : '')
    setExtraData(node.extra_data ? JSON.stringify(node.extra_data, null, 2) : '{}')
  }, [node])

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      all_parents_must_converge: converge,
      limit,
    }
    if (verbosity) payload.verbosity = Number(verbosity)
    try {
      payload.extra_data = JSON.parse(extraData)
    } catch {
      // keep old
    }
    updateMutation.mutate(payload, { onSuccess: onClose })
  }

  const handleDelete = () => {
    deleteMutation.mutate(undefined, { onSuccess: onClose })
  }

  const templateName = node.summary_fields?.unified_job_template?.name ?? 'Unknown'
  const templateType = node.summary_fields?.unified_job_template?.unified_job_type ?? ''

  return (
    <div className="w-80 shrink-0 border-l bg-card p-4 overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Node Config</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Template</Label>
          <p className="text-sm font-medium">{templateName}</p>
          <p className="text-xs text-muted-foreground">{templateType}</p>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={converge} onCheckedChange={setConverge} />
          <Label className="text-sm">All parents must converge</Label>
        </div>

        <div className="space-y-2">
          <Label>Limit</Label>
          <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. webservers" />
        </div>

        <div className="space-y-2">
          <Label>Verbosity</Label>
          <Input type="number" min={0} max={5} value={verbosity} onChange={(e) => setVerbosity(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Extra Data (JSON)</Label>
          <CodeEditor
            value={extraData}
            onChange={setExtraData}
            language="json"
            height="120px"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
