import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table'
import { Search, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useEventLogs } from '@/api/hooks/useEventRules'
import { formatRelativeTime } from '@/lib/utils'
import type { EventLog } from '@/api/types'

const STATUS_VARIANT: Record<string, 'success' | 'error' | 'secondary' | 'outline'> = {
  action_fired: 'success',
  matched: 'success',
  unmatched: 'secondary',
  throttled: 'outline',
  action_failed: 'error',
  error: 'error',
  signature_failed: 'error',
  received: 'outline',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'action_fired', label: 'Action Fired' },
  { value: 'matched', label: 'Matched' },
  { value: 'unmatched', label: 'Unmatched' },
  { value: 'throttled', label: 'Throttled' },
  { value: 'action_failed', label: 'Action Failed' },
  { value: 'error', label: 'Error' },
  { value: 'signature_failed', label: 'Signature Failed' },
]

const columnHelper = createColumnHelper<EventLog>()

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => (
      <Link
        to={`/event_logs/${info.getValue()}`}
        className="font-medium text-primary hover:underline"
      >
        #{info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('event_rule_name', {
    header: 'Rule',
    cell: (info) => {
      const ruleId = info.row.original.event_rule
      return ruleId ? (
        <Link to={`/event_rules/${ruleId}`} className="text-primary hover:underline">
          {info.getValue()}
        </Link>
      ) : (
        <span className="text-muted-foreground">{info.getValue() || 'Deleted'}</span>
      )
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={STATUS_VARIANT[info.getValue()] ?? 'outline'}>
        {info.getValue().replace('_', ' ')}
      </Badge>
    ),
  }),
  columnHelper.accessor('event_type', {
    header: 'Event Type',
    cell: (info) => info.getValue() || <span className="text-muted-foreground">-</span>,
  }),
  columnHelper.accessor('source_ip', {
    header: 'Source IP',
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue() ?? '-'}</span>
    ),
  }),
  columnHelper.accessor('job_id', {
    header: 'Job',
    cell: (info) => {
      const jobId = info.getValue()
      return jobId ? (
        <Link to={`/jobs/${jobId}`} className="text-primary hover:underline">#{jobId}</Link>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  }),
  columnHelper.accessor('created', {
    header: 'Received',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function EventLogs() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useEventLogs({
    page,
    page_size: pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
    event_rule: searchParams.get('event_rule') ?? undefined,
  })

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Event Logs</h1>
        <p className="text-sm text-muted-foreground">
          Incoming webhook events and rule evaluation results
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by rule name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          options={STATUS_OPTIONS}
          className="w-[160px]"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['event_logs'] })}
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
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
      )}
    </div>
  )
}
