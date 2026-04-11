import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField } from '@/components/wizard/fields'
import type { WizardStep } from '@/components/wizard/types'

interface Ctx {
  name: string
  contact_email: string
  admin_username: string
  admin_email: string
  admin_password: string
  max_concurrent_jobs: string
  max_daily_launches: string
  max_hosts: string
  max_storage_mb: string
  logo_url: string
  primary_color: string
  secondary_color: string
  custom_domain: string
}

const initial: Ctx = {
  name: '',
  contact_email: '',
  admin_username: '',
  admin_email: '',
  admin_password: '',
  max_concurrent_jobs: '',
  max_daily_launches: '',
  max_hosts: '',
  max_storage_mb: '',
  logo_url: '',
  primary_color: '',
  secondary_color: '',
  custom_domain: '',
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'basics',
    title: 'Tenant basics',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Tenant name" value={ctx.name} onChange={(v) => setCtx({ name: v })} />
        <TextField label="Contact email" value={ctx.contact_email} onChange={(v) => setCtx({ contact_email: v })} />
      </div>
    ),
    validate: (ctx) => (ctx.name ? [] : ['Tenant name required']),
    summary: (ctx) => [
      { label: 'Name', value: ctx.name },
      { label: 'Email', value: ctx.contact_email },
    ],
  },
  {
    id: 'admin',
    title: 'Admin user',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Username" value={ctx.admin_username} onChange={(v) => setCtx({ admin_username: v })} />
        <TextField label="Email" value={ctx.admin_email} onChange={(v) => setCtx({ admin_email: v })} />
        <TextField label="Password" value={ctx.admin_password} onChange={(v) => setCtx({ admin_password: v })} type="password" />
      </div>
    ),
    validate: (ctx) => {
      const errs: string[] = []
      if (!ctx.admin_username) errs.push('Admin username required')
      if (!ctx.admin_password) errs.push('Admin password required')
      return errs
    },
    summary: (ctx) => [
      { label: 'Username', value: ctx.admin_username },
      { label: 'Email', value: ctx.admin_email },
    ],
  },
  {
    id: 'quotas',
    title: 'Quotas',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Max concurrent jobs" value={ctx.max_concurrent_jobs} onChange={(v) => setCtx({ max_concurrent_jobs: v })} hint="Empty = unlimited" />
        <TextField label="Max daily launches" value={ctx.max_daily_launches} onChange={(v) => setCtx({ max_daily_launches: v })} />
        <TextField label="Max hosts" value={ctx.max_hosts} onChange={(v) => setCtx({ max_hosts: v })} />
        <TextField label="Max storage (MB)" value={ctx.max_storage_mb} onChange={(v) => setCtx({ max_storage_mb: v })} />
      </div>
    ),
    summary: (ctx) => [
      { label: 'Concurrent jobs', value: ctx.max_concurrent_jobs || '∞' },
      { label: 'Daily launches', value: ctx.max_daily_launches || '∞' },
      { label: 'Hosts', value: ctx.max_hosts || '∞' },
      { label: 'Storage MB', value: ctx.max_storage_mb || '∞' },
    ],
  },
  {
    id: 'branding',
    title: 'Branding',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Logo URL" value={ctx.logo_url} onChange={(v) => setCtx({ logo_url: v })} />
        <TextField label="Primary color" value={ctx.primary_color} onChange={(v) => setCtx({ primary_color: v })} placeholder="#0ea5e9" />
        <TextField label="Secondary color" value={ctx.secondary_color} onChange={(v) => setCtx({ secondary_color: v })} />
        <TextField label="Custom domain" value={ctx.custom_domain} onChange={(v) => setCtx({ custom_domain: v })} />
      </div>
    ),
    summary: (ctx) => [
      { label: 'Domain', value: ctx.custom_domain },
      { label: 'Primary', value: ctx.primary_color },
    ],
  },
]

function toNumOrNull(s: string): number | null {
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function TenancyWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onComplete = async (ctx: Ctx) => {
    await api.post('/tenants/', {
      name: ctx.name,
      contact_email: ctx.contact_email,
      admin_username: ctx.admin_username,
      admin_email: ctx.admin_email,
      admin_password: ctx.admin_password,
      max_concurrent_jobs: toNumOrNull(ctx.max_concurrent_jobs),
      max_daily_launches: toNumOrNull(ctx.max_daily_launches),
      max_hosts: toNumOrNull(ctx.max_hosts),
      max_storage_mb: toNumOrNull(ctx.max_storage_mb),
      logo_url: ctx.logo_url,
      primary_color: ctx.primary_color,
      secondary_color: ctx.secondary_color,
      custom_domain: ctx.custom_domain,
    })
    navigate('/tenants')
  }

  return (
    <Wizard
      title={t('wizards.tenancy_title')}
      scope="tenancy"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/tenants')}
    />
  )
}
