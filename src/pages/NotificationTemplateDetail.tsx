import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, Trash2, Send, Copy } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyDialog } from '@/components/CopyDialog'
import { useCopyResource } from '@/api/hooks/useCopy'
import {
  useNotificationTemplateDetail,
  useDeleteNotificationTemplate,
  useTestNotificationTemplate,
  useNotificationTemplateNotifications,
} from '@/api/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  awssns: 'AWS SNS',
  email: 'Email',
  slack: 'Slack',
  twilio: 'Twilio',
  pagerduty: 'PagerDuty',
  grafana: 'Grafana',
  webhook: 'Webhook',
  mattermost: 'Mattermost',
  rocketchat: 'Rocket.Chat',
  irc: 'IRC',
}

export function NotificationTemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [showCopy, setShowCopy] = useState(false)

  const { data: template, isLoading } = useNotificationTemplateDetail(id!)
  const deleteMutation = useDeleteNotificationTemplate(id!)
  const testMutation = useTestNotificationTemplate(id!)
  const copyMutation = useCopyResource('notification_templates', id!)
  const { data: notifications } = useNotificationTemplateNotifications(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <Link to="/notification_templates" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Notification Templates
        </Link>
        <p className="text-muted-foreground">Notification template not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/notification_templates"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Notification Templates
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
              <Badge variant="outline">
                {TYPE_LABELS[template.notification_type] ?? template.notification_type}
              </Badge>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Test
            </Button>
            <Link to={`/notification_templates/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Type" value={TYPE_LABELS[template.notification_type] ?? template.notification_type} />
            <DetailRow
              label="Organization"
              value={template.summary_fields?.organization?.name}
              link={template.summary_fields?.organization ? `/organizations/${template.summary_fields.organization.id}` : undefined}
            />
            <DetailRow label="Created" value={formatRelativeTime(template.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(template.modified)} />
            <DetailRow label="Created By" value={template.summary_fields?.created_by?.username} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <CardContent>
            {template.notification_configuration && Object.keys(template.notification_configuration).length > 0 ? (
              <div className="space-y-2 text-sm">
                {Object.entries(template.notification_configuration).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                    <span className="truncate max-w-[200px]">
                      {typeof value === 'string' && value.startsWith('$encrypted$')
                        ? '********'
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No configuration.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {notifications && notifications.results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.results.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={n.status === 'successful' ? 'success' : n.status === 'failed' ? 'error' : 'secondary'}>
                      {n.status}
                    </Badge>
                    <span className="text-muted-foreground">{formatRelativeTime(n.created)}</span>
                  </div>
                  {n.error && (
                    <span className="text-xs text-destructive truncate max-w-[300px]">{n.error}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <CopyDialog
        open={showCopy}
        onOpenChange={setShowCopy}
        originalName={template.name}
        isPending={copyMutation.isPending}
        onCopy={(name) => {
          copyMutation.mutate({ name }, {
            onSuccess: (data) => {
              setShowCopy(false)
              navigate(`/notification_templates/${data.id}`)
            },
          })
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Notification Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/notification_templates'),
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
}: {
  label: string
  value?: string
  link?: string
}) {
  const display = value || '-'
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <Link to={link} className="text-primary hover:underline">{display}</Link>
      ) : (
        <span>{display}</span>
      )}
    </div>
  )
}
