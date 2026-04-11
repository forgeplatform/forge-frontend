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
  /**
   * Optional async hook called after successful validate() but before the
   * wizard advances to the next step. Return an array of error strings to
   * block the transition (they will render in the same error banner as
   * validate() errors). Use it to pre-create backend resources that later
   * steps depend on, e.g. creating a Project so the next step can show a
   * playbook dropdown sourced from its synced content.
   */
  onNext?: (ctx: TCtx, setCtx: (patch: Partial<TCtx>) => void) => Promise<string[] | void>
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
