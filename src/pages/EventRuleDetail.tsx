import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  Power,
  PowerOff,
  RefreshCw,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  useEventRuleDetail,
  useDeleteEventRule,
  useToggleEventRule,
  useEventRuleWebhookKey,
  useRotateEventRuleWebhookKey,
  useEventRuleEventLogs,
} from '@/api/hooks/useEventRules'
import { formatRelativeTime } from '@/lib/utils'
import type { EventLog } from '@/api/types'

const SOURCE_TYPE_LABELS: Record<string, string> = {
  webhook_generic: 'Generic Webhook',
  webhook_github: 'GitHub',
  webhook_gitlab: 'GitLab',
  alertmanager: 'Alertmanager',
  pagerduty: 'PagerDuty',
  datadog: 'Datadog',
  cloudwatch: 'CloudWatch',
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  launch_job_template: 'Launch Job Template',
  launch_workflow: 'Launch Workflow',
  send_notification: 'Send Notification',
}

const STATUS_VARIANT: Record<string, 'success' | 'error' | 'secondary' | 'outline'> = {
  action_fired: 'success',
  matched: 'success',
  unmatched: 'secondary',
  throttled: 'outline',
  action_failed: 'error',
  error: 'error',
  signature_failed: 'error',
  received: 'outline',
}

export function EventRuleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const { data: rule, isLoading } = useEventRuleDetail(id!)
  const deleteMutation = useDeleteEventRule(id!)
  const toggleMutation = useToggleEventRule(id!)
  const { data: keyData } = useEventRuleWebhookKey(id!)
  const rotateKeyMutation = useRotateEventRuleWebhookKey(id!)
  const { data: eventLogs } = useEventRuleEventLogs(id!)

  if (isLoading) return <DetailPageSkeleton />

  if (!rule) {
    return (
      <div className="space-y-4">
        <Link to="/event_rules" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Event Rules
        </Link>
        <p className="text-muted-foreground">Event rule not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/event_rules"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Event Rules
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{rule.name}</h1>
              <Badge variant="outline">{SOURCE_TYPE_LABELS[rule.source_type] ?? rule.source_type}</Badge>
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
            <Link to={`/event_rules/${id}/edit`}>
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

      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Webhook Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                {rule.webhook_url}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(rule.webhook_url)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Webhook Key</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                {showKey ? (keyData?.webhook_key ?? '...') : '••••••••••••••••••••'}
              </code>
              <Button variant="outline" size="sm" onClick={() => setShowKey(!showKey)}>
                <KeyRound className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => rotateKeyMutation.mutate()}
                disabled={rotateKeyMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source Type</dt>
                <dd>{SOURCE_TYPE_LABELS[rule.source_type] ?? rule.source_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Webhook Path</dt>
                <dd className="font-mono">{rule.webhook_path}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Throttle</dt>
                <dd>{rule.throttle_seconds > 0 ? `${rule.throttle_seconds}s` : 'None'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fire Count</dt>
                <dd>{rule.fire_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Fired</dt>
                <dd>{rule.last_fired_at ? formatRelativeTime(rule.last_fired_at) : 'Never'}</dd>
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

        <Card>
          <CardHeader>
            <CardTitle>Conditions ({rule.conditions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {rule.conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conditions (always matches)</p>
            ) : (
              <ul className="space-y-2">
                {rule.conditions.map((c, i) => (
                  <li key={i} className="rounded border p-2">
                    <code className="text-xs">{c.jinja2_expression}</code>
                    {c.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions ({rule.actions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {rule.actions.map((a, i) => (
              <li key={i} className="flex items-center gap-3 rounded border p-3">
                <Badge variant="outline">{ACTION_TYPE_LABELS[a.action_type] ?? a.action_type}</Badge>
                <span className="text-sm">Target ID: {a.target_id}</span>
                {a.description && (
                  <span className="text-sm text-muted-foreground">{a.description}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recent Event Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Event Logs</CardTitle>
            <Link to={`/event_logs?event_rule=${id}`}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!eventLogs?.results?.length ? (
            <p className="text-sm text-muted-foreground">No events received yet.</p>
          ) : (
            <div className="space-y-2">
              {eventLogs.results.map((log: EventLog) => (
                <Link
                  key={log.id}
                  to={`/event_logs/${log.id}`}
                  className="flex items-center gap-3 rounded border p-2 hover:bg-accent"
                >
                  <Badge variant={STATUS_VARIANT[log.status] ?? 'outline'}>
                    {log.status}
                  </Badge>
                  <span className="text-sm">{log.event_type || 'unknown'}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatRelativeTime(log.created)}
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
        title="Delete Event Rule"
        description={`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(undefined, {
          onSuccess: () => navigate('/event_rules'),
        })}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
