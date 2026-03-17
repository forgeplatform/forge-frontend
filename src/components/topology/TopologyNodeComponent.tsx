import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

interface TopologyNodeData {
  label: string
  nodeType: string
  capacity: number
  consumedCapacity: number
  version: string
  lastSeen: string
  enabled: boolean
  [key: string]: unknown
}

const TYPE_STYLES: Record<string, { bg: string; border: string; shape: string }> = {
  control: { bg: 'bg-blue-100 dark:bg-blue-950', border: 'border-blue-500', shape: 'rounded-full' },
  execution: { bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-500', shape: 'rounded-md' },
  hybrid: { bg: 'bg-purple-100 dark:bg-purple-950', border: 'border-purple-500', shape: 'rounded-lg' },
  hop: { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-400', shape: 'rounded-md' },
}

function TopologyNodeInner({ data }: NodeProps) {
  const nodeData = data as TopologyNodeData
  const style = TYPE_STYLES[nodeData.nodeType] ?? TYPE_STYLES['hop']!
  const pct = nodeData.capacity > 0
    ? Math.round(((nodeData.capacity - nodeData.consumedCapacity) / nodeData.capacity) * 100)
    : 0

  return (
    <div
      className={`border-2 ${style.border} ${style.bg} ${style.shape} px-4 py-3 min-w-[140px] shadow-sm transition-opacity ${
        nodeData.enabled ? '' : 'opacity-50'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />

      <div className="text-sm font-medium truncate max-w-[120px]">{nodeData.label}</div>
      <div className="mt-1 text-[10px] text-muted-foreground capitalize">{nodeData.nodeType}</div>

      {nodeData.capacity > 0 && (
        <div className="mt-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-0.5 text-[9px] text-muted-foreground">{pct}% free</div>
        </div>
      )}
    </div>
  )
}

export const TopologyNodeComponent = memo(TopologyNodeInner)
