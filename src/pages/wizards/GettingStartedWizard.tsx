import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, CheckField, SelectField } from '@/components/wizard/fields'
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
  // Pre-created resources from step 1 onNext — reused in onComplete
  // so we do not hit AWX twice. `_dirty_key` tracks the org_name +
  // scm_url combination the existing project was made for; if the
  // user goes Back and edits it we delete and recreate.
  _org_id: number | null
  _project_id: number | null
  _dirty_key: string
  _playbooks: string[]
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
  _org_id: null,
  _project_id: null,
  _dirty_key: '',
  _playbooks: [],
}

async function waitForProjectSync(projectId: number, maxWaitMs = 120000) {
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

async function fetchPlaybooks(projectId: number): Promise<string[]> {
  // AWX exposes the git-tree playbook files both on GET /projects/{id}/
  // (playbook_files on the detail) and on GET /projects/{id}/playbooks/
  // (a bare JSON array). We use the detail endpoint so we don't need
  // yet another round trip.
  const { data } = await api.get(`/projects/${projectId}/`)
  const files = (data.playbook_files as string[] | undefined) ?? []
  return files.filter((f) => /\.ya?ml$/.test(f))
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
      if (!ctx.scm_url) errs.push('SCM URL required')
      return errs
    },
    onNext: async (ctx, setCtx) => {
      // Create org + project and wait for the SCM sync here (rather than
      // in onComplete) so the Job Template step below can populate its
      // playbook dropdown from the actual files in the repo.
      const key = `${ctx.org_name}|${ctx.scm_url}`
      if (ctx._project_id && ctx._dirty_key === key) {
        // Already created for this exact input — skip and re-use. This
        // happens if the user hits Back then Next without edits.
        return
      }
      // If a previous attempt created a project with different inputs,
      // drop it so we do not leak. Org is harder to clean up since later
      // resources reference it, so we just leave it — easy to delete
      // from the UI afterwards.
      if (ctx._project_id) {
        try {
          await api.delete(`/projects/${ctx._project_id}/`)
        } catch {
          /* best effort cleanup */
        }
      }
      let orgId = ctx._org_id
      if (!orgId) {
        const { data: org } = await api.post('/organizations/', {
          name: ctx.org_name,
          description: '',
        })
        orgId = org.id as number
      }
      const { data: project } = await api.post('/projects/', {
        name: ctx.project_name,
        scm_type: 'git',
        scm_url: ctx.scm_url,
        organization: orgId,
      })
      await waitForProjectSync(project.id)
      const playbooks = await fetchPlaybooks(project.id)
      setCtx({
        _org_id: orgId,
        _project_id: project.id,
        _dirty_key: key,
        _playbooks: playbooks,
        // Reset any stale playbook selection so the dropdown starts
        // clean and the validator below fires if the user just clicks
        // Next.
        playbook: playbooks.length === 1 ? playbooks[0]! : '',
      })
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
        {ctx._playbooks.length > 0 ? (
          <SelectField
            label="Playbook"
            value={ctx.playbook}
            onChange={(v) => setCtx({ playbook: v })}
            options={ctx._playbooks.map((p) => ({ value: p, label: p }))}
            placeholder="Select a playbook…"
            hint={`${ctx._playbooks.length} playbook(s) found in the project repo.`}
          />
        ) : (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            No playbooks were found in the project. Go Back and verify
            the SCM URL, or open the project after creation and add a
            playbook file.
          </div>
        )}
      </div>
    ),
    validate: (ctx) => {
      const errs: string[] = []
      if (!ctx.jt_name) errs.push('Template name required')
      if (!ctx.playbook) errs.push('Playbook required')
      if (ctx._playbooks.length > 0 && !ctx._playbooks.includes(ctx.playbook)) {
        errs.push(`Playbook "${ctx.playbook}" is not in the project`)
      }
      return errs
    },
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

  const onComplete = async (ctx: Ctx) => {
    // org + project were pre-created in step 1 onNext and are available
    // as ctx._org_id and ctx._project_id. We only need the per-wizard
    // resources that actually depend on the user's later choices.
    if (!ctx._org_id || !ctx._project_id) {
      throw new Error('Project was not created yet — go back to the project step.')
    }
    const { data: inventory } = await api.post('/inventories/', {
      name: ctx.inventory_name,
      organization: ctx._org_id,
    })
    const { data: credential } = await api.post('/credentials/', {
      name: ctx.credential_name,
      credential_type: 1,
      organization: ctx._org_id,
      inputs: { username: ctx.credential_username },
    })
    await api.post('/job_templates/', {
      name: ctx.jt_name,
      playbook: ctx.playbook,
      project: ctx._project_id,
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
