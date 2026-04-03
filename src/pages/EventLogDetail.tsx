import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEventLogDetail } from '@/api/hooks/useEventRules'
import { formatRelativeTime } from '@/lib/utils'

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

export function EventLogDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: log, isLoading } = useEventLogDetail(id!)

  if (isLoading) return <DetailPageSkeleton />

  if (!log) {
    return (
      <div className="space-y-4">
        <Link to="/event_logs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Event Logs
        </Link>
        <p className="text-muted-foreground">Event log not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/event_logs"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Event Logs
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Event Log #{log.id}</h1>
          <Badge variant={STATUS_VARIANT[log.status] ?? 'outline'}>
            {log.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Event Info</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Rule</dt>
                <dd>
                  {log.event_rule ? (
                    <Link to={`/event_rules/${log.event_rule}`} className="text-primary hover:underline">
                      {log.event_rule_name}
                    </Link>
                  ) : (
                    <span>{log.event_rule_name || 'Deleted'}</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Event Type</dt>
                <dd>{log.event_type || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Event GUID</dt>
                <dd className="font-mono text-xs max-w-[200px] truncate" title={log.event_guid}>
                  {log.event_guid || '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source Type</dt>
                <dd>{log.source_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source IP</dt>
                <dd className="font-mono">{log.source_ip ?? '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Received</dt>
                <dd>{formatRelativeTime(log.created)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Conditions Matched</dt>
                <dd>
                  <Badge variant={log.conditions_matched ? 'success' : 'secondary'}>
                    {log.conditions_matched ? 'Yes' : 'No'}
                  </Badge>
                </dd>
              </div>
              {log.job_id && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Job</dt>
                  <dd>
                    <Link to={`/jobs/${log.job_id}`} className="text-primary hover:underline">
                      #{log.job_id}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Condition Results</CardTitle></CardHeader>
          <CardContent>
            {log.condition_results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conditions evaluated.</p>
            ) : (
              <ul className="space-y-2">
                {log.condition_results.map((cr, i) => (
                  <li key={i} className="rounded border p-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={cr.matched ? 'success' : 'error'} className="text-xs">
                        {cr.matched ? 'PASS' : 'FAIL'}
                      </Badge>
                      <code className="text-xs">{cr.expression}</code>
                    </div>
                    {cr.description && (
                      <p className="text-xs text-muted-foreground">{cr.description}</p>
                    )}
                    {cr.error && (
                      <p className="text-xs text-destructive">{cr.error}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions Triggered */}
      {log.actions_triggered.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Actions Triggered</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {log.actions_triggered.map((action, i) => (
                <li key={i} className="flex items-center gap-3 rounded border p-3">
                  <Badge variant={action.status === 'success' ? 'success' : 'error'}>
                    {action.status}
                  </Badge>
                  <span className="text-sm">{action.action_type.replace('_', ' ')}</span>
                  <span className="text-sm text-muted-foreground">Target: {action.target_id}</span>
                  {action.job_id && (
                    <Link to={`/jobs/${action.job_id}`} className="text-sm text-primary hover:underline">
                      Job #{action.job_id}
                    </Link>
                  )}
                  {action.error && (
                    <span className="text-sm text-destructive">{action.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {log.error_detail && (
        <Card>
          <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap text-destructive">{log.error_detail}</pre>
          </CardContent>
        </Card>
      )}

      {/* Payload */}
      <Card>
        <CardHeader><CardTitle>Payload</CardTitle></CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded bg-muted p-4 text-xs font-mono">
            {JSON.stringify(log.payload, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Headers */}
      <Card>
        <CardHeader><CardTitle>Headers</CardTitle></CardHeader>
        <CardContent>
          <pre className="max-h-48 overflow-auto rounded bg-muted p-4 text-xs font-mono">
            {JSON.stringify(log.headers, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
