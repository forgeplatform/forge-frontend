import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDriftDetectionDetail, useAcknowledgeDrift } from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Packages',
  services: 'Services',
  users_groups: 'Users & Groups',
  network: 'Network',
  mounts: 'Mounts',
  kernel: 'Kernel',
  other: 'Other',
}

const SEVERITY_VARIANT: Record<string, 'error' | 'outline' | 'secondary'> = {
  critical: 'error',
  high: 'error',
  medium: 'outline',
  low: 'secondary',
}

export function DriftDetectionDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: drift, isLoading } = useDriftDetectionDetail(id!)
  const acknowledgeMutation = useAcknowledgeDrift(id!)

  if (isLoading) return <DetailPageSkeleton />

  if (!drift) {
    return (
      <div className="space-y-4">
        <Link to="/drift_detections" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Drift Detections
        </Link>
        <p className="text-muted-foreground">Drift detection not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/drift_detections"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Drift Detections
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{drift.fact_path}</h1>
              <Badge variant="outline">{CATEGORY_LABELS[drift.category] ?? drift.category}</Badge>
              <Badge variant={SEVERITY_VARIANT[drift.severity] ?? 'secondary'}>
                {drift.severity}
              </Badge>
              <Badge variant={drift.acknowledged ? 'success' : 'secondary'}>
                {drift.acknowledged ? 'Acknowledged' : 'Unacknowledged'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{drift.summary}</p>
          </div>

          {!drift.acknowledged && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Acknowledge
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Host</dt>
                <dd>
                  <Link to={`/hosts/${drift.host}`} className="text-primary hover:underline">
                    {drift.host_name || `#${drift.host}`}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd>{CATEGORY_LABELS[drift.category] ?? drift.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Severity</dt>
                <dd>{drift.severity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fact Path</dt>
                <dd className="font-mono">{drift.fact_path}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Detected</dt>
                <dd>{formatRelativeTime(drift.detected_at)}</dd>
              </div>
              {drift.job && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Job</dt>
                  <dd>
                    <Link to={`/jobs/${drift.job}`} className="text-primary hover:underline">
                      #{drift.job}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Diff Type</dt>
                <dd>
                  <Badge variant="outline">{drift.detail?.diff_type ?? 'unknown'}</Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Change Detail</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Before</label>
              <pre className="mt-1 max-h-64 overflow-auto rounded bg-muted p-3 text-xs font-mono">
                {drift.detail?.before !== undefined
                  ? JSON.stringify(drift.detail.before, null, 2)
                  : '(none)'}
              </pre>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">After</label>
              <pre className="mt-1 max-h-64 overflow-auto rounded bg-muted p-3 text-xs font-mono">
                {drift.detail?.after !== undefined
                  ? JSON.stringify(drift.detail.after, null, 2)
                  : '(none)'}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
