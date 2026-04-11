import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Wizard } from './Wizard'
import type { WizardStep } from './types'

// Mock recommendations hook so RecommendationsPanel renders empty
vi.mock('@/api/hooks/useRecommendations', () => ({
  useRecommendations: () => ({ data: { count: 0, results: [] }, isLoading: false }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'wizards.review': 'Review',
        'wizards.step': 'Step',
        'wizards.next': 'Next',
        'wizards.back': 'Back',
        'wizards.cancel': 'Cancel',
        'wizards.create_all': 'Create All',
        'wizards.error': 'Error',
        'recommendations.title': 'Recommendations',
        'recommendations.dismiss': 'Dismiss',
      }
      return map[key] ?? key
    },
  }),
}))

interface Ctx {
  name: string
  email: string
}

const steps: WizardStep<Ctx>[] = [
  {
    id: 'basics',
    title: 'Basics',
    render: (ctx, setCtx) => (
      <input
        aria-label="name"
        value={ctx.name}
        onChange={(e) => setCtx({ name: e.target.value })}
      />
    ),
    validate: (ctx) => (ctx.name ? [] : ['Name is required']),
    summary: (ctx) => [{ label: 'Name', value: ctx.name }],
  },
  {
    id: 'contact',
    title: 'Contact',
    render: (ctx, setCtx) => (
      <input
        aria-label="email"
        value={ctx.email}
        onChange={(e) => setCtx({ email: e.target.value })}
      />
    ),
    summary: (ctx) => [{ label: 'Email', value: ctx.email }],
  },
]

function renderWizard(onComplete = vi.fn().mockResolvedValue(undefined), onCancel = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const utils = render(
    <QueryClientProvider client={qc}>
      <Wizard
        title="Test Wizard"
        scope="dashboard"
        initialContext={{ name: '', email: '' }}
        steps={steps}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </QueryClientProvider>,
  )
  return { ...utils, onComplete, onCancel }
}

describe('Wizard', () => {
  it('renders first step', () => {
    renderWizard()
    expect(screen.getByText('Test Wizard')).toBeInTheDocument()
    expect(screen.getByLabelText('name')).toBeInTheDocument()
  })

  it('blocks Next when validation fails', () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByLabelText('name')).toBeInTheDocument()
  })

  it('advances to next step when valid', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('email')).toBeInTheDocument()
  })

  it('Back button returns to previous step', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('name')).toBeInTheDocument()
  })

  it('renders review step with summaries', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
  })

  it('calls onComplete on Create All', async () => {
    const { onComplete } = renderWizard()
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create All' }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(onComplete.mock.calls[0]?.[0]).toMatchObject({ name: 'Acme' })
  })

  it('shows error banner when onComplete throws', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('Boom'))
    renderWizard(onComplete)
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create All' }))
    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument())
  })

  it('Cancel calls onCancel', () => {
    const { onCancel } = renderWizard()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
