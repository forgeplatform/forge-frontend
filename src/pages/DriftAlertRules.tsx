import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { Search, RefreshCw, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useDriftAlertRules } from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'
import type { DriftAlertRule } from '@/api/types'

const columnHelper = createColumnHelper<DriftAlertRule>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/drift_alert_rules/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('enabled', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'success' : 'secondary'}>
        {info.getValue() ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  }),
  columnHelper.accessor('severity_min', {
    header: 'Min Severity',
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor('threshold_count', {
    header: 'Threshold',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('trigger_count', {
    header: 'Triggered',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('last_triggered_at', {
    header: 'Last Triggered',
    cell: (info) => {
      const val = info.getValue()
      if (!val) return <span className="text-muted-foreground">Never</span>
      return <span className="text-muted-foreground">{formatRelativeTime(val)}</span>
    },
  }),
  columnHelper.accessor('modified', {
    header: 'Modified',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function DriftAlertRules() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const orderBy = useMemo(() => {
    const s = sorting[0]
    if (!s) return 'name'
    return s.desc ? `-${s.id}` : s.id
  }, [sorting])

  const { data, isLoading, isFetching } = useDriftAlertRules({
    page,
    page_size: pageSize,
    order_by: orderBy,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Drift Alert Rules</h1>
        <p className="text-sm text-muted-foreground">
          Define rules to alert when drift exceeds thresholds
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search alert rules..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <div className="flex items-center gap-2">
          <Link to="/drift_alert_rules/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Create
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['drift_alert_rules'] })}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
