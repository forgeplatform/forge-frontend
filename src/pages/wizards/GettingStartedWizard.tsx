import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, CheckField } from '@/components/wizard/fields'
import type { WizardStep } from '@/components/wizard/types'

interface Ctx {
  org_name: string
  contact_email: string
  project_name: string
  scm_url: string
  inventory_name: string
  credential_name: string
  credential_username: string
  jt_name: string
  playbook: string
  gate_scanning: boolean
  gate_policy: boolean
  gate_observability: boolean
  gate_tenancy: boolean
}

const initial: Ctx = {
  org_name: '',
  contact_email: '',
  project_name: '',
  scm_url: '',
  inventory_name: '',
  credential_name: '',
  credential_username: '',
  jt_name: '',
  playbook: '',
  gate_scanning: false,
  gate_policy: false,
  gate_observability: false,
  gate_tenancy: false,
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'org',
    title: 'Organization basics',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Organization name" value={ctx.org_name} onChange={(v) => setCtx({ org_name: v })} />
        <TextField label="Contact email" value={ctx.contact_email} onChange={(v) => setCtx({ contact_email: v })} type="email" />
      </div>
    ),
    validate: (ctx) => (ctx.org_name ? [] : ['Organization name is required']),
    summary: (ctx) => [
      { label: 'Name', value: ctx.org_name },
      { label: 'Email', value: ctx.contact_email },
    ],
  },
  {
    id: 'project_inv_cred',
    title: 'Project, Inventory, Credential',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Project name" value={ctx.project_name} onChange={(v) => setCtx({ project_name: v })} />
        <TextField label="SCM URL" value={ctx.scm_url} onChange={(v) => setCtx({ scm_url: v })} placeholder="https://github.com/..." />
        <TextField label="Inventory name" value={ctx.inventory_name} onChange={(v) => setCtx({ inventory_name: v })} />
        <TextField label="Credential name" value={ctx.credential_name} onChange={(v) => setCtx({ credential_name: v })} />
        <TextField label="SSH username" value={ctx.credential_username} onChange={(v) => setCtx({ credential_username: v })} />
      </div>
    ),
    validate: (ctx) => {
      const errs: string[] = []
      if (!ctx.project_name) errs.push('Project name required')
      if (!ctx.inventory_name) errs.push('Inventory name required')
      if (!ctx.credential_name) errs.push('Credential name required')
      return errs
    },
    summary: (ctx) => [
      { label: 'Project', value: ctx.project_name },
      { label: 'SCM URL', value: ctx.scm_url },
      { label: 'Inventory', value: ctx.inventory_name },
      { label: 'Credential', value: ctx.credential_name },
      { label: 'SSH user', value: ctx.credential_username },
    ],
  },
  {
    id: 'jt',
    title: 'First Job Template',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Template name" value={ctx.jt_name} onChange={(v) => setCtx({ jt_name: v })} />
        <TextField label="Playbook" value={ctx.playbook} onChange={(v) => setCtx({ playbook: v })} placeholder="site.yml" />
      </div>
    ),
    validate: (ctx) => (ctx.jt_name && ctx.playbook ? [] : ['Job template name and playbook required']),
    summary: (ctx) => [
      { label: 'Template', value: ctx.jt_name },
      { label: 'Playbook', value: ctx.playbook },
    ],
  },
  {
    id: 'gates',
    title: 'Optional gates',
    render: (ctx, setCtx) => (
      <div className="space-y-3">
        <CheckField label="Enable scanning" checked={ctx.gate_scanning} onChange={(v) => setCtx({ gate_scanning: v })} />
        <CheckField label="Enable policy" checked={ctx.gate_policy} onChange={(v) => setCtx({ gate_policy: v })} />
        <CheckField label="Enable observability" checked={ctx.gate_observability} onChange={(v) => setCtx({ gate_observability: v })} />
        <CheckField label="Enable tenancy" checked={ctx.gate_tenancy} onChange={(v) => setCtx({ gate_tenancy: v })} />
      </div>
    ),
    summary: (ctx) => [
      { label: 'Scanning', value: ctx.gate_scanning ? 'Yes' : 'No' },
      { label: 'Policy', value: ctx.gate_policy ? 'Yes' : 'No' },
      { label: 'Observability', value: ctx.gate_observability ? 'Yes' : 'No' },
      { label: 'Tenancy', value: ctx.gate_tenancy ? 'Yes' : 'No' },
    ],
  },
]

export function GettingStartedWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const waitForProjectSync = async (projectId: number, maxWaitMs = 120000) => {
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      const { data } = await api.get(`/projects/${projectId}/`)
      const st = data.summary_fields?.current_update?.status || data.status
      if (st === 'successful') return
      if (st === 'failed' || st === 'error' || st === 'canceled') {
        throw new Error(`Project sync ${st}`)
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    throw new Error('Project sync timed out')
  }

  const onComplete = async (ctx: Ctx) => {
    const { data: org } = await api.post('/organizations/', {
      name: ctx.org_name,
      description: '',
    })
    const { data: project } = await api.post('/projects/', {
      name: ctx.project_name,
      scm_type: 'git',
      scm_url: ctx.scm_url,
      organization: org.id,
    })
    // Wait for the automatic SCM update to finish so playbooks are available
    await waitForProjectSync(project.id)
    const { data: inventory } = await api.post('/inventories/', {
      name: ctx.inventory_name,
      organization: org.id,
    })
    const { data: credential } = await api.post('/credentials/', {
      name: ctx.credential_name,
      credential_type: 1,
      organization: org.id,
      inputs: { username: ctx.credential_username },
    })
    await api.post('/job_templates/', {
      name: ctx.jt_name,
      playbook: ctx.playbook,
      project: project.id,
      inventory: inventory.id,
      credentials: [credential.id],
    })
    const settingsPatch: Record<string, boolean> = {}
    if (ctx.gate_scanning) settingsPatch.SCANNING_ENABLED = true
    if (ctx.gate_policy) settingsPatch.POLICY_ENABLED = true
    if (ctx.gate_observability) settingsPatch.OBSERVABILITY_ENABLED = true
    if (ctx.gate_tenancy) settingsPatch.TENANCY_ENABLED = true
    if (Object.keys(settingsPatch).length > 0) {
      await api.patch('/settings/system/', settingsPatch)
    }
    navigate('/dashboard')
  }

  return (
    <Wizard
      title={t('wizards.getting_started_title')}
      scope="dashboard"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/dashboard')}
    />
  )
}
