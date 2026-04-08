import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SurveyQuestion } from '@/api/types'

interface SurveyQuestionInputProps {
  question: SurveyQuestion
  value: unknown
  onChange: (val: unknown) => void
}

export function SurveyQuestionInput({ question, value, onChange }: SurveyQuestionInputProps) {
  const qType = question.type

  if (qType === 'multiplechoice' || qType === 'multiselect') {
    const raw = question.choices
    const choices = Array.isArray(raw) ? raw : (raw || '').split('\n').filter(Boolean)
    const options = choices.map((c) => ({ value: c, label: c }))
    return (
      <Select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        options={[{ value: '', label: '-- Select --' }, ...options]}
      />
    )
  }

  if (qType === 'textarea') {
    return (
      <Textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    )
  }

  if (qType === 'integer' || qType === 'float') {
    return (
      <Input
        type="number"
        value={String(value ?? '')}
        onChange={(e) =>
          onChange(qType === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))
        }
        min={question.min ?? undefined}
        max={question.max ?? undefined}
      />
    )
  }

  if (qType === 'password') {
    return (
      <Input
        type="password"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
  )
}
