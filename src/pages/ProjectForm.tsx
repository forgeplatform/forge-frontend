import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectDetail, useCreateProject, useUpdateProject } from '@/api/hooks/useProjects'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { useCredentials } from '@/api/hooks/useCredentials'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

const scmTypeOptions = [
  { value: '', label: 'Manual' },
  { value: 'git', label: 'Git' },
  { value: 'svn', label: 'Subversion' },
  { value: 'archive', label: 'Archive' },
  { value: 'insights', label: 'Insights' },
]

export function ProjectForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: project, isLoading } = useProjectDetail(id ?? '')
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject(id ?? '')
  const { data: orgsData } = useOrganizations({ page_size: 200 })
  const { data: credentialsData } = useCredentials({ page_size: 200, credential_type: undefined })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState('')
  const [scmType, setScmType] = useState('git')
  const [scmUrl, setScmUrl] = useState('')
  const [scmBranch, setScmBranch] = useState('')
  const [credential, setCredential] = useState('')
  const [scmClean, setScmClean] = useState(false)
  const [scmDeleteOnUpdate, setScmDeleteOnUpdate] = useState(false)
  const [scmTrackSubmodules, setScmTrackSubmodules] = useState(false)
  const [scmUpdateOnLaunch, setScmUpdateOnLaunch] = useState(false)
  const [scmUpdateCacheTimeout, setScmUpdateCacheTimeout] = useState('0')
  const [allowOverride, setAllowOverride] = useState(false)

  useEffect(() => {
    if (isEdit && project) {
      setName(project.name)
      setDescription(project.description)
      setOrganization(project.summary_fields?.organization?.id?.toString() ?? '')
      setScmType(project.scm_type)
      setScmUrl(project.scm_url)
      setScmBranch(project.scm_branch)
      setCredential(project.summary_fields?.credential?.id?.toString() ?? '')
      setScmClean(project.scm_clean)
      setScmDeleteOnUpdate(project.scm_delete_on_update)
      setScmTrackSubmodules(project.scm_track_submodules)
      setScmUpdateOnLaunch(project.scm_update_on_launch)
      setScmUpdateCacheTimeout(String(project.scm_update_cache_timeout))
      setAllowOverride(project.allow_override)
    }
  }, [isEdit, project])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name,
      description,
      scm_type: scmType,
      scm_url: scmUrl,
      scm_branch: scmBranch,
      scm_clean: scmClean,
      scm_delete_on_update: scmDeleteOnUpdate,
      scm_track_submodules: scmTrackSubmodules,
      scm_update_on_launch: scmUpdateOnLaunch,
      scm_update_cache_timeout: Number(scmUpdateCacheTimeout),
      allow_override: allowOverride,
    }
    if (organization) payload.organization = Number(organization)
    if (credential) payload.credential = Number(credential)

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/projects/${data.id}`),
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

  const credentialOptions = [
    { value: '', label: '-- No Credential --' },
    ...(credentialsData?.results ?? []).map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/projects"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Project' : 'Create Project'}
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
              <Label htmlFor="organization">Organization</Label>
              <Select id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} options={orgOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Source Control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scm_type">SCM Type</Label>
                <Select id="scm_type" value={scmType} onChange={(e) => setScmType(e.target.value)} options={scmTypeOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential">SCM Credential</Label>
                <Select id="credential" value={credential} onChange={(e) => setCredential(e.target.value)} options={credentialOptions} />
              </div>
            </div>
            {scmType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="scm_url">SCM URL *</Label>
                  <Input id="scm_url" value={scmUrl} onChange={(e) => setScmUrl(e.target.value)} placeholder="https://github.com/..." className="font-mono text-sm" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scm_branch">SCM Branch</Label>
                    <Input id="scm_branch" value={scmBranch} onChange={(e) => setScmBranch(e.target.value)} placeholder="main" className="font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cache_timeout">Cache Timeout (seconds)</Label>
                    <Input id="cache_timeout" type="number" min="0" value={scmUpdateCacheTimeout} onChange={(e) => setScmUpdateCacheTimeout(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch id="scm_clean" checked={scmClean} onCheckedChange={setScmClean} />
                    <Label htmlFor="scm_clean">Clean</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="scm_delete" checked={scmDeleteOnUpdate} onCheckedChange={setScmDeleteOnUpdate} />
                    <Label htmlFor="scm_delete">Delete on Update</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="scm_submodules" checked={scmTrackSubmodules} onCheckedChange={setScmTrackSubmodules} />
                    <Label htmlFor="scm_submodules">Track Submodules</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="scm_update" checked={scmUpdateOnLaunch} onCheckedChange={setScmUpdateOnLaunch} />
                    <Label htmlFor="scm_update">Update on Launch</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="allow_override" checked={allowOverride} onCheckedChange={setAllowOverride} />
                    <Label htmlFor="allow_override">Allow Branch Override</Label>
                  </div>
                </div>
              </>
            )}
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
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
