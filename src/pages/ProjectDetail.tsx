import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Trash2, Pencil } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SchedulesTab } from '@/components/SchedulesTab'
import { RBACPanel } from '@/components/RBACPanel'
import { useProjectDetail, useSyncProject, useDeleteProject } from '@/api/hooks/useProjects'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'
import type { JobStatus } from '@/api/types'

const scmTypeLabels: Record<string, string> = {
  '': 'Manual',
  git: 'Git',
  svn: 'Subversion',
  archive: 'Archive',
  insights: 'Insights',
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const { data: project, isLoading } = useProjectDetail(id!)
  const sync = useSyncProject(id!)
  const deleteMutation = useDeleteProject(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    )
  }

  const status = project.status
  const isStandard = ['successful', 'failed', 'error', 'canceled', 'pending', 'waiting', 'running', 'new'].includes(status)
  const config = isStandard ? statusConfig[status as JobStatus] : null
  const StatusIcon = config?.icon

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/projects"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              {config && StatusIcon ? (
                <Badge variant={config.variant} className="gap-1">
                  <StatusIcon className={`h-3 w-3${status === 'running' ? ' animate-spin' : ''}`} />
                  {config.label}
                </Badge>
              ) : (
                <Badge variant={status === 'ok' ? 'success' : status === 'missing' ? 'error' : 'secondary'}>
                  {status === 'never updated' ? 'Never Updated' : status === 'ok' ? 'OK' : status}
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {project.scm_type && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
              >
                <RefreshCw className={`mr-1 h-4 w-4${sync.isPending ? ' animate-spin' : ''}`} />
                Sync
              </Button>
            )}
            <Link to={`/projects/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="SCM Type" value={scmTypeLabels[project.scm_type] ?? project.scm_type} />
            <DetailRow label="URL" value={project.scm_url || '–'} mono />
            <DetailRow label="Branch" value={project.scm_branch || 'default'} mono />
            <DetailRow label="Revision" value={project.scm_revision ? project.scm_revision.slice(0, 10) : '–'} mono />
            <DetailRow label="Clean" value={project.scm_clean ? 'Yes' : 'No'} />
            <DetailRow label="Delete on Update" value={project.scm_delete_on_update ? 'Yes' : 'No'} />
            <DetailRow label="Track Submodules" value={project.scm_track_submodules ? 'Yes' : 'No'} />
            <DetailRow label="Update on Launch" value={project.scm_update_on_launch ? 'Yes' : 'No'} />
            <DetailRow label="Cache Timeout" value={`${project.scm_update_cache_timeout}s`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow
              label="Organization"
              value={project.summary_fields?.organization?.name}
              link={project.summary_fields?.organization ? `/organizations/${project.summary_fields.organization.id}` : undefined}
            />
            <DetailRow label="Credential" value={project.summary_fields?.credential?.name} />
            <DetailRow label="Default Environment" value={project.summary_fields?.default_environment?.name} />
            <DetailRow label="Allow Override" value={project.allow_override ? 'Yes' : 'No'} />
            <DetailRow label="Created" value={formatRelativeTime(project.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(project.modified)} />
            <DetailRow label="Created By" value={project.summary_fields?.created_by?.username} />
            <DetailRow
              label="Last Update"
              value={project.last_job_run ? formatRelativeTime(project.last_job_run) : 'Never'}
            />
            {project.summary_fields?.last_job && (
              <DetailRow
                label="Last Job"
                value={`#${project.summary_fields.last_job.id}`}
                // project.last_job is always a ProjectUpdate
                // (the most recent SCM sync), not a playbook run.
                link={`/jobs/${project.summary_fields.last_job.id}?type=project_update`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Schedules</CardTitle></CardHeader>
        <CardContent>
          <SchedulesTab resourceType="projects" resourceId={id!} />
        </CardContent>
      </Card>

      <RBACPanel objectRoles={project.summary_fields?.object_roles} />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/projects'),
          })
        }}
      />
    </div>
  )
}

function DetailRow({
  label,
  value,
  link,
  mono,
}: {
  label: string
  value?: string
  link?: string
  mono?: boolean
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
        <span className={mono ? 'font-mono text-xs' : ''}>{display}</span>
      )}
    </div>
  )
}
