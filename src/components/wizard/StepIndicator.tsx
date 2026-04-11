import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WizardStep } from './types'

interface StepIndicatorProps<TCtx> {
  steps: WizardStep<TCtx>[]
  currentStep: number
  onJump: (index: number) => void
}

export function StepIndicator<TCtx>({ steps, currentStep, onJump }: StepIndicatorProps<TCtx>) {
  return (
    <ol className="space-y-2">
      {steps.map((step, idx) => {
        const isCurrent = idx === currentStep
        const isComplete = idx < currentStep
        const clickable = idx <= currentStep
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => clickable && onJump(idx)}
              disabled={!clickable}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                isCurrent && 'bg-primary/10 font-medium text-primary',
                !isCurrent && isComplete && 'text-foreground hover:bg-accent',
                !clickable && 'cursor-not-allowed text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isComplete && 'border-green-600 bg-green-600 text-white',
                  !isCurrent && !isComplete && 'border-muted-foreground/30',
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className="truncate">{step.title}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
