import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CodeEditor } from '@/components/CodeEditor'
import {
  usePolicy,
  useCreatePolicy,
  useUpdatePolicy,
  useTestPolicy,
} from '@/api/hooks/usePolicies'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import type { PolicyAppliesTo, PolicyEnforcement, PolicyTestResponse } from '@/api/types'

const APPLIES: PolicyAppliesTo[] = ['job_template', 'workflow_job_template', 'ad_hoc_command']

const REGO_PLACEHOLDER = `package forail.launch

# Deny launches against the prod-web inventory after 18:00 UTC
default deny := false
deny if {
  input.inventory.name == "prod-web"
  hour := time.parse_rfc3339_ns(input.now_iso) / 1e9 / 3600 % 24
  hour >= 18
}`

export function PolicyForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: existing } = usePolicy(isEdit ? id : undefined)
  const createMutation = useCreatePolicy()
  const updateMutation = useUpdatePolicy(id ?? '')
  const testMutation = useTestPolicy(id ?? '')

  const { data: orgs } = useOrganizations({ page_size: 100 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState<string>('')
  const [packagePath, setPackagePath] = useState('forail.launch')
  const [enforcement, setEnforcement] = useState<PolicyEnforcement>('enforce')
  const [enabled, setEnabled] = useState(true)
  const [appliesTo, setAppliesTo] = useState<PolicyAppliesTo[]>([])
  const [rego, setRego] = useState(REGO_PLACEHOLDER)
  const [testInput, setTestInput] = useState('{\n  "inventory": { "name": "prod-web" },\n  "now_iso": "2026-04-08T19:30:00Z"\n}')
  const [testResult, setTestResult] = useState<PolicyTestResponse | null>(null)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description || '')
      setOrganization(existing.organization ? String(existing.organization) : '')
      setPackagePath(existing.package_path || 'forail.launch')
      setEnforcement(existing.enforcement)
      setEnabled(existing.enabled)
      setAppliesTo(existing.applies_to || [])
      setRego(existing.rego_module || REGO_PLACEHOLDER)
    }
  }, [existing])

  const toggleApplies = (t: PolicyAppliesTo) => {
    setAppliesTo((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      description,
      organization: organization ? Number(organization) : null,
      package_path: packagePath,
      enforcement,
      enabled,
      applies_to: appliesTo,
      rego_module: rego,
    }
    if (isEdit) {
      updateMutation.mutate(payload, { onSuccess: () => navigate('/policies') })
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/policies') })
    }
  }

  const handleTest = () => {
    if (!isEdit) {
      alert('Save the policy first to enable test runs.')
      return
    }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(testInput)
    } catch (e) {
      alert(`Input is not valid JSON: ${e}`)
      return
    }
    testMutation.mutate(parsed, {
      onSuccess: (data) => setTestResult(data),
    })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/policies">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Policy' : 'New Policy'}
        </h1>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Organization (blank = global)</Label>
                <Select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  options={[
                    { value: '', label: '-- Global --' },
                    ...((orgs?.results ?? []).map((o) => ({ value: String(o.id), label: o.name }))),
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Package path</Label>
                <Input
                  value={packagePath}
                  onChange={(e) => setPackagePath(e.target.value)}
                  placeholder="forail.launch"
                />
              </div>
              <div className="space-y-2">
                <Label>Enforcement</Label>
                <Select
                  value={enforcement}
                  onChange={(e) => setEnforcement(e.target.value as PolicyEnforcement)}
                  options={[
                    { value: 'warn', label: 'Warn only (log, don\'t block)' },
                    { value: 'enforce', label: 'Enforce (block on deny)' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applies to (empty = all)</Label>
              <div className="flex flex-wrap gap-3">
                {APPLIES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={appliesTo.includes(t)}
                      onCheckedChange={() => toggleApplies(t)}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label>Enabled</Label>
            </div>

            <div className="space-y-2">
              <Label>Rego module *</Label>
              <CodeEditor
                value={rego}
                onChange={setRego}
                language="yaml"
                height="280px"
              />
              <p className="text-xs text-muted-foreground">
                The body uploaded to OPA. Use <code>input.*</code> to read the
                launch context (resource_type, organization, user, inventory,
                credentials, extra_vars, now_iso, …).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Dry run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Sample input JSON</Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
            <Button type="button" variant="outline" onClick={handleTest} disabled={testMutation.isPending}>
              {testMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Test
            </Button>
            {testResult && (
              <div className="rounded-md border p-3 text-sm">
                <div>
                  <span className="font-medium">Allowed:</span>{' '}
                  {testResult.allowed ? 'yes' : 'no'}
                </div>
                {testResult.warnings.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium">Warnings:</div>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {testResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
                {testResult.denies.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium text-destructive">Denies:</div>
                    <ul className="list-disc pl-5 text-destructive">
                      {testResult.denies.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link to="/policies">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
