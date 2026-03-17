import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useScheduleDetail, useDeleteSchedule } from '@/api/hooks/useSchedules'
import { typeLabels } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'

export function ScheduleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const { data: schedule, isLoading } = useScheduleDetail(id!)
  const deleteMutation = useDeleteSchedule(id!)

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => navigate('/schedules'),
    })
  }

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!schedule) {
    return (
      <div className="space-y-4">
        <Link to="/schedules" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Schedules
        </Link>
        <p className="text-muted-foreground">Schedule not found.</p>
      </div>
    )
  }

  const templateName = schedule.summary_fields?.unified_job_template?.name
  const templateType = schedule.summary_fields?.unified_job_template?.unified_job_type

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/schedules"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Schedules
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{schedule.name}</h1>
              <Badge variant={schedule.enabled ? 'success' : 'secondary'}>
                {schedule.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {schedule.description && (
              <p className="text-sm text-muted-foreground">{schedule.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/schedules/${id}/edit`}>
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
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="RRule" value={schedule.rrule} mono />
            <DetailRow label="Start Date" value={new Date(schedule.dtstart).toLocaleString()} />
            <DetailRow label="End Date" value={schedule.dtend ? new Date(schedule.dtend).toLocaleString() : 'Never'} />
            <DetailRow
              label="Next Run"
              value={schedule.next_run ? formatRelativeTime(schedule.next_run) : 'Not scheduled'}
            />
            <DetailRow label="Created" value={formatRelativeTime(schedule.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(schedule.modified)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Name" value={templateName ?? '–'} />
            <DetailRow label="Type" value={templateType ? (typeLabels[templateType] ?? templateType) : '–'} />
            <DetailRow label="Created By" value={schedule.summary_fields?.created_by?.username} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Schedule"
        description={`Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs break-all text-right max-w-[300px]' : ''}>{value || '–'}</span>
    </div>
  )
}
