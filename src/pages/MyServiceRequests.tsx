import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useServiceRequests } from '@/api/hooks/useServiceCatalog'
import { formatRelativeTime } from '@/lib/utils'
import type { ServiceRequestStatus } from '@/api/types'

const STATUS_VARIANT: Record<ServiceRequestStatus, 'outline' | 'secondary' | 'success' | 'error'> = {
  pending_approval: 'outline',
  approved: 'secondary',
  rejected: 'error',
  running: 'secondary',
  successful: 'success',
  failed: 'error',
  canceled: 'outline',
}

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  running: 'Running',
  successful: 'Successful',
  failed: 'Failed',
  canceled: 'Canceled',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
]

export function MyServiceRequests() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [status, setStatus] = useState<string>('')

  const { data, isLoading } = useServiceRequests({
    page,
    page_size: pageSize,
    mine: true,
    status: (status || undefined) as ServiceRequestStatus | undefined,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> My Requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Service requests you have submitted.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No requests yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Approver</th>
                  <th className="p-3">Job</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((sr) => (
                  <tr key={sr.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link
                        to={`/service_requests/${sr.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {sr.summary_fields?.catalog_item.name ?? `#${sr.catalog_item}`}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge variant={STATUS_VARIANT[sr.status]}>
                        {STATUS_LABEL[sr.status]}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatRelativeTime(sr.created)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {sr.summary_fields?.approved_by?.username ?? '—'}
                    </td>
                    <td className="p-3">
                      {sr.unified_job ? (
                        <Link
                          to={`/jobs/${sr.unified_job}`}
                          className="text-primary hover:underline"
                        >
                          #{sr.unified_job}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
