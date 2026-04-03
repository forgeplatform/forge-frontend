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
import { useOutboundWebhooks } from '@/api/hooks/useEventRules'
import { formatRelativeTime } from '@/lib/utils'
import type { OutboundWebhook } from '@/api/types'

const columnHelper = createColumnHelper<OutboundWebhook>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/outbound_webhooks/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('target_url', {
    header: 'URL',
    cell: (info) => (
      <span className="max-w-[300px] truncate font-mono text-xs" title={info.getValue()}>
        {info.getValue()}
      </span>
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
  columnHelper.accessor('events', {
    header: 'Events',
    cell: (info) => (
      <div className="flex flex-wrap gap-1">
        {info.getValue().map(e => (
          <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
        ))}
      </div>
    ),
  }),
  columnHelper.accessor('last_status', {
    header: 'Last Status',
    cell: (info) => {
      const val = info.getValue()
      if (!val) return <span className="text-muted-foreground">-</span>
      return <Badge variant={val === 'success' ? 'success' : 'error'}>{val}</Badge>
    },
  }),
  columnHelper.accessor('modified', {
    header: 'Modified',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function OutboundWebhooks() {
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

  const { data, isLoading, isFetching } = useOutboundWebhooks({
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
        <h1 className="text-2xl font-bold tracking-tight">Outbound Webhooks</h1>
        <p className="text-sm text-muted-foreground">
          Push job status changes to external systems via HTTP webhooks
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search outbound webhooks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <div className="flex items-center gap-2">
          <Link to="/outbound_webhooks/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Create
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['outbound_webhooks'] })}
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
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
      )}
    </div>
  )
}
