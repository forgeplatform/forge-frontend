import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeEditor } from '@/components/CodeEditor'
import { useInventoryDetail, useCreateInventory, useUpdateInventory } from '@/api/hooks/useInventories'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

const kindOptions = [
  { value: '', label: 'Standard' },
  { value: 'smart', label: 'Smart' },
  { value: 'constructed', label: 'Constructed' },
]

export function InventoryForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: inventory, isLoading } = useInventoryDetail(id ?? '')
  const createMutation = useCreateInventory()
  const updateMutation = useUpdateInventory(id ?? '')
  const { data: orgsData } = useOrganizations({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState('')
  const [kind, setKind] = useState('')
  const [variables, setVariables] = useState('---')

  useEffect(() => {
    if (isEdit && inventory) {
      setName(inventory.name)
      setDescription(inventory.description)
      setOrganization(String(inventory.organization))
      setKind(inventory.kind)
      setVariables(inventory.variables || '---')
    }
  }, [isEdit, inventory])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name,
      description,
      kind,
      variables,
    }
    if (organization) payload.organization = Number(organization)

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/inventories/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  const orgOptions = [
    { value: '', label: '-- Select Organization --' },
    ...(orgsData?.results ?? []).map((o) => ({
      value: String(o.id),
      label: o.name,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/inventories"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Inventories
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Inventory' : 'Create Inventory'}
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
                <Select id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} options={orgOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kind">Inventory Type</Label>
                <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value)} options={kindOptions} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Variables</CardTitle></CardHeader>
          <CardContent>
            <CodeEditor
              value={variables}
              onChange={setVariables}
              language="yaml"
              height="250px"
            />
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
            {isEdit ? 'Save Changes' : 'Create Inventory'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
