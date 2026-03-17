import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { CodeEditor } from '@/components/CodeEditor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHostDetail, useToggleHost } from '@/api/hooks/useHosts'
import { formatRelativeTime } from '@/lib/utils'

export function HostDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: host, isLoading } = useHostDetail(id!)
  const toggle = useToggleHost(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!host) {
    return (
      <div className="space-y-4">
        <Link to="/hosts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Hosts
        </Link>
        <p className="text-muted-foreground">Host not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/hosts"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Hosts
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{host.name}</h1>
              <Badge variant={host.enabled ? 'success' : 'secondary'}>
                {host.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {host.has_active_failures && <Badge variant="error">Failures</Badge>}
            </div>
            {host.description && (
              <p className="text-sm text-muted-foreground">{host.description}</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toggle.mutate(!host.enabled)}
            disabled={toggle.isPending}
          >
            {host.enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Name" value={host.name} />
            <DetailRow
              label="Inventory"
              value={host.summary_fields?.inventory?.name}
              link={`/inventories/${host.inventory}`}
            />
            <DetailRow label="Instance ID" value={host.instance_id || '–'} />
            <DetailRow label="Created" value={formatRelativeTime(host.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(host.modified)} />
            {host.summary_fields?.last_job && (
              <DetailRow
                label="Last Job"
                value={`#${host.summary_fields.last_job.id} — ${host.summary_fields.last_job.name}`}
                link={`/jobs/${host.summary_fields.last_job.id}`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {host.summary_fields?.groups?.results?.length ? (
              <div className="flex flex-wrap gap-2">
                {host.summary_fields.groups.results.map((g) => (
                  <Badge key={g.id} variant="outline">{g.name}</Badge>
                ))}
                {(host.summary_fields.groups.count ?? 0) > host.summary_fields.groups.results.length && (
                  <span className="text-xs text-muted-foreground">
                    +{host.summary_fields.groups.count - host.summary_fields.groups.results.length} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No groups</p>
            )}
          </CardContent>
        </Card>
      </div>

      {host.variables && (
        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeEditor
              value={host.variables}
              language="yaml"
              readOnly
              height="200px"
            />
          </CardContent>
        </Card>
      )}

      {host.summary_fields?.recent_jobs?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {host.summary_fields.recent_jobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between">
                  <Link to={`/jobs/${j.id}`} className="text-primary hover:underline">
                    {j.name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <Badge variant={j.status === 'successful' ? 'success' : j.status === 'failed' ? 'error' : 'secondary'}>
                      {j.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(j.finished)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
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
  const display = value || '–'
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {link && value ? (
        <Link to={link} className="text-primary hover:underline">
          {display}
        </Link>
      ) : (
        <span>{display}</span>
      )}
    </div>
  )
}
