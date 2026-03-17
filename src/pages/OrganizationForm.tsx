import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganizationDetail, useCreateOrganization, useUpdateOrganization } from '@/api/hooks/useOrganizations'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

export function OrganizationForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: org, isLoading } = useOrganizationDetail(id ?? '')
  const createMutation = useCreateOrganization()
  const updateMutation = useUpdateOrganization(id ?? '')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxHosts, setMaxHosts] = useState('0')

  useEffect(() => {
    if (isEdit && org) {
      setName(org.name)
      setDescription(org.description)
      setMaxHosts(String(org.max_hosts))
    }
  }, [isEdit, org])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name,
      description,
      max_hosts: Number(maxHosts),
    }

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/organizations/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

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
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Organization' : 'Create Organization'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_hosts">Max Hosts</Label>
              <Input id="max_hosts" type="number" min="0" value={maxHosts} onChange={(e) => setMaxHosts(e.target.value)} />
              <p className="text-xs text-muted-foreground">Set to 0 for unlimited.</p>
            </div>
          </CardContent>
        </Card>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message || 'An error occurred.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !name}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create Organization'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
