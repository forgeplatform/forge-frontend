import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, TextAreaField, CheckField, SelectField } from '@/components/wizard/fields'
import type { WizardStep } from '@/components/wizard/types'

interface Ctx {
  org_name: string
  contact_email: string
  project_name: string
  scm_url: string
  inventory_name: string
  credential_name: string
  credential_username: string
  credential_password: string
  credential_ssh_key: string
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
  credential_password: '',
  credential_ssh_key: '',
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
  // The project detail serializer does NOT include playbook_files
  // (the field only exists on the Django model), so we must call the
  // dedicated /projects/{id}/playbooks/ endpoint. It returns a bare
  // JSON array of relative paths.
  const { data } = await api.get<string[]>(`/projects/${projectId}/playbooks/`)
  const files = Array.isArray(data) ? data : []
  return files.filter((f) => /\.ya?ml$/.test(f))
}

/**
 * Fetch an organization by exact name, or null if none exists. Makes
 * the wizard idempotent: if the user reruns it against a name they
 * already have, we reuse the existing row rather than blowing up with
 * a unique-name violation.
 */
async function findOrganizationByName(name: string): Promise<{ id: number } | null> {
  const { data } = await api.get(`/organizations/`, { params: { name } })
  const match = (data.results as Array<{ id: number; name: string }> | undefined)?.find(
    (o) => o.name === name,
  )
  return match ? { id: match.id } : null
}

async function findProjectByNameInOrg(
  name: string,
  orgId: number,
): Promise<{ id: number; scm_url: string } | null> {
  const { data } = await api.get(`/projects/`, { params: { name, organization: orgId } })
  const match = (data.results as Array<{ id: number; name: string; scm_url: string }> | undefined)?.find(
    (p) => p.name === name,
  )
  return match ? { id: match.id, scm_url: match.scm_url } : null
}

async function findInventoryByNameInOrg(
  name: string,
  orgId: number,
): Promise<{ id: number } | null> {
  const { data } = await api.get(`/inventories/`, { params: { name, organization: orgId } })
  const match = (data.results as Array<{ id: number; name: string }> | undefined)?.find(
    (i) => i.name === name,
  )
  return match ? { id: match.id } : null
}

async function findCredentialByNameInOrg(
  name: string,
  orgId: number,
  credentialType: number,
): Promise<{ id: number } | null> {
  const { data } = await api.get(`/credentials/`, {
    params: { name, organization: orgId, credential_type: credentialType },
  })
  const match = (data.results as Array<{ id: number; name: string }> | undefined)?.find(
    (c) => c.name === name,
  )
  return match ? { id: match.id } : null
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
        <TextField
          label="SSH password"
          type="password"
          value={ctx.credential_password}
          onChange={(v) => setCtx({ credential_password: v })}
          hint="Leave blank if you are using an SSH private key instead."
        />
        <TextAreaField
          label="SSH private key"
          value={ctx.credential_ssh_key}
          onChange={(v) => setCtx({ credential_ssh_key: v })}
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
          rows={6}
          hint="Paste the full private key PEM. Leave blank if using a password."
        />
      </div>
    ),
    validate: (ctx) => {
      const errs: string[] = []
      if (!ctx.project_name) errs.push('Project name required')
      if (!ctx.inventory_name) errs.push('Inventory name required')
      if (!ctx.credential_name) errs.push('Credential name required')
      if (!ctx.scm_url) errs.push('SCM URL required')
      if (!ctx.credential_username) errs.push('SSH username required')
      if (!ctx.credential_password && !ctx.credential_ssh_key) {
        errs.push('Provide either an SSH password or an SSH private key — the playbook cannot authenticate to the target otherwise.')
      }
      return errs
    },
    onNext: async (ctx, setCtx) => {
      // Create org + project and wait for the SCM sync here (rather than
      // in onComplete) so the Job Template step below can populate its
      // playbook dropdown from the actual files in the repo.
      const key = `${ctx.org_name}|${ctx.project_name}|${ctx.scm_url}`
      if (ctx._project_id && ctx._dirty_key === key) {
        // Already created for this exact input — skip and re-use. This
        // happens if the user hits Back then Next without edits.
        return
      }
      // If a previous attempt created a project for different inputs,
      // drop it so we do not leak.
      if (ctx._project_id) {
        try {
          await api.delete(`/projects/${ctx._project_id}/`)
        } catch {
          /* best effort cleanup */
        }
      }
      // Idempotent org: reuse an existing one with the same name if it
      // exists. AWX enforces unique organization names, so a second run
      // of the wizard would otherwise 400 the moment the user picks a
      // name they already have.
      let orgId = ctx._org_id
      if (!orgId) {
        const existing = await findOrganizationByName(ctx.org_name)
        if (existing) {
          orgId = existing.id
        } else {
          const { data: org } = await api.post('/organizations/', {
            name: ctx.org_name,
            description: '',
          })
          orgId = org.id as number
        }
      }
      // Idempotent project: if a project with this name already exists
      // inside the chosen org, reuse it provided the SCM URL still
      // matches. Otherwise refuse and let the user pick a different
      // name rather than silently swapping URLs underneath them.
      let projectId: number
      const existingProject = await findProjectByNameInOrg(ctx.project_name, orgId)
      if (existingProject) {
        if (existingProject.scm_url !== ctx.scm_url) {
          return [
            `A project named "${ctx.project_name}" already exists in "${ctx.org_name}" but points to a different SCM URL. Pick a different project name.`,
          ]
        }
        projectId = existingProject.id
      } else {
        const { data: project } = await api.post('/projects/', {
          name: ctx.project_name,
          scm_type: 'git',
          scm_url: ctx.scm_url,
          organization: orgId,
        })
        projectId = project.id as number
      }
      await waitForProjectSync(projectId)
      const playbooks = await fetchPlaybooks(projectId)
      setCtx({
        _org_id: orgId,
        _project_id: projectId,
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
      {
        label: 'SSH auth',
        value: ctx.credential_ssh_key
          ? 'Private key'
          : ctx.credential_password
            ? 'Password'
            : 'None',
      },
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
    // Idempotent inventory / credential: AWX enforces
    //   inventory:  unique (name, organization)
    //   credential: unique (name, organization, credential_type)
    // so a second run of the wizard with the same names otherwise 400s
    // halfway through creation and leaves the system in a half-built
    // state. Look them up first and re-use.
    const CRED_TYPE_MACHINE = 1
    let inventoryId: number
    const existingInv = await findInventoryByNameInOrg(ctx.inventory_name, ctx._org_id)
    if (existingInv) {
      inventoryId = existingInv.id
    } else {
      const { data: inventory } = await api.post('/inventories/', {
        name: ctx.inventory_name,
        organization: ctx._org_id,
      })
      inventoryId = inventory.id as number
    }
    // Build the Machine credential inputs. AWX's Machine credential
    // type accepts username, password, ssh_key_data (among others);
    // we only send what the user actually filled in to avoid
    // overwriting an empty string on top of a valid existing value if
    // the row is later edited.
    const credentialInputs: Record<string, string> = {
      username: ctx.credential_username,
    }
    if (ctx.credential_password) credentialInputs.password = ctx.credential_password
    if (ctx.credential_ssh_key) credentialInputs.ssh_key_data = ctx.credential_ssh_key

    let credentialId: number
    const existingCred = await findCredentialByNameInOrg(
      ctx.credential_name,
      ctx._org_id,
      CRED_TYPE_MACHINE,
    )
    if (existingCred) {
      // Reuse the existing credential as-is. If the user wants to
      // rotate the secret they can edit it from the Credentials page.
      credentialId = existingCred.id
    } else {
      const { data: credential } = await api.post('/credentials/', {
        name: ctx.credential_name,
        credential_type: CRED_TYPE_MACHINE,
        organization: ctx._org_id,
        inputs: credentialInputs,
      })
      credentialId = credential.id as number
    }
    // Job templates do not have a unique-name constraint in AWX, so we
    // always create a fresh one and accept that rerunning the wizard
    // with the same template name will produce duplicates.
    await api.post('/job_templates/', {
      name: ctx.jt_name,
      playbook: ctx.playbook,
      project: ctx._project_id,
      inventory: inventoryId,
      credentials: [credentialId],
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
