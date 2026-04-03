import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Send } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  useOutboundWebhookDetail,
  useDeleteOutboundWebhook,
  useTestOutboundWebhook,
} from '@/api/hooks/useEventRules'
import { formatRelativeTime } from '@/lib/utils'

export function OutboundWebhookDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)

  const { data: webhook, isLoading } = useOutboundWebhookDetail(id!)
  const deleteMutation = useDeleteOutboundWebhook(id!)
  const testMutation = useTestOutboundWebhook(id!)

  if (isLoading) return <DetailPageSkeleton />

  if (!webhook) {
    return (
      <div className="space-y-4">
        <Link to="/outbound_webhooks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Outbound Webhooks
        </Link>
        <p className="text-muted-foreground">Outbound webhook not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/outbound_webhooks"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Outbound Webhooks
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{webhook.name}</h1>
              <Badge variant={webhook.enabled ? 'success' : 'secondary'}>
                {webhook.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {webhook.description && (
              <p className="text-sm text-muted-foreground">{webhook.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              <Send className="mr-1 h-4 w-4" />Test
            </Button>
            <Link to={`/outbound_webhooks/${id}/edit`}>
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
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Target URL</dt>
                <dd className="font-mono text-xs max-w-[250px] truncate" title={webhook.target_url}>
                  {webhook.target_url}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">SSL Verify</dt>
                <dd>{webhook.ssl_verify ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Status</dt>
                <dd>
                  {webhook.last_status ? (
                    <Badge variant={webhook.last_status === 'success' ? 'success' : 'error'}>
                      {webhook.last_status}
                    </Badge>
                  ) : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Sent</dt>
                <dd>{webhook.last_sent_at ? formatRelativeTime(webhook.last_sent_at) : 'Never'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatRelativeTime(webhook.created)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Modified</dt>
                <dd>{formatRelativeTime(webhook.modified)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscribed Events</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {webhook.events.map(e => (
                <Badge key={e} variant="outline">{e}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {webhook.last_error && (
        <Card>
          <CardHeader><CardTitle className="text-destructive">Last Error</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap text-destructive">{webhook.last_error}</pre>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Outbound Webhook"
        description={`Are you sure you want to delete "${webhook.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(undefined, {
          onSuccess: () => navigate('/outbound_webhooks'),
        })}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
