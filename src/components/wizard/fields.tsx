import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
}

export function TextField({ label, value, onChange, placeholder, type = 'text', hint }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  rows?: number
}

export function TextAreaField({ label, value, onChange, placeholder, hint, rows }: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  hint?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  hint,
}: SelectFieldProps) {
  const optionsWithPlaceholder = placeholder
    ? [{ value: '', label: placeholder }, ...options]
    : options
  return (
    <Field label={label} hint={hint}>
      <Select
        value={value}
        disabled={disabled}
        options={optionsWithPlaceholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

interface CheckFieldProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}

export function CheckField({ label, checked, onChange, hint }: CheckFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <div>
        <Label className="cursor-pointer" onClick={() => onChange(!checked)}>
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
