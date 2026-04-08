import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Check, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import {
  usePendingApprovals,
  useApproveServiceRequest,
  useRejectServiceRequest,
} from '@/api/hooks/useServiceCatalog'
import { formatRelativeTime } from '@/lib/utils'

export function ServiceApprovals() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const { data, isLoading } = usePendingApprovals({ page, page_size: pageSize })
  const approveMutation = useApproveServiceRequest()
  const rejectMutation = useRejectServiceRequest()

  const handleReject = (id: number) => {
    const reason = window.prompt('Reason for rejection?') || ''
    rejectMutation.mutate({ id, reason })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Inbox className="h-6 w-6" /> Approvals
        </h1>
        <p className="text-sm text-muted-foreground">
          Service requests waiting for your approval.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending requests.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Requested by</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3"></th>
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
                      {sr.summary_fields?.catalog_item.category && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {sr.summary_fields.catalog_item.category}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {sr.summary_fields?.requested_by?.username ?? '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatRelativeTime(sr.created)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(sr.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="mr-1 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(sr.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </div>
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
