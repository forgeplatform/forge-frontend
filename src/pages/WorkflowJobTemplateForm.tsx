import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeEditor } from '@/components/CodeEditor'
import {
  useWorkflowJobTemplateDetail,
  useCreateWorkflowJobTemplate,
  useUpdateWorkflowJobTemplate,
} from '@/api/hooks/useTemplates'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { useInventories } from '@/api/hooks/useInventories'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

export function WorkflowJobTemplateForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: template, isLoading } = useWorkflowJobTemplateDetail(id ?? '')
  const createMutation = useCreateWorkflowJobTemplate()
  const updateMutation = useUpdateWorkflowJobTemplate(id ?? '')
  const { data: orgsData } = useOrganizations({ page_size: 200 })
  const { data: inventoriesData } = useInventories({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState('')
  const [inventory, setInventory] = useState('')
  const [limit, setLimit] = useState('')
  const [scmBranch, setScmBranch] = useState('')
  const [jobTags, setJobTags] = useState('')
  const [skipTags, setSkipTags] = useState('')
  const [extraVars, setExtraVars] = useState('---')
  const [allowSimultaneous, setAllowSimultaneous] = useState(false)
  const [surveyEnabled, setSurveyEnabled] = useState(false)
  const [askVariablesOnLaunch, setAskVariablesOnLaunch] = useState(false)
  const [askInventoryOnLaunch, setAskInventoryOnLaunch] = useState(false)
  const [askLimitOnLaunch, setAskLimitOnLaunch] = useState(false)
  const [askScmBranchOnLaunch, setAskScmBranchOnLaunch] = useState(false)
  const [askLabelsOnLaunch, setAskLabelsOnLaunch] = useState(false)
  const [askTagsOnLaunch, setAskTagsOnLaunch] = useState(false)
  const [askSkipTagsOnLaunch, setAskSkipTagsOnLaunch] = useState(false)

  useEffect(() => {
    if (isEdit && template) {
      setName(template.name)
      setDescription(template.description)
      setOrganization(template.organization ? String(template.organization) : '')
      setInventory(template.inventory ? String(template.inventory) : '')
      setLimit(template.limit ?? '')
      setScmBranch(template.scm_branch ?? '')
      setJobTags(template.job_tags ?? '')
      setSkipTags(template.skip_tags ?? '')
      setExtraVars(template.extra_vars || '---')
      setAllowSimultaneous(template.allow_simultaneous)
      setSurveyEnabled(template.survey_enabled)
      setAskVariablesOnLaunch(template.ask_variables_on_launch)
      setAskInventoryOnLaunch(template.ask_inventory_on_launch)
      setAskLimitOnLaunch(template.ask_limit_on_launch)
      setAskScmBranchOnLaunch(template.ask_scm_branch_on_launch)
      setAskLabelsOnLaunch(template.ask_labels_on_launch)
      setAskTagsOnLaunch(template.ask_tags_on_launch)
      setAskSkipTagsOnLaunch(template.ask_skip_tags_on_launch)
    }
  }, [isEdit, template])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name,
      description,
      extra_vars: extraVars,
      allow_simultaneous: allowSimultaneous,
      survey_enabled: surveyEnabled,
      ask_variables_on_launch: askVariablesOnLaunch,
      ask_inventory_on_launch: askInventoryOnLaunch,
      ask_limit_on_launch: askLimitOnLaunch,
      ask_scm_branch_on_launch: askScmBranchOnLaunch,
      ask_labels_on_launch: askLabelsOnLaunch,
      ask_tags_on_launch: askTagsOnLaunch,
      ask_skip_tags_on_launch: askSkipTagsOnLaunch,
    }
    if (organization) payload.organization = Number(organization)
    if (inventory) payload.inventory = Number(inventory)
    else payload.inventory = null
    if (limit) payload.limit = limit
    if (scmBranch) payload.scm_branch = scmBranch
    if (jobTags) payload.job_tags = jobTags
    if (skipTags) payload.skip_tags = skipTags

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/templates/workflow_job_template/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  const orgOptions = [
    { value: '', label: '-- Select Organization --' },
    ...(orgsData?.results ?? []).map((o) => ({ value: String(o.id), label: o.name })),
  ]

  const inventoryOptions = [
    { value: '', label: '-- None --' },
    ...(inventoriesData?.results ?? []).map((i) => ({ value: String(i.id), label: i.name })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/templates"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Workflow Template' : 'Create Workflow Template'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} options={orgOptions} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Select id="inventory" value={inventory} onChange={(e) => setInventory(e.target.value)} options={inventoryOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scm_branch">SCM Branch</Label>
                <Input id="scm_branch" value={scmBranch} onChange={(e) => setScmBranch(e.target.value)} placeholder="e.g. main" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_tags">Job Tags</Label>
                <Input id="job_tags" value={jobTags} onChange={(e) => setJobTags(e.target.value)} placeholder="Comma-separated" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skip_tags">Skip Tags</Label>
              <Input id="skip_tags" value={skipTags} onChange={(e) => setSkipTags(e.target.value)} placeholder="Comma-separated" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch checked={allowSimultaneous} onCheckedChange={setAllowSimultaneous} />
              <Label>Allow Simultaneous Runs</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={surveyEnabled} onCheckedChange={setSurveyEnabled} />
              <Label>Enable Survey</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Prompt on Launch</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Switch checked={askVariablesOnLaunch} onCheckedChange={setAskVariablesOnLaunch} />
              <Label>Variables</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={askInventoryOnLaunch} onCheckedChange={setAskInventoryOnLaunch} />
              <Label>Inventory</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={askLimitOnLaunch} onCheckedChange={setAskLimitOnLaunch} />
              <Label>Limit</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={askScmBranchOnLaunch} onCheckedChange={setAskScmBranchOnLaunch} />
              <Label>SCM Branch</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={askLabelsOnLaunch} onCheckedChange={setAskLabelsOnLaunch} />
              <Label>Labels</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={askTagsOnLaunch} onCheckedChange={setAskTagsOnLaunch} />
              <Label>Job Tags</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={askSkipTagsOnLaunch} onCheckedChange={setAskSkipTagsOnLaunch} />
              <Label>Skip Tags</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Extra Variables</CardTitle></CardHeader>
          <CardContent>
            <CodeEditor
              value={extraVars}
              onChange={(v) => setExtraVars(v ?? '---')}
              language="yaml"
              height="200px"
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
            {isEdit ? 'Save Changes' : 'Create Workflow Template'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
