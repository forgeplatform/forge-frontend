import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDriftAlertDetail } from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'

const NOTIFICATION_VARIANT: Record<string, 'success' | 'error' | 'secondary'> = {
  sent: 'success',
  failed: 'error',
  pending: 'secondary',
}

export function DriftAlertDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: alert, isLoading } = useDriftAlertDetail(id!)

  if (isLoading) return <DetailPageSkeleton />

  if (!alert) {
    return (
      <div className="space-y-4">
        <Link to="/drift_alerts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Drift Alerts
        </Link>
        <p className="text-muted-foreground">Alert not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/drift_alerts"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Drift Alerts
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Alert #{alert.id}
          </h1>
          <Badge variant={NOTIFICATION_VARIANT[alert.notification_status] ?? 'secondary'}>
            {alert.notification_status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Alert Rule</dt>
                <dd>
                  {alert.alert_rule ? (
                    <Link to={`/drift_alert_rules/${alert.alert_rule}`} className="text-primary hover:underline">
                      {alert.alert_rule_name}
                    </Link>
                  ) : (
                    alert.alert_rule_name || 'Deleted Rule'
                  )}
                </dd>
              </div>
              {alert.host && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Host</dt>
                  <dd>
                    <Link to={`/hosts/${alert.host}`} className="text-primary hover:underline">
                      #{alert.host}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Drift Count</dt>
                <dd>{alert.drift_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Notification</dt>
                <dd>
                  <Badge variant={NOTIFICATION_VARIANT[alert.notification_status] ?? 'secondary'}>
                    {alert.notification_status}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatRelativeTime(alert.created)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{alert.summary || 'No summary available.'}</p>
            {alert.notification_error && (
              <div className="mt-4">
                <label className="text-xs font-medium text-destructive">Notification Error</label>
                <pre className="mt-1 overflow-auto rounded bg-muted p-3 text-xs font-mono">
                  {alert.notification_error}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
