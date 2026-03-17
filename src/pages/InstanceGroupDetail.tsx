import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useInstanceGroupDetail } from '@/api/hooks/useInstances'
import { formatRelativeTime } from '@/lib/utils'

export function InstanceGroupDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: group, isLoading } = useInstanceGroupDetail(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <Link to="/instance_groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Instance Groups
        </Link>
        <p className="text-muted-foreground">Instance group not found.</p>
      </div>
    )
  }

  const capacityUsed = group.capacity - (group.capacity * group.percent_capacity_remaining / 100)

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/instance_groups"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Instance Groups
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
          <Badge variant={group.is_container_group ? 'outline' : 'secondary'}>
            {group.is_container_group ? 'Container Group' : 'Standard'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Total Capacity" value={String(group.capacity)} />
            <DetailRow label="Used" value={String(Math.round(capacityUsed))} />
            <DetailRow label="Remaining" value={`${group.percent_capacity_remaining.toFixed(0)}%`} />
            <DetailRow label="Running Jobs" value={String(group.jobs_running)} />
            <DetailRow label="Total Jobs" value={String(group.jobs_total)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Instances" value={String(group.instances)} />
            <DetailRow label="Min Instance Policy" value={String(group.policy_instance_minimum)} />
            <DetailRow label="Instance Percentage" value={`${group.policy_instance_percentage}%`} />
            <DetailRow label="Max Concurrent Jobs" value={group.max_concurrent_jobs ? String(group.max_concurrent_jobs) : 'Unlimited'} />
            <DetailRow label="Max Forks" value={group.max_forks ? String(group.max_forks) : 'Unlimited'} />
            <DetailRow label="Created" value={formatRelativeTime(group.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(group.modified)} />
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
