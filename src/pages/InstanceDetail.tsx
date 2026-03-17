import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, HeartPulse } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useInstanceDetail, useHealthCheckInstance } from '@/api/hooks/useInstances'
import { formatRelativeTime } from '@/lib/utils'

export function InstanceDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: instance, isLoading } = useInstanceDetail(id!)
  const healthCheck = useHealthCheckInstance(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!instance) {
    return (
      <div className="space-y-4">
        <Link to="/instances" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Instances
        </Link>
        <p className="text-muted-foreground">Instance not found.</p>
      </div>
    )
  }

  const capacityUsed = instance.capacity - (instance.capacity * instance.percent_capacity_remaining / 100)

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/instances"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Instances
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{instance.hostname}</h1>
              <Badge variant={instance.enabled ? 'success' : 'error'}>
                {instance.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Badge variant="secondary">
                {instance.node_type.charAt(0).toUpperCase() + instance.node_type.slice(1)}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => healthCheck.mutate()}
            disabled={healthCheck.isPending}
          >
            <HeartPulse className={`mr-1 h-4 w-4${healthCheck.isPending ? ' animate-pulse' : ''}`} />
            Health Check
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Total Capacity" value={String(instance.capacity)} />
            <DetailRow label="Used" value={String(Math.round(capacityUsed))} />
            <DetailRow label="Remaining" value={`${instance.percent_capacity_remaining.toFixed(0)}%`} />
            <DetailRow label="CPU Capacity" value={String(instance.cpu_capacity)} />
            <DetailRow label="Memory Capacity" value={String(instance.mem_capacity)} />
            <DetailRow label="Running Jobs" value={String(instance.jobs_running)} />
            <DetailRow label="Total Jobs" value={String(instance.jobs_total)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Node Type" value={instance.node_type} />
            <DetailRow label="Node State" value={instance.node_state} />
            <DetailRow label="Version" value={instance.version || '–'} />
            <DetailRow label="CPU" value={String(instance.cpu)} />
            <DetailRow label="Memory" value={`${(instance.memory / 1073741824).toFixed(1)} GB`} />
            <DetailRow label="Last Seen" value={instance.last_seen ? formatRelativeTime(instance.last_seen) : 'Never'} />
            <DetailRow label="Created" value={formatRelativeTime(instance.created)} />
            {instance.errors && (
              <div>
                <span className="text-muted-foreground">Errors</span>
                <p className="mt-1 text-sm text-destructive">{instance.errors}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
