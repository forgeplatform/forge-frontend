import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, CheckField } from '@/components/wizard/fields'
import type { WizardStep } from '@/components/wizard/types'

interface Ctx {
  project_name: string
  scm_url: string
  inventory_name: string
  credential_name: string
  credential_username: string
  jt_name: string
  playbook: string
  create_schedule: boolean
  rrule: string
}

const initial: Ctx = {
  project_name: '',
  scm_url: '',
  inventory_name: '',
  credential_name: '',
  credential_username: '',
  jt_name: '',
  playbook: '',
  create_schedule: false,
  rrule: 'DTSTART:20260101T020000Z RRULE:FREQ=DAILY;INTERVAL=1',
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'project',
    title: 'Project',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Project name" value={ctx.project_name} onChange={(v) => setCtx({ project_name: v })} />
        <TextField label="SCM URL" value={ctx.scm_url} onChange={(v) => setCtx({ scm_url: v })} />
      </div>
    ),
    validate: (ctx) => (ctx.project_name ? [] : ['Project name required']),
    summary: (ctx) => [
      { label: 'Project', value: ctx.project_name },
      { label: 'SCM URL', value: ctx.scm_url },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    render: (ctx, setCtx) => (
      <TextField label="Inventory name" value={ctx.inventory_name} onChange={(v) => setCtx({ inventory_name: v })} />
    ),
    validate: (ctx) => (ctx.inventory_name ? [] : ['Inventory name required']),
    summary: (ctx) => [{ label: 'Inventory', value: ctx.inventory_name }],
  },
  {
    id: 'credential',
    title: 'Credential',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Credential name" value={ctx.credential_name} onChange={(v) => setCtx({ credential_name: v })} />
        <TextField label="SSH username" value={ctx.credential_username} onChange={(v) => setCtx({ credential_username: v })} />
      </div>
    ),
    validate: (ctx) => (ctx.credential_name ? [] : ['Credential name required']),
    summary: (ctx) => [
      { label: 'Credential', value: ctx.credential_name },
      { label: 'Username', value: ctx.credential_username },
    ],
  },
  {
    id: 'jt',
    title: 'Job Template',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Template name" value={ctx.jt_name} onChange={(v) => setCtx({ jt_name: v })} />
        <TextField label="Playbook" value={ctx.playbook} onChange={(v) => setCtx({ playbook: v })} placeholder="site.yml" />
      </div>
    ),
    validate: (ctx) => (ctx.jt_name && ctx.playbook ? [] : ['Template name and playbook required']),
    summary: (ctx) => [
      { label: 'Template', value: ctx.jt_name },
      { label: 'Playbook', value: ctx.playbook },
    ],
  },
  {
    id: 'schedule',
    title: 'Schedule (optional)',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <CheckField label="Create a daily schedule" checked={ctx.create_schedule} onChange={(v) => setCtx({ create_schedule: v })} />
        {ctx.create_schedule && (
          <TextField label="RRULE" value={ctx.rrule} onChange={(v) => setCtx({ rrule: v })} />
        )}
      </div>
    ),
    summary: (ctx) => (ctx.create_schedule ? [{ label: 'Schedule', value: ctx.rrule }] : []),
  },
]

export function AutomationWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onComplete = async (ctx: Ctx) => {
    const { data: project } = await api.post('/projects/', {
      name: ctx.project_name,
      scm_type: 'git',
      scm_url: ctx.scm_url,
    })
    const { data: inventory } = await api.post('/inventories/', { name: ctx.inventory_name })
    const { data: credential } = await api.post('/credentials/', {
      name: ctx.credential_name,
      credential_type: 1,
      inputs: { username: ctx.credential_username },
    })
    const { data: jt } = await api.post('/job_templates/', {
      name: ctx.jt_name,
      playbook: ctx.playbook,
      project: project.id,
      inventory: inventory.id,
      credentials: [credential.id],
    })
    if (ctx.create_schedule) {
      await api.post('/schedules/', {
        name: `${ctx.jt_name} daily`,
        rrule: ctx.rrule,
        unified_job_template: jt.id,
      })
    }
    navigate('/templates')
  }

  return (
    <Wizard
      title={t('wizards.automation_title')}
      scope="automation"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/templates')}
    />
  )
}
