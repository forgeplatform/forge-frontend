import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useDriftAlerts } from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'
import type { DriftAlert } from '@/api/types'

const NOTIFICATION_VARIANT: Record<string, 'success' | 'error' | 'secondary'> = {
  sent: 'success',
  failed: 'error',
  pending: 'secondary',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
]

const columnHelper = createColumnHelper<DriftAlert>()

const columns = [
  columnHelper.accessor('alert_rule_name', {
    header: 'Rule',
    cell: (info) => (
      <Link
        to={`/drift_alerts/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue() || 'Deleted Rule'}
      </Link>
    ),
  }),
  columnHelper.accessor('drift_count', {
    header: 'Drift Items',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('notification_status', {
    header: 'Notification',
    cell: (info) => (
      <Badge variant={NOTIFICATION_VARIANT[info.getValue()] ?? 'secondary'}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('created', {
    header: 'Created',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function DriftAlerts() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('notification_status') ?? '')
  const queryClient = useQueryClient()

  const alertRule = searchParams.get('alert_rule') ?? undefined

  const { data, isLoading, isFetching } = useDriftAlerts({
    page,
    page_size: pageSize,
    alert_rule: alertRule,
    notification_status: statusFilter || undefined,
  })

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Drift Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Alerts triggered by drift detection rules
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          options={STATUS_OPTIONS}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['drift_alerts'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <DataTable table={table} isLoading={isLoading} />

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
