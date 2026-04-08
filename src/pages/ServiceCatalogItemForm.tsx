import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  useServiceCatalogItem,
  useCreateServiceCatalogItem,
  useUpdateServiceCatalogItem,
} from '@/api/hooks/useServiceCatalog'
import { useJobTemplates, useWorkflowJobTemplates } from '@/api/hooks/useTemplates'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { useTeams } from '@/api/hooks/useTeams'

export function ServiceCatalogItemForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: existing } = useServiceCatalogItem(isEdit ? id : undefined)
  const createMutation = useCreateServiceCatalogItem()
  const updateMutation = useUpdateServiceCatalogItem(id ?? '')

  const { data: orgs } = useOrganizations({ page_size: 100 })
  const { data: teams } = useTeams({ page_size: 100 })
  const { data: jts } = useJobTemplates({ page_size: 100 })
  const { data: wfjts } = useWorkflowJobTemplates({ page_size: 100 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('Store')
  const [category, setCategory] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [organization, setOrganization] = useState<string>('')
  const [kind, setKind] = useState<'job_template' | 'workflow_job_template'>('job_template')
  const [templateId, setTemplateId] = useState<string>('')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [approverTeam, setApproverTeam] = useState<string>('')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description || '')
      setIcon(existing.icon || 'Store')
      setCategory(existing.category || '')
      setTagsText((existing.tags || []).join(', '))
      setOrganization(existing.organization ? String(existing.organization) : '')
      if (existing.workflow_job_template) {
        setKind('workflow_job_template')
        setTemplateId(String(existing.workflow_job_template))
      } else if (existing.job_template) {
        setKind('job_template')
        setTemplateId(String(existing.job_template))
      }
      setRequiresApproval(existing.requires_approval)
      setApproverTeam(existing.approver_team ? String(existing.approver_team) : '')
      setEnabled(existing.enabled)
    }
  }, [existing])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean)
    const payload = {
      name,
      description,
      icon,
      category,
      tags,
      organization: organization ? Number(organization) : null,
      job_template: kind === 'job_template' && templateId ? Number(templateId) : null,
      workflow_job_template:
        kind === 'workflow_job_template' && templateId ? Number(templateId) : null,
      requires_approval: requiresApproval,
      approver_team: approverTeam ? Number(approverTeam) : null,
      enabled,
    }

    if (isEdit) {
      updateMutation.mutate(payload, { onSuccess: () => navigate('/service_catalog') })
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/service_catalog') })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const templateOptions = [
    { value: '', label: '-- Select template --' },
    ...((kind === 'job_template' ? jts?.results : wfjts?.results) ?? []).map((t) => ({
      value: String(t.id),
      label: t.name,
    })),
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/service_catalog">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Catalog Item' : 'New Catalog Item'}
        </h1>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Catalog item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Icon (lucide name)</Label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  options={[
                    { value: '', label: '-- Select org --' },
                    ...((orgs?.results ?? []).map((o) => ({
                      value: String(o.id),
                      label: o.name,
                    }))),
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Template kind</Label>
                <Select
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value as 'job_template' | 'workflow_job_template')
                    setTemplateId('')
                  }}
                  options={[
                    { value: 'job_template', label: 'Job Template' },
                    { value: 'workflow_job_template', label: 'Workflow Template' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Underlying template *</Label>
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                options={templateOptions}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
              <Label>Requires approval before launch</Label>
            </div>

            {requiresApproval && (
              <div className="space-y-2">
                <Label>Approver team (optional — falls back to org admins)</Label>
                <Select
                  value={approverTeam}
                  onChange={(e) => setApproverTeam(e.target.value)}
                  options={[
                    { value: '', label: '-- Org admins (fallback) --' },
                    ...((teams?.results ?? []).map((t) => ({
                      value: String(t.id),
                      label: t.name,
                    }))),
                  ]}
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label>Enabled (visible in portal)</Label>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link to="/service_catalog">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
