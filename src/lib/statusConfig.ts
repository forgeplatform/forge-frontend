import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import type { JobStatus } from '@/api/types'

export const statusConfig: Record<
  JobStatus,
  {
    label: string
    variant: 'success' | 'error' | 'warning' | 'secondary'
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  successful: { label: 'Success', variant: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'error', icon: XCircle },
  error: { label: 'Error', variant: 'error', icon: AlertCircle },
  canceled: { label: 'Canceled', variant: 'warning', icon: XCircle },
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  waiting: { label: 'Waiting', variant: 'secondary', icon: Clock },
  running: { label: 'Running', variant: 'warning', icon: Loader2 },
  new: { label: 'New', variant: 'secondary', icon: Clock },
}

export const typeLabels: Record<string, string> = {
  job: 'Playbook',
  project_update: 'Source Update',
  inventory_update: 'Inventory Sync',
  workflow_job: 'Workflow',
  system_job: 'Management',
  ad_hoc_command: 'Command',
}
