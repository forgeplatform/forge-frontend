import { useState } from 'react'
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export interface SurveyQuestion {
  variable: string
  question_name: string
  question_description: string
  type: 'text' | 'textarea' | 'password' | 'integer' | 'float' | 'multiplechoice' | 'multiselect'
  required: boolean
  default: string
  choices: string
  min: number | null
  max: number | null
  new_question: boolean
}

export interface SurveySpec {
  name: string
  description: string
  spec: SurveyQuestion[]
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'password', label: 'Password' },
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'multiplechoice', label: 'Multiple Choice' },
  { value: 'multiselect', label: 'Multi-select' },
]

const emptyQuestion: SurveyQuestion = {
  variable: '',
  question_name: '',
  question_description: '',
  type: 'text',
  required: true,
  default: '',
  choices: '',
  min: null,
  max: null,
  new_question: true,
}

interface SurveyEditorProps {
  value: SurveySpec
  onChange: (spec: SurveySpec) => void
}

export function SurveyEditor({ value, onChange }: SurveyEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<SurveyQuestion>(emptyQuestion)
  const [showDialog, setShowDialog] = useState(false)

  const questions = value.spec

  const openAdd = () => {
    setDraft({ ...emptyQuestion })
    setEditingIndex(null)
    setShowDialog(true)
  }

  const openEdit = (index: number) => {
    setDraft({ ...questions[index]! })
    setEditingIndex(index)
    setShowDialog(true)
  }

  const saveQuestion = () => {
    const updated = [...questions]
    if (editingIndex !== null) {
      updated[editingIndex] = { ...draft, new_question: false }
    } else {
      updated.push({ ...draft, new_question: true })
    }
    onChange({ ...value, spec: updated })
    setShowDialog(false)
  }

  const removeQuestion = (index: number) => {
    onChange({ ...value, spec: questions.filter((_, i) => i !== index) })
  }

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return
    const updated = [...questions]
    const [item] = updated.splice(from, 1)
    updated.splice(to, 0, item!)
    onChange({ ...value, spec: updated })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Survey Name</Label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Survey name"
          />
        </div>
        <div className="space-y-2">
          <Label>Survey Description</Label>
          <Input
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="Survey description"
          />
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No survey questions yet. Click "Add Question" to start.
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveQuestion(i, i - 1)} className="text-muted-foreground hover:text-foreground" disabled={i === 0}>
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{q.question_name || q.variable}</span>
                    <span className="text-xs text-muted-foreground rounded bg-muted px-1.5 py-0.5">{q.type}</span>
                    {q.required && <span className="text-xs text-destructive">*</span>}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">${'{'}{ q.variable }{'}'}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="mr-1 h-4 w-4" />
        Add Question
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Question Name *</Label>
              <Input value={draft.question_name} onChange={(e) => setDraft({ ...draft, question_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={draft.question_description} onChange={(e) => setDraft({ ...draft, question_description: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Variable Name *</Label>
                <Input value={draft.variable} onChange={(e) => setDraft({ ...draft, variable: e.target.value })} placeholder="my_variable" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Answer Type</Label>
                <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as SurveyQuestion['type'] })} options={TYPE_OPTIONS} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Answer</Label>
              {draft.type === 'textarea' ? (
                <Textarea value={draft.default} onChange={(e) => setDraft({ ...draft, default: e.target.value })} rows={3} />
              ) : (
                <Input value={draft.default} onChange={(e) => setDraft({ ...draft, default: e.target.value })} type={draft.type === 'integer' || draft.type === 'float' ? 'number' : 'text'} />
              )}
            </div>
            {(draft.type === 'multiplechoice' || draft.type === 'multiselect') && (
              <div className="space-y-2">
                <Label>Choices (one per line)</Label>
                <Textarea value={draft.choices} onChange={(e) => setDraft({ ...draft, choices: e.target.value })} rows={4} placeholder={"Option A\nOption B\nOption C"} />
              </div>
            )}
            {(draft.type === 'integer' || draft.type === 'float' || draft.type === 'text' || draft.type === 'textarea') && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{draft.type === 'text' || draft.type === 'textarea' ? 'Min Length' : 'Minimum'}</Label>
                  <Input type="number" value={draft.min ?? ''} onChange={(e) => setDraft({ ...draft, min: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-2">
                  <Label>{draft.type === 'text' || draft.type === 'textarea' ? 'Max Length' : 'Maximum'}</Label>
                  <Input type="number" value={draft.max ?? ''} onChange={(e) => setDraft({ ...draft, max: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={draft.required} onCheckedChange={(v) => setDraft({ ...draft, required: v })} />
              <Label>Required</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveQuestion} disabled={!draft.variable || !draft.question_name}>
              {editingIndex !== null ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
