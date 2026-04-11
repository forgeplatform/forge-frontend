import { useReducer, useCallback } from 'react'
import type { WizardStep } from './types'

interface State<TCtx> {
  currentStep: number
  ctx: TCtx
  errors: string[]
  isSubmitting: boolean
  isAdvancing: boolean
  submitError: string | null
  partialResults: Record<string, unknown>
}

type Action<TCtx> =
  | { type: 'SET_CTX'; patch: Partial<TCtx> }
  | { type: 'GOTO'; index: number }
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'SET_ERRORS'; errors: string[] }
  | { type: 'ADVANCE_START' }
  | { type: 'ADVANCE_END' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SET_PARTIAL'; key: string; value: unknown }

function reducer<TCtx>(state: State<TCtx>, action: Action<TCtx>): State<TCtx> {
  switch (action.type) {
    case 'SET_CTX':
      return { ...state, ctx: { ...state.ctx, ...action.patch } }
    case 'GOTO':
      return { ...state, currentStep: action.index, errors: [] }
    case 'NEXT':
      return { ...state, currentStep: state.currentStep + 1, errors: [] }
    case 'BACK':
      return { ...state, currentStep: Math.max(0, state.currentStep - 1), errors: [] }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors }
    case 'ADVANCE_START':
      return { ...state, isAdvancing: true, errors: [] }
    case 'ADVANCE_END':
      return { ...state, isAdvancing: false }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, submitError: null }
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, submitError: action.error }
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, submitError: null }
    case 'SET_PARTIAL':
      return { ...state, partialResults: { ...state.partialResults, [action.key]: action.value } }
    default:
      return state
  }
}

export function useWizardState<TCtx>(
  initialContext: TCtx,
  steps: WizardStep<TCtx>[],
) {
  const [state, dispatch] = useReducer(reducer<TCtx>, {
    currentStep: 0,
    ctx: initialContext,
    errors: [],
    isSubmitting: false,
    isAdvancing: false,
    submitError: null,
    partialResults: {},
  } as State<TCtx>)

  const setCtx = useCallback((patch: Partial<TCtx>) => {
    dispatch({ type: 'SET_CTX', patch })
  }, [])

  const goToStep = useCallback((index: number) => {
    dispatch({ type: 'GOTO', index })
  }, [])

  const validate = useCallback((): boolean => {
    const step = steps[state.currentStep]
    if (!step?.validate) {
      dispatch({ type: 'SET_ERRORS', errors: [] })
      return true
    }
    const errs = step.validate(state.ctx)
    dispatch({ type: 'SET_ERRORS', errors: errs })
    return errs.length === 0
  }, [state.currentStep, state.ctx, steps])

  const next = useCallback(async () => {
    const step = steps[state.currentStep]
    const errs = step?.validate ? step.validate(state.ctx) : []
    if (errs.length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: errs })
      return false
    }
    if (step?.onNext) {
      dispatch({ type: 'ADVANCE_START' })
      try {
        const hookSetCtx = (patch: Partial<TCtx>) => dispatch({ type: 'SET_CTX', patch })
        const result = await step.onNext(state.ctx, hookSetCtx)
        if (Array.isArray(result) && result.length > 0) {
          dispatch({ type: 'SET_ERRORS', errors: result })
          dispatch({ type: 'ADVANCE_END' })
          return false
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        dispatch({ type: 'SET_ERRORS', errors: [msg] })
        dispatch({ type: 'ADVANCE_END' })
        return false
      }
      dispatch({ type: 'ADVANCE_END' })
    }
    dispatch({ type: 'NEXT' })
    return true
  }, [state.currentStep, state.ctx, steps])

  const back = useCallback(() => {
    dispatch({ type: 'BACK' })
  }, [])

  const submit = useCallback(
    async (onComplete: (ctx: TCtx) => Promise<void>) => {
      dispatch({ type: 'SUBMIT_START' })
      try {
        await onComplete(state.ctx)
        dispatch({ type: 'SUBMIT_SUCCESS' })
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        dispatch({ type: 'SUBMIT_ERROR', error: msg })
        return false
      }
    },
    [state.ctx],
  )

  return {
    ctx: state.ctx,
    setCtx,
    currentStep: state.currentStep,
    goToStep,
    next,
    back,
    errors: state.errors,
    validate,
    submit,
    isSubmitting: state.isSubmitting,
    isAdvancing: state.isAdvancing,
    submitError: state.submitError,
    partialResults: state.partialResults,
  }
}
