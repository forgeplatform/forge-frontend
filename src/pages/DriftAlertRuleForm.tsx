import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useDriftAlertRuleDetail,
  useCreateDriftAlertRule,
  useUpdateDriftAlertRule,
} from '@/api/hooks/useDrift'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import type { DriftCategory, DriftSeverity } from '@/api/types'

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const CATEGORY_ITEMS: { value: DriftCategory; label: string }[] = [
  { value: 'packages', label: 'Packages' },
  { value: 'services', label: 'Services' },
  { value: 'users_groups', label: 'Users & Groups' },
  { value: 'network', label: 'Network / Ports' },
  { value: 'mounts', label: 'Mounts / Filesystems' },
  { value: 'kernel', label: 'Kernel Parameters' },
  { value: 'other', label: 'Other' },
]

export function DriftAlertRuleForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing, isLoading } = useDriftAlertRuleDetail(id ?? '')
  const createMutation = useCreateDriftAlertRule()
  const updateMutation = useUpdateDriftAlertRule(id ?? '')
  const { data: orgs } = useOrganizations({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState<string>('')
  const [enabled, setEnabled] = useState(true)
  const [hostFilter, setHostFilter] = useState('')
  const [categories, setCategories] = useState<DriftCategory[]>([])
  const [severityMin, setSeverityMin] = useState<DriftSeverity>('medium')
  const [thresholdCount, setThresholdCount] = useState(1)
  const [thresholdWindowMinutes, setThresholdWindowMinutes] = useState(60)
  const [cooldownMinutes, setCooldownMinutes] = useState(30)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description)
      setOrganization(existing.organization?.toString() ?? '')
      setEnabled(existing.enabled)
      setHostFilter(existing.host_filter)
      setCategories(existing.categories)
      setSeverityMin(existing.severity_min)
      setThresholdCount(existing.threshold_count)
      setThresholdWindowMinutes(existing.threshold_window_minutes)
      setCooldownMinutes(existing.cooldown_minutes)
    }
  }, [existing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      description,
      organization: organization ? Number(organization) : null,
      enabled,
      host_filter: hostFilter,
      categories,
      severity_min: severityMin,
      threshold_count: thresholdCount,
      threshold_window_minutes: thresholdWindowMinutes,
      cooldown_minutes: cooldownMinutes,
    }

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/drift_alert_rules/${id}`),
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => navigate(`/drift_alert_rules/${data.id}`),
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isEdit && isLoading) return <FormPageSkeleton />

  const toggleCategory = (cat: DriftCategory) => {
    setCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  const orgOptions = [
    { value: '', label: '-- Select Organization --' },
    ...(orgs?.results ?? []).map(o => ({ value: String(o.id), label: o.name })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/drift_alert_rules"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Drift Alert Rules
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Select id="org" value={organization} onChange={e => setOrganization(e.target.value)} options={orgOptions} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Scope</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="host_filter">Host Filter (fnmatch pattern)</Label>
              <Input
                id="host_filter"
                value={hostFilter}
                onChange={e => setHostFilter(e.target.value)}
                placeholder="e.g. web-* or *.production"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to match all hosts.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Categories</Label>
              <p className="text-xs text-muted-foreground">
                Select which drift categories to monitor. Leave all unchecked for all categories.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {CATEGORY_ITEMS.map(item => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={categories.includes(item.value)}
                      onCheckedChange={() => toggleCategory(item.value)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity_min">Minimum Severity</Label>
              <Select
                id="severity_min"
                value={severityMin}
                onChange={e => setSeverityMin(e.target.value as DriftSeverity)}
                options={SEVERITY_OPTIONS}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Threshold</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="threshold_count">Drift Count Threshold</Label>
                <Input
                  id="threshold_count"
                  type="number"
                  min={1}
                  value={thresholdCount}
                  onChange={e => setThresholdCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="window">Window (minutes)</Label>
                <Input
                  id="window"
                  type="number"
                  min={1}
                  value={thresholdWindowMinutes}
                  onChange={e => setThresholdWindowMinutes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown (minutes)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  min={0}
                  value={cooldownMinutes}
                  onChange={e => setCooldownMinutes(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Alert fires when {thresholdCount} or more drift items are detected within {thresholdWindowMinutes} minutes.
              After firing, the rule waits {cooldownMinutes} minutes before it can fire again.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Alert Rule'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
