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
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useInstances } from '@/api/hooks/useInstances'
import { formatRelativeTime } from '@/lib/utils'
import type { Instance } from '@/api/types'

const nodeTypeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  control: 'default',
  execution: 'secondary',
  hybrid: 'outline',
  hop: 'outline',
}

const columnHelper = createColumnHelper<Instance>()

const columns = [
  columnHelper.accessor('hostname', {
    header: 'Hostname',
    cell: (info) => (
      <Link
        to={`/instances/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('node_type', {
    header: 'Node Type',
    cell: (info) => {
      const t = info.getValue()
      return (
        <Badge variant={nodeTypeVariant[t] ?? 'secondary'}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('enabled', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'success' : 'error'}>
        {info.getValue() ? 'Enabled' : 'Disabled'}
      </Badge>
    ),
  }),
  columnHelper.accessor('capacity', {
    header: 'Capacity',
    cell: (info) => {
      const row = info.row.original
      const used = row.capacity - (row.capacity * row.percent_capacity_remaining / 100)
      return `${Math.round(used)} / ${row.capacity}`
    },
  }),
  columnHelper.accessor('jobs_running', {
    header: 'Running Jobs',
  }),
  columnHelper.accessor('version', {
    header: 'Version',
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue() || '–'}</span>
    ),
  }),
  columnHelper.accessor('last_seen', {
    header: 'Last Seen',
    cell: (info) => {
      const v = info.getValue()
      return v ? (
        <span className="text-muted-foreground">{formatRelativeTime(v)}</span>
      ) : (
        <span className="text-muted-foreground">Never</span>
      )
    },
  }),
]

export function Instances() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const orderBy = useMemo(() => {
    const s = sorting[0]
    if (!s) return 'hostname'
    return s.desc ? `-${s.id}` : s.id
  }, [sorting])

  const { data, isLoading, isFetching } = useInstances({
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
        <h1 className="text-2xl font-bold tracking-tight">Instances</h1>
        <p className="text-sm text-muted-foreground">
          Cluster nodes running automation workloads
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search instances..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['instances'] })}
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
