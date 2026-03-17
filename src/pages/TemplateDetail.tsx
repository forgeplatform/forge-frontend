import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Rocket, Loader2, Trash2, Pencil, Copy } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { CodeEditor } from '@/components/CodeEditor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LaunchDialog } from '@/components/LaunchDialog'
import {
  useJobTemplateDetail,
  useLaunchJobTemplate,
  useDeleteJobTemplate,
  useJobTemplateSurvey,
  useSaveJobTemplateSurvey,
  useDeleteJobTemplateSurvey,
} from '@/api/hooks/useTemplates'
import { SurveyEditor, type SurveySpec } from '@/components/survey/SurveyEditor'
import { CopyDialog } from '@/components/CopyDialog'
import { useCopyResource } from '@/api/hooks/useCopy'
import { SchedulesTab } from '@/components/SchedulesTab'
import { NotificationAssociations } from '@/components/NotificationAssociations'
import { RBACPanel } from '@/components/RBACPanel'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'
import type { JobStatus } from '@/api/types'

function RecentJobDots({ jobs }: { jobs?: Array<{ id: number; status: JobStatus; finished: string }> }) {
  if (!jobs || jobs.length === 0) return null
  return (
    <div className="flex items-center gap-1" title="Recent job runs">
      {jobs.slice(0, 10).map((j) => {
        const config = statusConfig[j.status]
        return (
          <Link
            key={j.id}
            to={`/jobs/${j.id}`}
            className="block h-3 w-3 rounded-full transition-transform hover:scale-125"
            style={{
              backgroundColor:
                j.status === 'successful' ? '#22c55e' :
                j.status === 'failed' || j.status === 'error' ? '#ef4444' :
                j.status === 'running' ? '#f97316' :
                j.status === 'canceled' ? '#eab308' :
                '#94a3b8',
            }}
            title={`#${j.id} — ${config.label}`}
          />
        )
      })}
    </div>
  )
}

export function TemplateDetail() {
  const { id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [showLaunch, setShowLaunch] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const { data: template, isLoading } = useJobTemplateDetail(id!)
  const launch = useLaunchJobTemplate(id!)
  const deleteMutation = useDeleteJobTemplate(id!)
  const copyMutation = useCopyResource('job_templates', id!)
  const { data: surveyData } = useJobTemplateSurvey(id!)
  const saveSurvey = useSaveJobTemplateSurvey(id!)
  const deleteSurvey = useDeleteJobTemplateSurvey(id!)
  const [surveySpec, setSurveySpec] = useState<SurveySpec | null>(null)

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/templates'),
    })
  }

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <Link
          to="/templates"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Link>
        <p className="text-muted-foreground">Template not found.</p>
      </div>
    )
  }

  const lastJob = template.summary_fields?.last_job
  const lastStatus = lastJob?.status
  const config = lastStatus ? statusConfig[lastStatus] : null
  const StatusIcon = config?.icon

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
            <Button size="sm" onClick={() => setShowLaunch(true)} disabled={launch.isPending}>
              <Rocket className="mr-1 h-4 w-4" />
              Launch
            </Button>
            <Link to={`/templates/job_template/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </Button>
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

      <RecentJobDots jobs={template.summary_fields?.recent_jobs} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Inventory" value={template.summary_fields?.inventory?.name} link={template.summary_fields?.inventory ? `/inventories/${template.summary_fields.inventory.id}` : undefined} />
            <DetailRow label="Project" value={template.summary_fields?.project?.name} link={template.summary_fields?.project ? `/projects/${template.summary_fields.project.id}` : undefined} />
            <DetailRow label="Playbook" value={template.playbook} mono />
            <DetailRow label="Execution Environment" value={template.summary_fields?.execution_environment?.name} />
            <DetailRow label="Forks" value={String(template.forks)} />
            <DetailRow label="Verbosity" value={String(template.verbosity)} />
            <DetailRow label="Job Slices" value={String(template.job_slice_count)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Launch Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Limit" value={template.limit || '–'} />
            <DetailRow label="Job Tags" value={template.job_tags || '–'} />
            <DetailRow label="Skip Tags" value={template.skip_tags || '–'} />
            <DetailRow label="Diff Mode" value={template.diff_mode ? 'Yes' : 'No'} />
            <DetailRow label="Become Enabled" value={template.become_enabled ? 'Yes' : 'No'} />
            <DetailRow label="Allow Simultaneous" value={template.allow_simultaneous ? 'Yes' : 'No'} />
            <DetailRow label="Survey Enabled" value={template.survey_enabled ? 'Yes' : 'No'} />
            <DetailRow label="Webhook" value={template.webhook_service || '–'} />
          </CardContent>
        </Card>

        {template.summary_fields?.credentials && template.summary_fields.credentials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.summary_fields.credentials.map((cred) => (
                  <Link key={cred.id} to={`/credentials/${cred.id}`}>
                    <Badge variant="outline">{cred.name}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {template.summary_fields?.labels && template.summary_fields.labels.count > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Labels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.summary_fields.labels.results.map((label) => (
                  <Badge key={label.id} variant="secondary">{label.name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {template.extra_vars && template.extra_vars !== '---' && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Extra Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeEditor
                value={template.extra_vars}
                language="yaml"
                readOnly
                height="200px"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Survey Section */}
      {template.survey_enabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Survey</CardTitle>
              <div className="flex gap-2">
                {!showSurvey ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSurveySpec(surveyData ?? { name: '', description: '', spec: [] })
                      setShowSurvey(true)
                    }}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit Survey
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      disabled={saveSurvey.isPending}
                      onClick={() => {
                        if (surveySpec) {
                          saveSurvey.mutate(surveySpec, {
                            onSuccess: () => setShowSurvey(false),
                          })
                        }
                      }}
                    >
                      {saveSurvey.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Save Survey
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSurvey(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        deleteSurvey.mutate(undefined, {
                          onSuccess: () => setShowSurvey(false),
                        })
                      }}
                      disabled={deleteSurvey.isPending}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete Survey
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showSurvey && surveySpec ? (
              <SurveyEditor value={surveySpec} onChange={setSurveySpec} />
            ) : surveyData && surveyData.spec.length > 0 ? (
              <div className="space-y-2">
                {surveyData.spec.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 rounded border px-3 py-2 text-sm">
                    <span className="font-medium">{q.question_name as string}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{q.type as string}</span>
                    <span className="font-mono text-xs text-muted-foreground">${'{' + (q.variable as string) + '}'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No survey questions defined.</p>
            )}
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader><CardTitle>Schedules</CardTitle></CardHeader>
        <CardContent>
          <SchedulesTab resourceType="job_templates" resourceId={id!} />
        </CardContent>
      </Card>

      <NotificationAssociations resourceType="job_templates" resourceId={id!} />

      <RBACPanel objectRoles={template.summary_fields?.object_roles} />

      <LaunchDialog
        open={showLaunch}
        onOpenChange={setShowLaunch}
        template={template}
        isPending={launch.isPending}
        onLaunch={(payload) => {
          launch.mutate(payload, {
            onSuccess: (data) => {
              setShowLaunch(false)
              navigate(`/jobs/${data.id}`)
            },
          })
        }}
      />

      <CopyDialog
        open={showCopy}
        onOpenChange={setShowCopy}
        originalName={template.name}
        isPending={copyMutation.isPending}
        onCopy={(name) => {
          copyMutation.mutate({ name }, {
            onSuccess: (data) => {
              setShowCopy(false)
              navigate(`/templates/job_template/${data.id}`)
            },
          })
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
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
