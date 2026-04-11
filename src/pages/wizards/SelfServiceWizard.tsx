import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, TextAreaField, CheckField } from '@/components/wizard/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { WizardStep } from '@/components/wizard/types'

interface SurveyQ {
  variable: string
  type: string
  question: string
}

interface Ctx {
  jt_id: string
  jt_name_label: string
  survey: SurveyQ[]
  require_approval: boolean
  approver_team: string
  catalog_name: string
  category: string
  icon: string
  description: string
}

const initial: Ctx = {
  jt_id: '',
  jt_name_label: '',
  survey: [],
  require_approval: false,
  approver_team: '',
  catalog_name: '',
  category: '',
  icon: '',
  description: '',
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'jt',
    title: 'Job Template',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Job Template ID" value={ctx.jt_id} onChange={(v) => setCtx({ jt_id: v })} hint="Enter the ID of an existing Job Template" />
        <TextField label="Display label" value={ctx.jt_name_label} onChange={(v) => setCtx({ jt_name_label: v })} />
      </div>
    ),
    validate: (ctx) => (ctx.jt_id ? [] : ['Job Template ID required']),
    summary: (ctx) => [
      { label: 'JT ID', value: ctx.jt_id },
      { label: 'Label', value: ctx.jt_name_label },
    ],
  },
  {
    id: 'survey',
    title: 'Survey questions',
    render: (ctx, setCtx) => (
      <div className="space-y-3">
        {ctx.survey.map((q, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              placeholder="variable"
              value={q.variable}
              onChange={(e) => {
                const next = [...ctx.survey]
                next[idx] = { ...q, variable: e.target.value }
                setCtx({ survey: next })
              }}
            />
            <Select
              value={q.type}
              onChange={(e) => {
                const next = [...ctx.survey]
                next[idx] = { ...q, type: e.target.value }
                setCtx({ survey: next })
              }}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'integer', label: 'Integer' },
                { value: 'multiplechoice', label: 'Choice' },
              ]}
            />
            <Input
              placeholder="question"
              value={q.question}
              onChange={(e) => {
                const next = [...ctx.survey]
                next[idx] = { ...q, question: e.target.value }
                setCtx({ survey: next })
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCtx({ survey: ctx.survey.filter((_, i) => i !== idx) })}
            >
              X
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCtx({ survey: [...ctx.survey, { variable: '', type: 'text', question: '' }] })}
        >
          + Add question
        </Button>
      </div>
    ),
    summary: (ctx) => [{ label: 'Questions', value: `${ctx.survey.length}` }],
  },
  {
    id: 'approval',
    title: 'Approval',
    render: (ctx, setCtx) => (
      <div className="space-y-3">
        <CheckField
          label="Require approval"
          checked={ctx.require_approval}
          onChange={(v) => setCtx({ require_approval: v })}
        />
        {ctx.require_approval && (
          <TextField label="Approver team ID" value={ctx.approver_team} onChange={(v) => setCtx({ approver_team: v })} />
        )}
      </div>
    ),
    summary: (ctx) => [{ label: 'Approval', value: ctx.require_approval ? `team ${ctx.approver_team}` : 'No' }],
  },
  {
    id: 'catalog',
    title: 'Catalog metadata',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Catalog name" value={ctx.catalog_name} onChange={(v) => setCtx({ catalog_name: v })} />
        <TextField label="Category" value={ctx.category} onChange={(v) => setCtx({ category: v })} />
        <TextField label="Icon" value={ctx.icon} onChange={(v) => setCtx({ icon: v })} />
        <TextAreaField label="Description" value={ctx.description} onChange={(v) => setCtx({ description: v })} />
      </div>
    ),
    validate: (ctx) => (ctx.catalog_name ? [] : ['Catalog name required']),
    summary: (ctx) => [
      { label: 'Name', value: ctx.catalog_name },
      { label: 'Category', value: ctx.category },
    ],
  },
]

export function SelfServiceWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onComplete = async (ctx: Ctx) => {
    await api.post('/service_catalog/', {
      name: ctx.catalog_name,
      description: ctx.description,
      category: ctx.category,
      icon: ctx.icon,
      job_template: Number(ctx.jt_id),
      requires_approval: ctx.require_approval,
      approver_team: ctx.approver_team ? Number(ctx.approver_team) : null,
      survey_spec: { spec: ctx.survey },
    })
    navigate('/service_catalog')
  }

  return (
    <Wizard
      title={t('wizards.self_service_title')}
      scope="self_service"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/service_catalog')}
    />
  )
}
