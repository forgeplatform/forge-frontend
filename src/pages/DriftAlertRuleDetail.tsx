import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  useDriftAlertRuleDetail,
  useDeleteDriftAlertRule,
  useToggleDriftAlertRule,
  useDriftAlerts,
} from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'
import type { DriftAlert } from '@/api/types'

const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Packages',
  services: 'Services',
  users_groups: 'Users & Groups',
  network: 'Network',
  mounts: 'Mounts',
  kernel: 'Kernel',
  other: 'Other',
}

const NOTIFICATION_VARIANT: Record<string, 'success' | 'error' | 'secondary'> = {
  sent: 'success',
  failed: 'error',
  pending: 'secondary',
}

export function DriftAlertRuleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)

  const { data: rule, isLoading } = useDriftAlertRuleDetail(id!)
  const deleteMutation = useDeleteDriftAlertRule(id!)
  const toggleMutation = useToggleDriftAlertRule(id!)
  const { data: alerts } = useDriftAlerts({ alert_rule: id, page_size: 10 })

  if (isLoading) return <DetailPageSkeleton />

  if (!rule) {
    return (
      <div className="space-y-4">
        <Link to="/drift_alert_rules" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Drift Alert Rules
        </Link>
        <p className="text-muted-foreground">Alert rule not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/drift_alert_rules"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Drift Alert Rules
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{rule.name}</h1>
              <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {rule.description && (
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleMutation.mutate(!rule.enabled)}
              disabled={toggleMutation.isPending}
            >
              {rule.enabled ? (
                <><PowerOff className="mr-1 h-4 w-4" />Disable</>
              ) : (
                <><Power className="mr-1 h-4 w-4" />Enable</>
              )}
            </Button>
            <Link to={`/drift_alert_rules/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-4 w-4" />Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Min Severity</dt>
                <dd><Badge variant="outline">{rule.severity_min}</Badge></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Threshold</dt>
                <dd>{rule.threshold_count} items in {rule.threshold_window_minutes}min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cooldown</dt>
                <dd>{rule.cooldown_minutes} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Host Filter</dt>
                <dd className="font-mono">{rule.host_filter || '(all)'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Categories</dt>
                <dd>
                  {rule.categories.length === 0
                    ? '(all)'
                    : rule.categories.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statistics</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Trigger Count</dt>
                <dd>{rule.trigger_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Triggered</dt>
                <dd>{rule.last_triggered_at ? formatRelativeTime(rule.last_triggered_at) : 'Never'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatRelativeTime(rule.created)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Modified</dt>
                <dd>{formatRelativeTime(rule.modified)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Alerts</CardTitle>
            <Link to={`/drift_alerts?alert_rule=${id}`}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!alerts?.results?.length ? (
            <p className="text-sm text-muted-foreground">No alerts triggered yet.</p>
          ) : (
            <div className="space-y-2">
              {alerts.results.map((alert: DriftAlert) => (
                <Link
                  key={alert.id}
                  to={`/drift_alerts/${alert.id}`}
                  className="flex items-center gap-3 rounded border p-2 hover:bg-accent"
                >
                  <Badge variant={NOTIFICATION_VARIANT[alert.notification_status] ?? 'secondary'}>
                    {alert.notification_status}
                  </Badge>
                  <span className="text-sm">{alert.drift_count} drift items</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatRelativeTime(alert.created)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Alert Rule"
        description={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(undefined, {
          onSuccess: () => navigate('/drift_alert_rules'),
        })}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
