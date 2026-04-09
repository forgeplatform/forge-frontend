import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
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
  useScanner,
  useCreateScanner,
  useUpdateScanner,
} from '@/api/hooks/useScanners'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import type {
  ScannerAppliesTo,
  ScannerEnforcement,
  ScannerTool,
  Severity,
} from '@/api/types'

const APPLIES: ScannerAppliesTo[] = ['job_template', 'workflow_job_template', 'ad_hoc_command']
const TOOLS: ScannerTool[] = ['ansible-lint', 'checkov', 'pip-audit']
const SEVERITIES: Severity[] = ['info', 'low', 'medium', 'high', 'critical']

const CONFIG_PLACEHOLDER = `{
  "profile": "production",
  "exclude": []
}`

export function ScannerForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: existing } = useScanner(isEdit ? id : undefined)
  const createMutation = useCreateScanner()
  const updateMutation = useUpdateScanner(id ?? '')

  const { data: orgs } = useOrganizations({ page_size: 100 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState<string>('')
  const [tool, setTool] = useState<ScannerTool>('ansible-lint')
  const [severityThreshold, setSeverityThreshold] = useState<Severity>('high')
  const [enforcement, setEnforcement] = useState<ScannerEnforcement>('enforce')
  const [enabled, setEnabled] = useState(true)
  const [appliesTo, setAppliesTo] = useState<ScannerAppliesTo[]>([])
  const [configText, setConfigText] = useState(CONFIG_PLACEHOLDER)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description || '')
      setOrganization(existing.organization ? String(existing.organization) : '')
      setTool(existing.tool)
      setSeverityThreshold(existing.severity_threshold)
      setEnforcement(existing.enforcement)
      setEnabled(existing.enabled)
      setAppliesTo(existing.applies_to || [])
      setConfigText(JSON.stringify(existing.config ?? {}, null, 2))
    }
  }, [existing])

  const toggleApplies = (t: ScannerAppliesTo) => {
    setAppliesTo((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    let parsedConfig: Record<string, unknown> = {}
    try {
      parsedConfig = configText.trim() ? JSON.parse(configText) : {}
    } catch (err) {
      alert(`Config is not valid JSON: ${err}`)
      return
    }
    const payload = {
      name,
      description,
      organization: organization ? Number(organization) : null,
      tool,
      severity_threshold: severityThreshold,
      enforcement,
      enabled,
      applies_to: appliesTo,
      config: parsedConfig,
    }
    if (isEdit) {
      updateMutation.mutate(payload, { onSuccess: () => navigate('/scanners') })
    } else {
      createMutation.mutate(payload, { onSuccess: () => navigate('/scanners') })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/scanners">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Scanner' : 'New Scanner'}
        </h1>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Tool</Label>
                <Select
                  value={tool}
                  onChange={(e) => setTool(e.target.value as ScannerTool)}
                  options={TOOLS.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity threshold</Label>
                <Select
                  value={severityThreshold}
                  onChange={(e) => setSeverityThreshold(e.target.value as Severity)}
                  options={SEVERITIES.map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Enforcement</Label>
                <div className="flex flex-col gap-1 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="enforcement"
                      value="warn"
                      checked={enforcement === 'warn'}
                      onChange={() => setEnforcement('warn')}
                    />
                    <span>Warn only</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="enforcement"
                      value="enforce"
                      checked={enforcement === 'enforce'}
                      onChange={() => setEnforcement('enforce')}
                    />
                    <span>Enforce (block)</span>
                  </label>
                </div>
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
              <Label>Config (JSON)</Label>
              <CodeEditor
                value={configText}
                onChange={setConfigText}
                language="json"
                height="220px"
              />
              <p className="text-xs text-muted-foreground">
                Tool-specific options (e.g. <code>profile</code>, <code>exclude</code>).
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link to="/scanners">
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
