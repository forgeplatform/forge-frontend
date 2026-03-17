import { Link } from 'react-router-dom'
import { Loader2, Clock, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useResourceSchedules } from '@/api/hooks/useSchedules'
import { formatRelativeTime } from '@/lib/utils'

interface SchedulesTabProps {
  resourceType: string
  resourceId: string
}

export function SchedulesTab({ resourceType, resourceId }: SchedulesTabProps) {
  const { data, isLoading } = useResourceSchedules(resourceType, resourceId)

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {data?.count ?? 0} schedule{(data?.count ?? 0) !== 1 ? 's' : ''}
        </span>
        <Link to="/schedules/new">
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create Schedule
          </Button>
        </Link>
      </div>

      {!data || data.results.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No schedules configured for this resource.
        </div>
      ) : (
        <div className="space-y-2">
          {data.results.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <Link
                      to={`/schedules/${schedule.id}`}
                      className="font-medium text-sm text-primary hover:underline"
                    >
                      {schedule.name}
                    </Link>
                    {schedule.description && (
                      <p className="text-xs text-muted-foreground truncate">{schedule.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={schedule.enabled ? 'success' : 'secondary'}>
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {schedule.next_run ? (
                    <span className="text-xs text-muted-foreground">
                      Next: {formatRelativeTime(schedule.next_run)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No upcoming runs</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
