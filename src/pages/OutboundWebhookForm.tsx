import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useOutboundWebhookDetail,
  useCreateOutboundWebhook,
  useUpdateOutboundWebhook,
} from '@/api/hooks/useEventRules'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import type { OutboundWebhookEventType } from '@/api/types'

const EVENT_OPTIONS: { value: OutboundWebhookEventType; label: string }[] = [
  { value: 'job.started', label: 'Job Started' },
  { value: 'job.succeeded', label: 'Job Succeeded' },
  { value: 'job.failed', label: 'Job Failed' },
  { value: 'job.canceled', label: 'Job Canceled' },
  { value: 'workflow.started', label: 'Workflow Started' },
  { value: 'workflow.succeeded', label: 'Workflow Succeeded' },
  { value: 'workflow.failed', label: 'Workflow Failed' },
]

export function OutboundWebhookForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: existing, isLoading } = useOutboundWebhookDetail(id ?? '')
  const createMutation = useCreateOutboundWebhook()
  const updateMutation = useUpdateOutboundWebhook(id ?? '')
  const { data: orgs } = useOrganizations({ page_size: 200 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organization, setOrganization] = useState<string>('')
  const [targetUrl, setTargetUrl] = useState('')
  const [events, setEvents] = useState<OutboundWebhookEventType[]>(['job.succeeded', 'job.failed'])
  const [enabled, setEnabled] = useState(true)
  const [sslVerify, setSslVerify] = useState(true)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description)
      setOrganization(existing.organization?.toString() ?? '')
      setTargetUrl(existing.target_url)
      setEvents(existing.events)
      setEnabled(existing.enabled)
      setSslVerify(existing.ssl_verify)
    }
  }, [existing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      description,
      organization: organization ? Number(organization) : null,
      url: targetUrl,
      events,
      enabled,
      ssl_verify: sslVerify,
    }

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => navigate(`/outbound_webhooks/${id}`),
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => navigate(`/outbound_webhooks/${data.id}`),
      })
    }
  }

  const toggleEvent = (event: OutboundWebhookEventType) => {
    setEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isEdit && isLoading) return <FormPageSkeleton />

  const orgOptions = [
    { value: '', label: '-- Select Organization --' },
    ...(orgs?.results ?? []).map(o => ({ value: String(o.id), label: o.name })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/outbound_webhooks"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Outbound Webhooks
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit Outbound Webhook' : 'Create Outbound Webhook'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Select id="org" value={organization} onChange={e => setOrganization(e.target.value)} options={orgOptions} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Webhook Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Target URL *</Label>
              <Input
                id="url"
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Events *</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {EVENT_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={opt.value}
                      checked={events.includes(opt.value)}
                      onCheckedChange={() => toggleEvent(opt.value)}
                    />
                    <label htmlFor={opt.value} className="text-sm cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="ssl_verify" checked={sslVerify} onCheckedChange={setSslVerify} />
                <Label htmlFor="ssl_verify">Verify SSL</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Outbound Webhook'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
