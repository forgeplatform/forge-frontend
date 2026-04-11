import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '@/api/client'
import { Wizard } from '@/components/wizard/Wizard'
import { TextField, CheckField } from '@/components/wizard/fields'
import type { WizardStep } from '@/components/wizard/types'

interface Ctx {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  create_team: boolean
  team_name: string
  team_id: string
  role: string
}

const initial: Ctx = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  create_team: true,
  team_name: '',
  team_id: '',
  role: 'member',
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'user',
    title: 'User basics',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <TextField label="Username" value={ctx.username} onChange={(v) => setCtx({ username: v })} />
        <TextField label="Email" value={ctx.email} onChange={(v) => setCtx({ email: v })} type="email" />
        <TextField label="Password" value={ctx.password} onChange={(v) => setCtx({ password: v })} type="password" />
        <TextField label="First name" value={ctx.first_name} onChange={(v) => setCtx({ first_name: v })} />
        <TextField label="Last name" value={ctx.last_name} onChange={(v) => setCtx({ last_name: v })} />
      </div>
    ),
    validate: (ctx) => {
      const errs: string[] = []
      if (!ctx.username) errs.push('Username required')
      if (!ctx.password) errs.push('Password required')
      return errs
    },
    summary: (ctx) => [
      { label: 'Username', value: ctx.username },
      { label: 'Email', value: ctx.email },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    render: (ctx, setCtx) => (
      <div className="space-y-4">
        <CheckField
          label="Create a new team"
          checked={ctx.create_team}
          onChange={(v) => setCtx({ create_team: v })}
        />
        {ctx.create_team ? (
          <TextField label="New team name" value={ctx.team_name} onChange={(v) => setCtx({ team_name: v })} />
        ) : (
          <TextField label="Existing team ID" value={ctx.team_id} onChange={(v) => setCtx({ team_id: v })} />
        )}
      </div>
    ),
    summary: (ctx) => [
      { label: 'Team', value: ctx.create_team ? `new: ${ctx.team_name}` : `id: ${ctx.team_id}` },
    ],
  },
  {
    id: 'role',
    title: 'Role',
    render: (ctx, setCtx) => (
      <TextField label="Role" value={ctx.role} onChange={(v) => setCtx({ role: v })} hint="e.g. admin, member, auditor" />
    ),
    summary: (ctx) => [{ label: 'Role', value: ctx.role }],
  },
]

export function AccessWizard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const onComplete = async (ctx: Ctx) => {
    const { data: user } = await api.post('/users/', {
      username: ctx.username,
      email: ctx.email,
      password: ctx.password,
      first_name: ctx.first_name,
      last_name: ctx.last_name,
    })
    let teamId: number | null = null
    if (ctx.create_team && ctx.team_name) {
      const { data: team } = await api.post('/teams/', { name: ctx.team_name })
      teamId = team.id
    } else if (ctx.team_id) {
      teamId = Number(ctx.team_id)
    }
    if (teamId) {
      await api.post(`/teams/${teamId}/users/`, { id: user.id })
    }
    navigate('/users')
  }

  return (
    <Wizard
      title={t('wizards.access_title')}
      scope="access"
      initialContext={initial}
      steps={steps}
      onComplete={onComplete}
      onCancel={() => navigate('/users')}
    />
  )
}
