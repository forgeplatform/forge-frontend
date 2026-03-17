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
import { useInventories } from '@/api/hooks/useInventories'
import type { Inventory } from '@/api/types'

const kindLabels: Record<string, string> = {
  '': 'Standard',
  smart: 'Smart',
  constructed: 'Constructed',
}

const columnHelper = createColumnHelper<Inventory>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/inventories/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('kind', {
    header: 'Type',
    cell: (info) => (
      <Badge variant="outline">{kindLabels[info.getValue()] ?? info.getValue()}</Badge>
    ),
  }),
  columnHelper.accessor(
    (row) => row.summary_fields?.organization?.name ?? '',
    {
      id: 'organization',
      header: 'Organization',
      enableSorting: false,
      cell: (info) => info.getValue() || (
        <span className="text-muted-foreground">–</span>
      ),
    },
  ),
  columnHelper.accessor('total_hosts', {
    header: 'Hosts',
    cell: (info) => info.getValue().toLocaleString(),
  }),
  columnHelper.accessor('total_groups', {
    header: 'Groups',
    cell: (info) => info.getValue().toLocaleString(),
  }),
  columnHelper.accessor('total_inventory_sources', {
    header: 'Sources',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('has_active_failures', {
    header: 'Health',
    enableSorting: false,
    cell: (info) => (
      info.getValue() ? (
        <Badge variant="error">Failures</Badge>
      ) : (
        <Badge variant="success">Healthy</Badge>
      )
    ),
  }),
]

export function Inventories() {
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

  const { data, isLoading, isFetching } = useInventories({
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
        <h1 className="text-2xl font-bold tracking-tight">Inventories</h1>
        <p className="text-sm text-muted-foreground">
          Hosts and groups targeted by automation
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventories..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Link to="/inventories/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create Inventory
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['inventories'] })}
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
