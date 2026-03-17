import { useParams, useNavigate } from 'react-router-dom'
import { useSettingsCategory, useUpdateSettings } from '@/api/hooks/useSettings'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'

const categoryMeta: Record<string, { title: string; description: string }> = {
  authentication: { title: 'Authentication', description: 'Configure login providers: LDAP, SAML, GitHub, Google, Azure AD' },
  jobs: { title: 'Jobs', description: 'Job execution settings, isolation, timeouts, and paths' },
  system: { title: 'System', description: 'Base URL, proxy settings, license, and platform configuration' },
  ui: { title: 'User Interface', description: 'UI customization, analytics, and branding' },
  logging: { title: 'Logging', description: 'External log aggregator settings and integration' },
  misc: { title: 'Miscellaneous', description: 'Other platform-wide settings' },
}

function SettingField({
  name,
  value,
  onChange,
}: {
  name: string
  value: unknown
  onChange: (name: string, value: unknown) => void
}) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{name}</Label>
        </div>
        <Switch checked={value} onCheckedChange={(v) => onChange(name, v)} />
      </div>
    )
  }

  if (typeof value === 'number') {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{name}</Label>
        <Input
          id={name}
          type="number"
          value={value}
          onChange={(e) => onChange(name, Number(e.target.value))}
        />
      </div>
    )
  }

  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{name}</Label>
        <Textarea
          id={name}
          rows={4}
          className="font-mono text-xs"
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChange(name, JSON.parse(e.target.value))
            } catch {
              // keep raw string while user is typing
            }
          }}
        />
      </div>
    )
  }

  // string or null
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{name}</Label>
      <Input
        id={name}
        value={value === null ? '' : String(value)}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  )
}

export function SettingsCategory() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useSettingsCategory(slug)
  const updateSettings = useUpdateSettings(slug)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (data) {
      setFormValues(data)
      setDirty(false)
    }
  }, [data])

  const meta = categoryMeta[slug] || { title: slug, description: '' }

  const handleChange = (name: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
    setDirty(true)
  }

  const handleSave = () => {
    if (!data) return
    // Only send changed fields
    const changed: Record<string, unknown> = {}
    for (const key of Object.keys(formValues)) {
      if (JSON.stringify(formValues[key]) !== JSON.stringify(data[key])) {
        changed[key] = formValues[key]
      }
    }
    if (Object.keys(changed).length > 0) {
      updateSettings.mutate(changed)
    }
  }

  const handleReset = () => {
    if (data) {
      setFormValues(data)
      setDirty(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const entries = Object.entries(formValues)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="destructive" size="sm" onClick={() => navigate('/settings')}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {entries.length} setting{entries.length !== 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>
            Modify values below and click Save to apply changes.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 p-6 pt-0">
          {entries.map(([key, val]) => (
            <SettingField key={key} name={key} value={val} onChange={handleChange} />
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={!dirty || updateSettings.isPending}>
          {updateSettings.isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button className="bg-yellow-500 text-white hover:bg-yellow-600" onClick={handleReset} disabled={!dirty}>
          Reset
        </Button>
        {updateSettings.isSuccess && (
          <span className="self-center text-sm text-green-500">Settings saved successfully.</span>
        )}
        {updateSettings.isError && (
          <span className="self-center text-sm text-red-500">
            Error: {(updateSettings.error as Error)?.message || 'Failed to save'}
          </span>
        )}
      </div>
    </div>
  )
}
