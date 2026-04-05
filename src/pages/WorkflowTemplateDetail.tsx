import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Rocket, Loader2, Trash2, Pencil, Copy } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  useWorkflowJobTemplateDetail,
  useLaunchWorkflowJobTemplate,
  useDeleteWorkflowJobTemplate,
} from '@/api/hooks/useTemplates'
import { useWorkflowNodes } from '@/api/hooks/useWorkflowNodes'
import { WorkflowVisualizer } from '@/components/workflow/WorkflowVisualizer'
import { WorkflowNodeConfigPanel } from '@/components/workflow/WorkflowNodeConfigPanel'
import { CopyDialog } from '@/components/CopyDialog'
import { WorkflowLaunchDialog } from '@/components/WorkflowLaunchDialog'
import { useCopyResource } from '@/api/hooks/useCopy'
import { SchedulesTab } from '@/components/SchedulesTab'
import { NotificationAssociations } from '@/components/NotificationAssociations'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'
import type { WorkflowNode } from '@/api/types'

export function WorkflowTemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [showLaunch, setShowLaunch] = useState(false)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)

  const { data: template, isLoading } = useWorkflowJobTemplateDetail(id!)
  const launch = useLaunchWorkflowJobTemplate(id!)
  const deleteMutation = useDeleteWorkflowJobTemplate(id!)
  const copyMutation = useCopyResource('workflow_job_templates', id!)
  const { data: nodesData } = useWorkflowNodes(id!)

  const hasNodeSurveys = nodesData?.results?.some(n => n.survey_enabled) ?? false
  const needsDialog = template?.survey_enabled || hasNodeSurveys ||
    template?.ask_variables_on_launch || template?.ask_inventory_on_launch

  const handleLaunch = () => {
    if (needsDialog) {
      setShowLaunch(true)
    } else {
      launch.mutate(undefined, {
        onSuccess: (data) => navigate(`/jobs/${data.id}`),
      })
    }
  }

  const handleDialogLaunch = (payload: Record<string, unknown>) => {
    launch.mutate(payload, {
      onSuccess: (data) => {
        setShowLaunch(false)
        navigate(`/jobs/${data.id}`)
      },
    })
  }

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <Link to="/templates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Link>
        <p className="text-muted-foreground">Workflow template not found.</p>
      </div>
    )
  }

  const lastJob = template.summary_fields?.last_job
  const lastStatus = lastJob?.status
  const config = lastStatus ? statusConfig[lastStatus] : null
  const StatusIcon = config?.icon
  const workflowNodes = nodesData?.results ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/templates"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
              <Badge variant="outline">Workflow</Badge>
              {config && StatusIcon && (
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              )}
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleLaunch} disabled={launch.isPending}>
              {launch.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-1 h-4 w-4" />
              )}
              Launch
            </Button>
            <Link to={`/templates/workflow_job_template/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Visualizer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex">
            <div className="flex-1">
              <WorkflowVisualizer
                workflowId={id!}
                workflowNodes={workflowNodes}
                onNodeClick={setSelectedNode}
              />
            </div>
            {selectedNode && (
              <WorkflowNodeConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Organization" value={template.summary_fields?.organization?.name} />
            <DetailRow label="Survey Enabled" value={template.survey_enabled ? 'Yes' : 'No'} />
            <DetailRow label="Allow Simultaneous" value={template.allow_simultaneous ? 'Yes' : 'No'} />
            <DetailRow label="Workflow Nodes" value={String(workflowNodes.length)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Created" value={formatRelativeTime(template.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(template.modified)} />
            <DetailRow label="Created By" value={template.summary_fields?.created_by?.username} />
            <DetailRow label="Last Run" value={template.last_job_run ? formatRelativeTime(template.last_job_run) : 'Never'} />
            {lastJob && (
              <DetailRow
                label="Last Job"
                value={`#${lastJob.id}`}
                link={`/jobs/${lastJob.id}`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Schedules</CardTitle></CardHeader>
        <CardContent>
          <SchedulesTab resourceType="workflow_job_templates" resourceId={id!} />
        </CardContent>
      </Card>

      <NotificationAssociations resourceType="workflow_job_templates" resourceId={id!} />

      <CopyDialog
        open={showCopy}
        onOpenChange={setShowCopy}
        originalName={template.name}
        isPending={copyMutation.isPending}
        onCopy={(name) => {
          copyMutation.mutate({ name }, {
            onSuccess: (data) => {
              setShowCopy(false)
              navigate(`/templates/workflow_job_template/${data.id}`)
            },
          })
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Workflow Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/templates'),
          })
        }}
      />

      {template && (
        <WorkflowLaunchDialog
          open={showLaunch}
          onOpenChange={setShowLaunch}
          template={template}
          isPending={launch.isPending}
          onLaunch={handleDialogLaunch}
        />
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  link,
}: {
  label: string
  value?: string
  link?: string
}) {
  const display = value || '–'
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <Link to={link} className="text-primary hover:underline">
          {display}
        </Link>
      ) : (
        <span>{display}</span>
      )}
    </div>
  )
}
