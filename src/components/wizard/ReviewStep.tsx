import type { WizardStep } from './types'

interface ReviewStepProps<TCtx> {
  steps: WizardStep<TCtx>[]
  ctx: TCtx
}

export function ReviewStep<TCtx>({ steps, ctx }: ReviewStepProps<TCtx>) {
  return (
    <div className="space-y-5">
      {steps.map((step) => {
        if (!step.summary) return null
        const items = step.summary(ctx)
        if (items.length === 0) return null
        return (
          <div key={step.id} className="rounded-md border bg-card">
            <div className="border-b px-4 py-2 text-sm font-medium">{step.title}</div>
            <table className="w-full text-sm">
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="w-1/3 px-4 py-2 text-muted-foreground">{item.label}</td>
                    <td className="px-4 py-2 font-medium break-all">{item.value || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
