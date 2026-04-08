import { useParams, Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useServiceRequest,
  useApproveServiceRequest,
  useRejectServiceRequest,
} from '@/api/hooks/useServiceCatalog'
import type { ServiceRequestStatus } from '@/api/types'

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  running: 'Running',
  successful: 'Successful',
  failed: 'Failed',
  canceled: 'Canceled',
}

export function ServiceRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: sr, isLoading } = useServiceRequest(id)
  const approveMutation = useApproveServiceRequest()
  const rejectMutation = useRejectServiceRequest()

  if (isLoading || !sr) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleReject = () => {
    const reason = window.prompt('Reason for rejection?') || ''
    rejectMutation.mutate({ id: sr.id, reason })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/my_requests">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Request #{sr.id} — {sr.summary_fields?.catalog_item.name}
        </h1>
        <Badge>{STATUS_LABEL[sr.status]}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Catalog item:</span>{' '}
              {sr.summary_fields?.catalog_item.name}
            </div>
            <div>
              <span className="font-medium">Requested by:</span>{' '}
              {sr.summary_fields?.requested_by?.username ?? '—'}
            </div>
            <div>
              <span className="font-medium">Created:</span> {sr.created}
            </div>
            {sr.approved_by && (
              <div>
                <span className="font-medium">Decided by:</span>{' '}
                {sr.summary_fields?.approved_by?.username} on {sr.approved_at}
              </div>
            )}
            {sr.rejection_reason && (
              <div>
                <span className="font-medium">Reason:</span> {sr.rejection_reason}
              </div>
            )}
            {sr.unified_job && (
              <div>
                <span className="font-medium">Job:</span>{' '}
                <Link
                  to={`/jobs/${sr.unified_job}`}
                  className="text-primary hover:underline"
                >
                  #{sr.unified_job}
                </Link>{' '}
                ({sr.summary_fields?.unified_job?.status})
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Justification & Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {sr.justification && (
              <div>
                <div className="font-medium">Justification</div>
                <p className="text-muted-foreground">{sr.justification}</p>
              </div>
            )}
            <div>
              <div className="font-medium">Extra vars</div>
              <pre className="rounded bg-muted p-2 text-xs overflow-x-auto">
                {JSON.stringify(sr.extra_vars, null, 2)}
              </pre>
            </div>
            {Object.keys(sr.node_survey_data || {}).length > 0 && (
              <div>
                <div className="font-medium">Node survey data</div>
                <pre className="rounded bg-muted p-2 text-xs overflow-x-auto">
                  {JSON.stringify(sr.node_survey_data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {sr.status === 'pending_approval' && (
        <div className="flex gap-2">
          <Button
            onClick={() => approveMutation.mutate(sr.id)}
            disabled={approveMutation.isPending}
          >
            <Check className="mr-1 h-4 w-4" /> Approve
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={rejectMutation.isPending}
          >
            <X className="mr-1 h-4 w-4" /> Reject
          </Button>
        </div>
      )}
    </div>
  )
}
