import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExecutionEnvironmentDetail } from '@/api/hooks/useExecutionEnvironments'
import { formatRelativeTime } from '@/lib/utils'

const pullLabels: Record<string, string> = {
  always: 'Always',
  missing: 'Missing',
  never: 'Never',
}

export function ExecutionEnvironmentDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: ee, isLoading } = useExecutionEnvironmentDetail(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!ee) {
    return (
      <div className="space-y-4">
        <Link to="/execution_environments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Execution Environments
        </Link>
        <p className="text-muted-foreground">Execution environment not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/execution_environments"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Execution Environments
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{ee.name}</h1>
          {ee.managed && <Badge variant="secondary">Managed</Badge>}
        </div>
        {ee.description && (
          <p className="mt-1 text-sm text-muted-foreground">{ee.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label="Image" value={ee.image} mono />
          <DetailRow label="Pull Policy" value={pullLabels[ee.pull] ?? ee.pull} />
          <DetailRow label="Organization" value={ee.summary_fields?.organization?.name ?? 'Global'} />
          <DetailRow label="Credential" value={ee.summary_fields?.credential?.name ?? '–'} />
          <DetailRow label="Managed" value={ee.managed ? 'Yes' : 'No'} />
          <DetailRow label="Created" value={formatRelativeTime(ee.created)} />
          <DetailRow label="Modified" value={formatRelativeTime(ee.modified)} />
        </CardContent>
      </Card>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  )
}
