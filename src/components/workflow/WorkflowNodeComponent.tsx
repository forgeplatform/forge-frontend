import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play, FolderGit2, GitBranch, ShieldCheck } from 'lucide-react'

interface WorkflowNodeData {
  label: string
  jobType?: string
  converge?: boolean
  [key: string]: unknown
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  job: Play,
  project_update: FolderGit2,
  workflow_job: GitBranch,
  inventory_update: ShieldCheck,
}

function WorkflowNodeInner({ data }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  const Icon = typeIcons[nodeData.jobType ?? ''] ?? Play

  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-sm min-w-[160px]">
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />

      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium truncate max-w-[140px]">{nodeData.label}</span>
      </div>

      {nodeData.converge && (
        <div className="mt-1 text-[10px] text-muted-foreground">All parents must converge</div>
      )}

      <div className="mt-2 flex justify-end gap-1.5">
        <Handle
          type="source"
          position={Position.Right}
          id="success"
          className="!bg-green-500 !w-2.5 !h-2.5"
          style={{ top: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="failure"
          className="!bg-red-500 !w-2.5 !h-2.5"
          style={{ top: '50%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="always"
          className="!bg-blue-500 !w-2.5 !h-2.5"
          style={{ top: '70%' }}
        />
      </div>
    </div>
  )
}

export const WorkflowNodeComponent = memo(WorkflowNodeInner)
