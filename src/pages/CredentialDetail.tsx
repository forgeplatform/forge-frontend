import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Pencil, Copy } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CopyDialog } from '@/components/CopyDialog'
import { useCopyResource } from '@/api/hooks/useCopy'
import { useCredentialDetail, useDeleteCredential } from '@/api/hooks/useCredentials'
import { formatRelativeTime } from '@/lib/utils'

export function CredentialDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const { data: credential, isLoading } = useCredentialDetail(id!)
  const deleteMutation = useDeleteCredential(id!)
  const copyMutation = useCopyResource('credentials', id!)

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!credential) {
    return (
      <div className="space-y-4">
        <Link to="/credentials" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Credentials
        </Link>
        <p className="text-muted-foreground">Credential not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/credentials"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Credentials
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{credential.name}</h1>
              <Badge variant="outline">
                {credential.summary_fields?.credential_type?.name ?? 'Unknown'}
              </Badge>
            </div>
            {credential.description && (
              <p className="text-sm text-muted-foreground">{credential.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/credentials/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowCopy(true)}>
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </Button>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Type" value={credential.summary_fields?.credential_type?.name} />
            <DetailRow label="Kind" value={credential.summary_fields?.credential_type?.kind} />
            <DetailRow
              label="Organization"
              value={credential.summary_fields?.organization?.name}
              link={credential.summary_fields?.organization ? `/organizations/${credential.summary_fields.organization.id}` : undefined}
            />
            <DetailRow label="Cloud" value={credential.cloud ? 'Yes' : 'No'} />
            <DetailRow label="Kubernetes" value={credential.kubernetes ? 'Yes' : 'No'} />
            <DetailRow label="Managed" value={credential.managed ? 'Yes' : 'No'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Created" value={formatRelativeTime(credential.created)} />
            <DetailRow label="Modified" value={formatRelativeTime(credential.modified)} />
            <DetailRow label="Created By" value={credential.summary_fields?.created_by?.username} />
            <DetailRow label="Modified By" value={credential.summary_fields?.modified_by?.username} />
          </CardContent>
        </Card>

        {credential.summary_fields?.owners && credential.summary_fields.owners.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Owners</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {credential.summary_fields.owners.map((owner) => (
                  <Badge key={`${owner.type}-${owner.id}`} variant="secondary">
                    {owner.name} ({owner.type})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CopyDialog
        open={showCopy}
        onOpenChange={setShowCopy}
        originalName={credential.name}
        isPending={copyMutation.isPending}
        onCopy={(name) => {
          copyMutation.mutate({ name }, {
            onSuccess: (data) => {
              setShowCopy(false)
              navigate(`/credentials/${data.id}`)
            },
          })
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Credential"
        description={`Are you sure you want to delete "${credential.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/credentials'),
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
      {link ? (
        <Link to={link} className="text-primary hover:underline">{display}</Link>
      ) : (
        <span>{display}</span>
      )}
    </div>
  )
}
