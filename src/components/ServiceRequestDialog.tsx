import { useState, useEffect } from 'react'
import { Loader2, Send, ChevronRight, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { SurveyQuestionInput } from '@/components/SurveyQuestionInput'
import {
  useServiceCatalogItemLaunchData,
  useSubmitServiceRequest,
} from '@/api/hooks/useServiceCatalog'
import type {
  ServiceCatalogItem,
  ServiceRequestSubmitPayload,
  SurveyQuestion,
} from '@/api/types'

interface ServiceRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogItem: ServiceCatalogItem
  onSubmitted?: () => void
}

interface SurveySpecLike {
  spec?: SurveyQuestion[]
}

function getSpec(s: unknown): SurveyQuestion[] {
  const spec = (s as SurveySpecLike | undefined)?.spec
  return Array.isArray(spec) ? spec : []
}

export function ServiceRequestDialog({
  open,
  onOpenChange,
  catalogItem,
  onSubmitted,
}: ServiceRequestDialogProps) {
  const { data: launchData, isLoading } = useServiceCatalogItemLaunchData(
    open ? catalogItem.id : undefined,
  )
  const submitMutation = useSubmitServiceRequest(catalogItem.id)

  const [step, setStep] = useState(0)
  const [justification, setJustification] = useState('')
  const [wfAnswers, setWfAnswers] = useState<Record<string, unknown>>({})
  const [nodeAnswers, setNodeAnswers] = useState<Record<string, Record<string, unknown>>>({})

  const wfSpec = getSpec(launchData?.survey_spec)
  const nodeSurveys = launchData?.node_surveys ?? []
  const hasWfSurvey = !!launchData?.survey_enabled && wfSpec.length > 0

  // Steps: 0 = justification, 1 = wf survey (if any), 2..N = node surveys, last = confirm
  const steps: Array<'justify' | 'wf' | 'node' | 'confirm'> = ['justify']
  if (hasWfSurvey) steps.push('wf')
  for (let i = 0; i < nodeSurveys.length; i++) steps.push('node')
  steps.push('confirm')

  useEffect(() => {
    if (open) {
      setStep(0)
      setJustification('')
      setWfAnswers(Object.fromEntries(wfSpec.filter((q) => q.default !== undefined).map((q) => [q.variable, q.default])))
      const nd: Record<string, Record<string, unknown>> = {}
      for (const ns of nodeSurveys) {
        const answers: Record<string, unknown> = {}
        for (const q of getSpec(ns.survey_spec)) {
          if (q.default !== undefined) answers[q.variable] = q.default
        }
        nd[ns.identifier] = answers
      }
      setNodeAnswers(nd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, launchData])

  const handleSubmit = () => {
    const payload: ServiceRequestSubmitPayload = {
      justification,
      extra_vars: wfAnswers,
      node_survey_data: nodeAnswers,
    }
    submitMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false)
        onSubmitted?.()
      },
    })
  }

  const isLast = step === steps.length - 1
  const currentKind = steps[step]

  // Compute which node-survey index this step corresponds to
  let nodeIndex = -1
  if (currentKind === 'node') {
    let count = 0
    for (let i = 0; i <= step; i++) {
      if (steps[i] === 'node') count++
    }
    nodeIndex = count - 1
  }

  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (currentKind === 'justify') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Why do you need this?</h3>
            {catalogItem.requires_approval && (
              <Badge variant="outline">Approval required</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{catalogItem.description}</p>
          <div className="space-y-2">
            <Label>Justification</Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              placeholder="Briefly explain why you need this automation."
            />
          </div>
        </div>
      )
    }

    if (currentKind === 'wf') {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Survey</h3>
          {wfSpec.map((q) => (
            <div key={q.variable} className="space-y-2">
              <Label>
                {q.question_name}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {q.question_description && (
                <p className="text-xs text-muted-foreground">{q.question_description}</p>
              )}
              <SurveyQuestionInput
                question={q}
                value={wfAnswers[q.variable]}
                onChange={(val) => setWfAnswers((prev) => ({ ...prev, [q.variable]: val }))}
              />
            </div>
          ))}
        </div>
      )
    }

    if (currentKind === 'node' && nodeIndex >= 0) {
      const ns = nodeSurveys[nodeIndex]!
      const spec = getSpec(ns.survey_spec)
      const answers = nodeAnswers[ns.identifier] ?? {}
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Node Survey</h3>
            <Badge variant="outline">Node: {ns.identifier.slice(0, 12)}</Badge>
          </div>
          {spec.map((q) => (
            <div key={q.variable} className="space-y-2">
              <Label>
                {q.question_name}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {q.question_description && (
                <p className="text-xs text-muted-foreground">{q.question_description}</p>
              )}
              <SurveyQuestionInput
                question={q}
                value={answers[q.variable]}
                onChange={(val) =>
                  setNodeAnswers((prev) => ({
                    ...prev,
                    [ns.identifier]: { ...(prev[ns.identifier] ?? {}), [q.variable]: val },
                  }))
                }
              />
            </div>
          ))}
        </div>
      )
    }

    // confirm
    return (
      <div className="space-y-3">
        <h3 className="font-semibold">Confirm</h3>
        <p className="text-sm text-muted-foreground">
          {catalogItem.requires_approval
            ? 'This request will be sent for approval before it runs.'
            : 'This request will be launched immediately.'}
        </p>
        {justification && (
          <div className="text-sm">
            <span className="font-medium">Justification:</span> {justification}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request: {catalogItem.name}</DialogTitle>
          {steps.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {steps.length}
            </p>
          )}
        </DialogHeader>

        {renderStep()}

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          )}
          {!isLast ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              Submit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
