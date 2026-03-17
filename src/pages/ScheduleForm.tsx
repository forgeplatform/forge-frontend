import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RRuleEditor } from '@/components/schedule/RRuleEditor'
import { SchedulePreview } from '@/components/schedule/SchedulePreview'
import {
  useScheduleDetail,
  useCreateSchedule,
  useUpdateSchedule,
} from '@/api/hooks/useSchedules'
import { useJobTemplates } from '@/api/hooks/useTemplates'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

export function ScheduleForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: schedule, isLoading } = useScheduleDetail(id ?? '')
  const createMutation = useCreateSchedule()
  const updateMutation = useUpdateSchedule(id ?? '')
  const { data: templatesData } = useJobTemplates({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [unifiedJobTemplate, setUnifiedJobTemplate] = useState('')
  const [rrule, setRrule] = useState('')

  useEffect(() => {
    if (isEdit && schedule) {
      setName(schedule.name)
      setDescription(schedule.description)
      setEnabled(schedule.enabled)
      setUnifiedJobTemplate(String(schedule.unified_job_template))
      setRrule(schedule.rrule)
    }
  }, [isEdit, schedule])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      name,
      description,
      rrule,
      enabled,
    }
    if (unifiedJobTemplate) payload.unified_job_template = Number(unifiedJobTemplate)

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/schedules/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  const templateOptions = [
    { value: '', label: '-- Select Template --' },
    ...(templatesData?.results ?? []).map((t) => ({
      value: String(t.id),
      label: t.name,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/schedules"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Schedules
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Schedule' : 'Create Schedule'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template">Template *</Label>
                <Select
                  id="template"
                  value={unifiedJobTemplate}
                  onChange={(e) => setUnifiedJobTemplate(e.target.value)}
                  options={templateOptions}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Recurrence Rule</CardTitle></CardHeader>
            <CardContent>
              <RRuleEditor value={rrule} onChange={setRrule} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <SchedulePreview rrule={rrule} />
            </CardContent>
          </Card>
        </div>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message || 'An error occurred.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !name || !rrule}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create Schedule'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
