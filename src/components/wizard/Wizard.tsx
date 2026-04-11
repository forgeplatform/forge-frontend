import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StepIndicator } from './StepIndicator'
import { ReviewStep } from './ReviewStep'
import { RecommendationsPanel } from './RecommendationsPanel'
import { useWizardState } from './useWizardState'
import type { WizardProps, WizardStep } from './types'

export function Wizard<TCtx>({
  title,
  scope,
  initialContext,
  steps,
  onComplete,
  onCancel,
  completeButtonLabel,
}: WizardProps<TCtx>) {
  const { t } = useTranslation()

  // Auto-append a review step
  const reviewStep: WizardStep<TCtx> = {
    id: '__review__',
    title: t('wizards.review'),
    render: (ctx) => <ReviewStep steps={steps} ctx={ctx} />,
  }
  const allSteps = [...steps, reviewStep]

  const {
    ctx,
    setCtx,
    currentStep,
    goToStep,
    next,
    back,
    errors,
    submit,
    isSubmitting,
    isAdvancing,
    submitError,
  } = useWizardState(initialContext, allSteps)

  const isLast = currentStep === allSteps.length - 1
  const step = allSteps[currentStep]!

  const handleComplete = async () => {
    await submit(onComplete)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {t('wizards.step')} {currentStep + 1} / {allSteps.length}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <CardContent className="p-3">
            <StepIndicator steps={allSteps} currentStep={currentStep} onJump={goToStep} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <RecommendationsPanel scope={scope} />

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold">{step.title}</h2>
              {step.render(ctx, setCtx)}

              {errors.length > 0 && (
                <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" /> {t('wizards.error')}
                  </div>
                  <ul className="mt-1 list-inside list-disc">
                    {errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {submitError && (
                <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4" /> {t('wizards.error')}
                  </div>
                  <p className="mt-1 break-all">{submitError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onCancel} disabled={isSubmitting || isAdvancing}>
              {t('wizards.cancel')}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={back}
                disabled={currentStep === 0 || isSubmitting || isAdvancing}
              >
                {t('wizards.back')}
              </Button>
              {isLast ? (
                <Button onClick={handleComplete} disabled={isSubmitting || isAdvancing}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {completeButtonLabel ?? t('wizards.create_all')}
                </Button>
              ) : (
                <Button onClick={next} disabled={isAdvancing}>
                  {isAdvancing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('wizards.next')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
