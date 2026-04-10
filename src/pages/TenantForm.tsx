import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  useTenant,
  useCreateTenant,
  useUpdateTenant,
} from '@/api/hooks/useTenants'
import type { TenantProvisionPayload } from '@/api/types'

function parseNumberOrNull(v: string): number | null {
  if (v === '' || v === null) return null
  const n = Number(v)
  if (Number.isNaN(n) || n <= 0) return null
  return n
}

export function TenantForm() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: existing } = useTenant(isEdit ? id : undefined)
  const createMutation = useCreateTenant()
  const updateMutation = useUpdateTenant(id ?? '')

  // Basic
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Admin user (new only)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Quotas
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState('')
  const [maxDailyLaunches, setMaxDailyLaunches] = useState('')
  const [maxHosts, setMaxHosts] = useState('')
  const [maxStorageMb, setMaxStorageMb] = useState('')

  // Isolation
  const [isolationStrict, setIsolationStrict] = useState(false)

  // Branding
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#64748b')
  const [customDomain, setCustomDomain] = useState('')

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setContactEmail(existing.contact_email || '')
      setMaxConcurrentJobs(existing.quota.max_concurrent_jobs?.toString() ?? '')
      setMaxDailyLaunches(existing.quota.max_daily_launches?.toString() ?? '')
      setMaxHosts(existing.quota.max_hosts?.toString() ?? '')
      setMaxStorageMb(existing.quota.max_storage_mb?.toString() ?? '')
      setLogoUrl(existing.branding.logo_url || '')
      setPrimaryColor(existing.branding.primary_color || '#2563eb')
      setSecondaryColor(existing.branding.secondary_color || '#64748b')
      setCustomDomain(existing.branding.custom_domain || '')
      setIsolationStrict(existing.isolation_strict ?? false)
    }
  }, [existing])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const quota = {
      max_concurrent_jobs: parseNumberOrNull(maxConcurrentJobs),
      max_daily_launches: parseNumberOrNull(maxDailyLaunches),
      max_hosts: parseNumberOrNull(maxHosts),
      max_storage_mb: parseNumberOrNull(maxStorageMb),
    }
    const branding = {
      logo_url: logoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      custom_domain: customDomain,
    }

    if (isEdit) {
      updateMutation.mutate(
        {
          name,
          contact_email: contactEmail,
          isolation_strict: isolationStrict,
          quota,
          branding,
        } as never,
        { onSuccess: () => navigate('/tenants') },
      )
    } else {
      const payload: TenantProvisionPayload = {
        name,
        admin_username: adminUsername,
        admin_email: adminEmail,
        admin_password: adminPassword,
        contact_email: contactEmail,
        isolation_strict: isolationStrict,
        quota,
        branding,
      }
      createMutation.mutate(payload, { onSuccess: () => navigate('/tenants') })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? t('tenants.edit') : t('tenants.new')}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('tenants.basic')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('tenants.name')} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('tenants.contact_email')}</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="isolation_strict"
                type="checkbox"
                checked={isolationStrict}
                onChange={(e) => setIsolationStrict(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isolation_strict">
                Strict tenant isolation
              </Label>
              <span className="text-xs text-muted-foreground">
                When enabled, cross-tenant API access is blocked (HTTP 403)
              </span>
            </div>
          </CardContent>
        </Card>

        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Admin User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('tenants.admin_username')} *</Label>
                  <Input
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('tenants.admin_email')} *</Label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('tenants.admin_password')} *</Label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('tenants.quotas')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">{t('tenants.unlimited_hint')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('tenants.max_concurrent_jobs')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxConcurrentJobs}
                  onChange={(e) => setMaxConcurrentJobs(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tenants.max_daily_launches')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxDailyLaunches}
                  onChange={(e) => setMaxDailyLaunches(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tenants.max_hosts')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxHosts}
                  onChange={(e) => setMaxHosts(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tenants.max_storage_mb')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxStorageMb}
                  onChange={(e) => setMaxStorageMb(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('tenants.branding')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('tenants.logo_url')}</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('tenants.primary_color')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-14 rounded border"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('tenants.secondary_color')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-14 rounded border"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('tenants.custom_domain')}</Label>
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="tenant.example.com"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link to="/tenants">
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
