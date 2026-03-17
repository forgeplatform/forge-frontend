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
import { useInstanceGroups } from '@/api/hooks/useInstances'
import type { InstanceGroup } from '@/api/types'

const columnHelper = createColumnHelper<InstanceGroup>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/instance_groups/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('is_container_group', {
    header: 'Type',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'outline' : 'secondary'}>
        {info.getValue() ? 'Container' : 'Standard'}
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
  columnHelper.accessor('instances', {
    header: 'Instances',
  }),
  columnHelper.accessor('policy_instance_minimum', {
    header: 'Min Instances',
  }),
  columnHelper.accessor('max_concurrent_jobs', {
    header: 'Max Concurrent',
    cell: (info) => info.getValue() || 'Unlimited',
  }),
]

export function InstanceGroups() {
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

  const { data, isLoading, isFetching } = useInstanceGroups({
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
        <h1 className="text-2xl font-bold tracking-tight">Instance Groups</h1>
        <p className="text-sm text-muted-foreground">
          Logical groupings of cluster instances for job execution
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search instance groups..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['instance_groups'] })}
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
