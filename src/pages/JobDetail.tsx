import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Ban } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useJobDetail,
  useJobStdout,
  useJobHostSummaries,
  useCancelJob,
  useRelaunchJob,
  isJobActive,
} from '@/api/hooks/useJobDetail'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime, formatDuration } from '@/lib/utils'
import { HostSummaryBar } from '@/components/job/HostSummaryBar'
import { JobOutputTab } from '@/components/job/JobOutputTab'
import { JobDetailsTab } from '@/components/job/JobDetailsTab'

type Tab = 'output' | 'details'

export function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('output')

  const { data: job, isLoading } = useJobDetail(id!)
  const active = job ? isJobActive(job.status) : false
  const { data: stdout, isLoading: stdoutLoading } = useJobStdout(id!, activeTab === 'output')
  const { data: hostSummaries } = useJobHostSummaries(id!)
  const cancelJob = useCancelJob(id!)
  const relaunchJob = useRelaunchJob(id!)

  const handleRelaunch = () => {
    relaunchJob.mutate(undefined, {
      onSuccess: (data) => {
        navigate(`/jobs/${data.id}`)
      },
    })
  }

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Jobs
        </Link>
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    )
  }

  const config = statusConfig[job.status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/jobs"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Jobs
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{job.name}</h1>
              <Badge variant={config.variant} className="gap-1">
                <StatusIcon
                  className={`h-3 w-3${job.status === 'running' ? ' animate-spin' : ''}`}
                />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Job #{job.id}
              {job.started && <> &middot; Started {formatRelativeTime(job.started)}</>}
              {job.elapsed > 0 && <> &middot; Duration {formatDuration(job.elapsed)}</>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {active && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelJob.mutate()}
                disabled={cancelJob.isPending}
              >
                <Ban className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRelaunch}
              disabled={relaunchJob.isPending}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Relaunch
            </Button>
          </div>
        </div>
      </div>

      {/* Host Summary Bar */}
      {hostSummaries && hostSummaries.results.length > 0 && (
        <HostSummaryBar summaries={hostSummaries.results} />
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'output'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'output' && (
            <JobOutputTab
              stdout={stdout}
              isLoading={stdoutLoading}
              isActive={active}
            />
          )}
          {activeTab === 'details' && <JobDetailsTab job={job} />}
        </div>
      </div>
    </div>
  )
}
