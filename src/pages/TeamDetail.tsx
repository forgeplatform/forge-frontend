import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTeamDetail, useDeleteTeam } from '@/api/hooks/useTeams'
import { formatRelativeTime } from '@/lib/utils'

export function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const { data: team, isLoading } = useTeamDetail(id!)
  const deleteMutation = useDeleteTeam(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!team) {
    return (
      <div className="space-y-4">
        <Link to="/teams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Teams
        </Link>
        <p className="text-muted-foreground">Team not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/teams"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Teams
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-sm text-muted-foreground">{team.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/teams/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label="Name" value={team.name} />
          <DetailRow label="Description" value={team.description || '–'} />
          <DetailRow
            label="Organization"
            value={team.summary_fields?.organization?.name}
            link={`/organizations/${team.summary_fields?.organization?.id}`}
          />
          <DetailRow label="Created" value={formatRelativeTime(team.created)} />
          <DetailRow label="Modified" value={formatRelativeTime(team.modified)} />
          <DetailRow label="Created By" value={team.summary_fields?.created_by?.username} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Team"
        description={`Are you sure you want to delete "${team.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/teams'),
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
