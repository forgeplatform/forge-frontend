import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, TextAreaField } from '@/components/wizard/fields'
import type { WizardStep } from '@/components/wizard/types'

type ResType = 'inventory_with_hosts' | 'project_with_schedule'

interface Ctx {
  res_type: ResType
  inventory_name: string
  hosts: string
  project_name: string
  scm_url: string
  rrule: string
}

const initial: Ctx = {
  res_type: 'inventory_with_hosts',
  inventory_name: '',
  hosts: '',
  project_name: '',
  scm_url: '',
  rrule: 'DTSTART:20260101T030000Z RRULE:FREQ=HOURLY;INTERVAL=6',
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'type',
    title: 'Resource type',
    render: (ctx, setCtx) => (
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={ctx.res_type === 'inventory_with_hosts'}
            onChange={() => setCtx({ res_type: 'inventory_with_hosts' })}
          />
          Inventory with hosts
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={ctx.res_type === 'project_with_schedule'}
            onChange={() => setCtx({ res_type: 'project_with_schedule' })}
          />
          Project with schedule
        </label>
      </div>
    ),
    summary: (ctx) => [{ label: 'Type', value: ctx.res_type }],
  },
  {
    id: 'config',
    title: 'Configuration',
    render: (ctx, setCtx) =>
      ctx.res_type === 'inventory_with_hosts' ? (
        <div className="space-y-4">
          <TextField label="Inventory name" value={ctx.inventory_name} onChange={(v) => setCtx({ inventory_name: v })} />
          <TextAreaField
            label="Hosts (one per line)"
            value={ctx.hosts}
            onChange={(v) => setCtx({ hosts: v })}
            hint="Enter one hostname per line"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <TextField label="Project name" value={ctx.project_name} onChange={(v) => setCtx({ project_name: v })} />
          <TextField label="SCM URL" value={ctx.scm_url} onChange={(v) => setCtx({ scm_url: v })} />
          <TextField label="RRULE" value={ctx.rrule} onChange={(v) => setCtx({ rrule: v })} />
        </div>
      ),
    validate: (ctx) => {
      if (ctx.res_type === 'inventory_with_hosts') {
        return ctx.inventory_name ? [] : ['Inventory name required']
      }
      return ctx.project_name ? [] : ['Project name required']
    },
    summary: (ctx) =>
      ctx.res_type === 'inventory_with_hosts'
        ? [
            { label: 'Inventory', value: ctx.inventory_name },
            { label: 'Hosts', value: `${ctx.hosts.split('\n').filter(Boolean).length}` },
          ]
        : [
            { label: 'Project', value: ctx.project_name },
            { label: 'SCM URL', value: ctx.scm_url },
          ],
  },
]

export function ResourcesWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onComplete = async (ctx: Ctx) => {
    if (ctx.res_type === 'inventory_with_hosts') {
      const { data: inventory } = await api.post('/inventories/', { name: ctx.inventory_name })
      const hostnames = ctx.hosts.split('\n').map((h) => h.trim()).filter(Boolean)
      for (const hn of hostnames) {
        await api.post('/hosts/', { name: hn, inventory: inventory.id })
      }
      navigate('/inventories')
    } else {
      const { data: project } = await api.post('/projects/', {
        name: ctx.project_name,
        scm_type: 'git',
        scm_url: ctx.scm_url,
      })
      await api.post('/schedules/', {
        name: `${ctx.project_name} update`,
        rrule: ctx.rrule,
        unified_job_template: project.id,
      })
      navigate('/projects')
    }
  }

  return (
    <Wizard
      title={t('wizards.resources_title')}
      scope="resources"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/inventories')}
    />
  )
}
