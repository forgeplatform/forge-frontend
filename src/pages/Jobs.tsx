import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { Search, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useJobs } from '@/api/hooks/useJobs'
import { statusConfig, typeLabels } from '@/lib/statusConfig'
import { formatRelativeTime, formatDuration } from '@/lib/utils'
import type { UnifiedJob } from '@/api/types'

// --- Status filter options ---

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'successful', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'error', label: 'Error' },
  { value: 'running', label: 'Running' },
  { value: 'pending', label: 'Pending' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'canceled', label: 'Canceled' },
]

// --- Column definitions ---

const columnHelper = createColumnHelper<UnifiedJob>()

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => (
      <span className="font-mono text-muted-foreground">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/jobs/${info.row.original.id}?type=${info.row.original.type}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const config = statusConfig[status]
      const Icon = config.icon
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon
            className={`h-3 w-3${status === 'running' ? ' animate-spin' : ''}`}
          />
          {config.label}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info) => typeLabels[info.getValue()] ?? info.getValue(),
  }),
  columnHelper.accessor('started', {
    header: 'Started',
    cell: (info) => {
      const v = info.getValue()
      return v ? (
        <span className="text-muted-foreground">{formatRelativeTime(v)}</span>
      ) : (
        <span className="text-muted-foreground">–</span>
      )
    },
  }),
  columnHelper.accessor('finished', {
    header: 'Finished',
    cell: (info) => {
      const v = info.getValue()
      return v ? (
        <span className="text-muted-foreground">{formatRelativeTime(v)}</span>
      ) : (
        <span className="text-muted-foreground">–</span>
      )
    },
  }),
  columnHelper.accessor('elapsed', {
    header: 'Duration',
    cell: (info) => (
      <span className="font-mono text-muted-foreground">
        {formatDuration(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor(
    (row) => row.summary_fields?.created_by?.username ?? '',
    {
      id: 'launched_by',
      header: 'Launched by',
      enableSorting: false,
      cell: (info) => info.getValue() || (
        <span className="text-muted-foreground">–</span>
      ),
    },
  ),
]

// --- Jobs page ---

export function Jobs() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'finished', desc: true },
  ])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const orderBy = useMemo(() => {
    const s = sorting[0]
    if (!s) return '-finished'
    return s.desc ? `-${s.id}` : s.id
  }, [sorting])

  const { data, isLoading, isFetching } = useJobs({
    page,
    page_size: pageSize,
    order_by: orderBy,
    status: statusFilter || undefined,
    search: search || undefined,
  })

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting(updater)
      setPage(1)
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          All automation jobs across your platform
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <DataTable table={table} isLoading={isLoading} />

      {/* Pagination */}
      {data && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  )
}
