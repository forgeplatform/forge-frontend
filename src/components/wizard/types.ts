import type { ReactNode } from 'react'
import type { RecommendationScope } from '@/api/types'

export interface SummaryItem {
  label: string
  value: string
}

export interface WizardStep<TCtx> {
  id: string
  title: string
  render: (ctx: TCtx, setCtx: (patch: Partial<TCtx>) => void) => ReactNode
  validate?: (ctx: TCtx) => string[]
  summary?: (ctx: TCtx) => SummaryItem[]
}

export interface WizardProps<TCtx> {
  title: string
  scope: RecommendationScope
  initialContext: TCtx
  steps: WizardStep<TCtx>[]
  onComplete: (ctx: TCtx) => Promise<void>
  onCancel: () => void
  completeButtonLabel?: string
}
