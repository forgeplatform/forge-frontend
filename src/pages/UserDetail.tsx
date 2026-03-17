import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useUserDetail, useDeleteUser } from '@/api/hooks/useUsers'

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const { data: user, isLoading } = useUserDetail(id!)
  const deleteMutation = useDeleteUser(id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Link to="/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/users"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{user.username}</h1>
            {user.is_superuser && <Badge variant="default">Admin</Badge>}
            {user.is_system_auditor && !user.is_superuser && <Badge variant="secondary">Auditor</Badge>}
            {!user.is_superuser && !user.is_system_auditor && <Badge variant="outline">User</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/users/${id}/edit`}>
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
        {(user.first_name || user.last_name) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {[user.first_name, user.last_name].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <DetailRow label="Username" value={user.username} />
          <DetailRow label="Email" value={user.email || '–'} />
          <DetailRow label="First Name" value={user.first_name || '–'} />
          <DetailRow label="Last Name" value={user.last_name || '–'} />
          <DetailRow label="Superuser" value={user.is_superuser ? 'Yes' : 'No'} />
          <DetailRow label="System Auditor" value={user.is_system_auditor ? 'Yes' : 'No'} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete User"
        description={`Are you sure you want to delete "${user.username}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/users'),
          })
        }}
      />
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
