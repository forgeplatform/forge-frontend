import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField } from '@/components/wizard/fields'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { WizardStep } from '@/components/wizard/types'

type GateType = 'drift' | 'policy' | 'scanner'

interface Ctx {
  gate_type: GateType
  name: string
  tool: string
  severity_threshold: string
  policy_body: string
  drift_source: string
  applies_to: string
  enforcement: string
}

const initial: Ctx = {
  gate_type: 'scanner',
  name: '',
  tool: 'ansible-lint',
  severity_threshold: 'medium',
  policy_body: '',
  drift_source: '',
  applies_to: 'all',
  enforcement: 'warn',
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'type',
    title: 'Gate type',
    render: (ctx, setCtx) => (
      <div className="space-y-2">
        {(['drift', 'policy', 'scanner'] as GateType[]).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input
              type="radio"
              name="gate_type"
              checked={ctx.gate_type === k}
              onChange={() => setCtx({ gate_type: k })}
            />
            <span className="capitalize">{k}</span>
          </label>
        ))}
      </div>
    ),
    summary: (ctx) => [{ label: 'Type', value: ctx.gate_type }],
  },
  {
    id: 'config',
    title: 'Configuration',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Name" value={ctx.name} onChange={(v) => setCtx({ name: v })} />
        {ctx.gate_type === 'scanner' && (
          <>
            <div className="space-y-1">
              <Label>Tool</Label>
              <Select
                value={ctx.tool}
                onChange={(e) => setCtx({ tool: e.target.value })}
                options={[
                  { value: 'ansible-lint', label: 'ansible-lint' },
                  { value: 'checkov', label: 'checkov' },
                  { value: 'pip-audit', label: 'pip-audit' },
                ]}
              />
            </div>
            <div className="space-y-1">
              <Label>Severity threshold</Label>
              <Select
                value={ctx.severity_threshold}
                onChange={(e) => setCtx({ severity_threshold: e.target.value })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
            </div>
          </>
        )}
        {ctx.gate_type === 'policy' && (
          <TextField label="Policy body (rego)" value={ctx.policy_body} onChange={(v) => setCtx({ policy_body: v })} />
        )}
        {ctx.gate_type === 'drift' && (
          <TextField label="Source inventory name" value={ctx.drift_source} onChange={(v) => setCtx({ drift_source: v })} />
        )}
      </div>
    ),
    validate: (ctx) => (ctx.name ? [] : ['Name required']),
    summary: (ctx) => [
      { label: 'Name', value: ctx.name },
      ...(ctx.gate_type === 'scanner'
        ? [
            { label: 'Tool', value: ctx.tool },
            { label: 'Threshold', value: ctx.severity_threshold },
          ]
        : []),
    ],
  },
  {
    id: 'applies',
    title: 'Applies to & Enforcement',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Applies to" value={ctx.applies_to} onChange={(v) => setCtx({ applies_to: v })} hint="e.g. 'all' or a template name pattern" />
        <div className="space-y-1">
          <Label>Enforcement</Label>
          <Select
            value={ctx.enforcement}
            onChange={(e) => setCtx({ enforcement: e.target.value })}
            options={[
              { value: 'warn', label: 'Warn only' },
              { value: 'enforce', label: 'Enforce (block)' },
            ]}
          />
        </div>
      </div>
    ),
    summary: (ctx) => [
      { label: 'Applies to', value: ctx.applies_to },
      { label: 'Enforcement', value: ctx.enforcement },
    ],
  },
]

export function ComplianceWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onComplete = async (ctx: Ctx) => {
    if (ctx.gate_type === 'scanner') {
      await api.post('/scanners/', {
        name: ctx.name,
        tool: ctx.tool,
        severity_threshold: ctx.severity_threshold,
        applies_to: ctx.applies_to,
        enforcement: ctx.enforcement,
        enabled: true,
      })
      navigate('/scanners')
    } else if (ctx.gate_type === 'policy') {
      await api.post('/policies/', {
        name: ctx.name,
        body: ctx.policy_body,
        applies_to: ctx.applies_to,
        enforcement: ctx.enforcement,
        enabled: true,
      })
      navigate('/policies')
    } else {
      await api.post('/drift_alert_rules/', {
        name: ctx.name,
        source: ctx.drift_source,
        applies_to: ctx.applies_to,
        enabled: true,
      })
      navigate('/drift_alert_rules')
    }
  }

  return (
    <Wizard
      title={t('wizards.compliance_title')}
      scope="compliance"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/scanners')}
    />
  )
}
