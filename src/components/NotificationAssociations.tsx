import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Plus, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useNotificationAssociations,
  useAssociateNotification,
  useDisassociateNotification,
} from '@/api/hooks/useNotificationAssociations'
import { useNotificationTemplates } from '@/api/hooks/useNotifications'

type EventType = 'started' | 'success' | 'error'

const EVENT_LABELS: Record<EventType, { label: string; variant: 'secondary' | 'success' | 'error' }> = {
  started: { label: 'Start', variant: 'secondary' },
  success: { label: 'Success', variant: 'success' },
  error: { label: 'Failure', variant: 'error' },
}

interface NotificationAssociationsProps {
  resourceType: string
  resourceId: string
}

export function NotificationAssociations({
  resourceType,
  resourceId,
}: NotificationAssociationsProps) {
  const [addEvent, setAddEvent] = useState<EventType | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(['started', 'success', 'error'] as EventType[]).map((event) => (
          <EventSection
            key={event}
            resourceType={resourceType}
            resourceId={resourceId}
            event={event}
            onAdd={() => setAddEvent(event)}
          />
        ))}

        {addEvent && (
          <AddNotificationDialog
            open={!!addEvent}
            onOpenChange={(v) => { if (!v) setAddEvent(null) }}
            resourceType={resourceType}
            resourceId={resourceId}
            event={addEvent}
          />
        )}
      </CardContent>
    </Card>
  )
}

function EventSection({
  resourceType,
  resourceId,
  event,
  onAdd,
}: {
  resourceType: string
  resourceId: string
  event: EventType
  onAdd: () => void
}) {
  const { data } = useNotificationAssociations(resourceType, resourceId, event)
  const disassociate = useDisassociateNotification(resourceType, resourceId, event)
  const config = EVENT_LABELS[event]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {data?.results.length ?? 0} template{(data?.results.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>
      {data && data.results.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.results.map((nt) => (
            <Badge key={nt.id} variant="outline" className="gap-1 pr-1">
              <Link to={`/notification_templates/${nt.id}`} className="hover:underline">
                {nt.name}
              </Link>
              <button
                type="button"
                onClick={() => disassociate.mutate(nt.id)}
                className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function AddNotificationDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  event,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  resourceType: string
  resourceId: string
  event: EventType
}) {
  const [search, setSearch] = useState('')
  const { data } = useNotificationTemplates({ search: search || undefined, page_size: 15 })
  const associate = useAssociateNotification(resourceType, resourceId, event)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Add Notification — {EVENT_LABELS[event].label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Search notification templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {data?.results.map((nt) => (
              <button
                key={nt.id}
                type="button"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                onClick={() => {
                  associate.mutate(nt.id, { onSuccess: () => onOpenChange(false) })
                }}
              >
                <span className="font-medium">{nt.name}</span>
                <Badge variant="outline" className="text-xs">
                  {nt.notification_type}
                </Badge>
              </button>
            ))}
            {data?.results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No notification templates found</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
