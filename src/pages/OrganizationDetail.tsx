import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Pencil } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RBACPanel } from '@/components/RBACPanel'
import { useOrganizationDetail, useDeleteOrganization } from '@/api/hooks/useOrganizations'
import { formatRelativeTime } from '@/lib/utils'

export function OrganizationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const { data: org, isLoading } = useOrganizationDetail(id!)
  const deleteMutation = useDeleteOrganization(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!org) {
    return (
      <div className="space-y-4">
        <Link to="/organizations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Organizations
        </Link>
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    )
  }

  const counts = org.summary_fields?.related_field_counts

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/organizations"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Organizations
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            {org.description && (
              <p className="text-sm text-muted-foreground">{org.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/organizations/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {counts && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Users" count={counts.users ?? 0} link={`/users?organization=${org.id}`} />
          <StatCard label="Teams" count={counts.teams ?? 0} link={`/teams?organization=${org.id}`} />
          <StatCard label="Inventories" count={counts.inventories ?? 0} />
          <StatCard label="Projects" count={counts.projects ?? 0} />
          <StatCard label="Job Templates" count={counts.job_templates ?? 0} />
          <StatCard label="Admins" count={counts.admins ?? 0} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label="Max Hosts" value={org.max_hosts === 0 ? 'Unlimited' : String(org.max_hosts)} />
          <DetailRow label="Created" value={formatRelativeTime(org.created)} />
          <DetailRow label="Modified" value={formatRelativeTime(org.modified)} />
          <DetailRow label="Created By" value={org.summary_fields?.created_by?.username} />
          <DetailRow label="Modified By" value={org.summary_fields?.modified_by?.username} />
        </CardContent>
      </Card>

      <RBACPanel objectRoles={org.summary_fields?.object_roles} />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Organization"
        description={`Are you sure you want to delete "${org.name}"? All associated resources will be affected. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/organizations'),
          })
        }}
      />
    </div>
  )
}

function StatCard({ label, count, link }: { label: string; count: number; link?: string }) {
  const content = (
    <Card className={link ? 'transition-colors hover:border-primary/50' : ''}>
      <CardContent className="flex items-center justify-between p-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold">{count}</span>
      </CardContent>
    </Card>
  )
  if (link) return <Link to={link}>{content}</Link>
  return content
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span>{value || '–'}</span>
    </div>
  )
}
