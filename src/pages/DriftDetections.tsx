import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { Search, RefreshCw, Download } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useDriftDetections, useDriftExport } from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'
import type { DriftDetection } from '@/api/types'

const CATEGORY_LABELS: Record<string, string> = {
  packages: 'Packages',
  services: 'Services',
  users_groups: 'Users & Groups',
  network: 'Network',
  mounts: 'Mounts',
  kernel: 'Kernel',
  other: 'Other',
}

const SEVERITY_VARIANT: Record<string, 'error' | 'outline' | 'secondary' | 'success'> = {
  critical: 'error',
  high: 'error',
  medium: 'outline',
  low: 'secondary',
}

const columnHelper = createColumnHelper<DriftDetection>()

const columns = [
  columnHelper.accessor('host_name', {
    header: 'Host',
    cell: (info) => (
      <Link
        to={`/drift_detections/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue() || `Host #${info.row.original.host}`}
      </Link>
    ),
  }),
  columnHelper.accessor('fact_path', {
    header: 'Fact',
    cell: (info) => <code className="text-xs">{info.getValue()}</code>,
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => (
      <Badge variant="outline">
        {CATEGORY_LABELS[info.getValue()] ?? info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('severity', {
    header: 'Severity',
    cell: (info) => (
      <Badge variant={SEVERITY_VARIANT[info.getValue()] ?? 'secondary'}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor('summary', {
    header: 'Summary',
    cell: (info) => (
      <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('acknowledged', {
    header: 'Ack',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'success' : 'secondary'}>
        {info.getValue() ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
  columnHelper.accessor('detected_at', {
    header: 'Detected',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'packages', label: 'Packages' },
  { value: 'services', label: 'Services' },
  { value: 'users_groups', label: 'Users & Groups' },
  { value: 'network', label: 'Network' },
  { value: 'mounts', label: 'Mounts' },
  { value: 'kernel', label: 'Kernel' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function DriftDetections() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('')
  const queryClient = useQueryClient()
  const exportMutation = useDriftExport()

  const { data, isLoading, isFetching } = useDriftDetections({
    page,
    page_size: pageSize,
    search: search || undefined,
    category: category || undefined,
    severity: severity || undefined,
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
        <h1 className="text-2xl font-bold tracking-tight">Drift Detections</h1>
        <p className="text-sm text-muted-foreground">
          Configuration changes detected between host fact snapshots
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by fact path..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          options={CATEGORY_OPTIONS}
        />
        <Select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1) }}
          options={SEVERITY_OPTIONS}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMutation.mutate({})}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['drift_detections'] })}
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
