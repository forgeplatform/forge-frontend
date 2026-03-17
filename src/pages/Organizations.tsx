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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { formatRelativeTime } from '@/lib/utils'
import type { Organization } from '@/api/types'

const columnHelper = createColumnHelper<Organization>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/organizations/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    enableSorting: false,
    cell: (info) => {
      const v = info.getValue()
      return v ? (
        <span className="text-muted-foreground">
          {v.length > 60 ? v.slice(0, 57) + '...' : v}
        </span>
      ) : (
        <span className="text-muted-foreground">–</span>
      )
    },
  }),
  columnHelper.accessor(
    (row) => row.summary_fields?.related_field_counts?.users ?? 0,
    {
      id: 'users',
      header: 'Users',
      enableSorting: false,
      cell: (info) => info.getValue(),
    },
  ),
  columnHelper.accessor(
    (row) => row.summary_fields?.related_field_counts?.teams ?? 0,
    {
      id: 'teams',
      header: 'Teams',
      enableSorting: false,
      cell: (info) => info.getValue(),
    },
  ),
  columnHelper.accessor(
    (row) => row.summary_fields?.related_field_counts?.inventories ?? 0,
    {
      id: 'inventories',
      header: 'Inventories',
      enableSorting: false,
      cell: (info) => info.getValue(),
    },
  ),
  columnHelper.accessor(
    (row) => row.summary_fields?.related_field_counts?.projects ?? 0,
    {
      id: 'projects',
      header: 'Projects',
      enableSorting: false,
      cell: (info) => info.getValue(),
    },
  ),
  columnHelper.accessor('created', {
    header: 'Created',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function Organizations() {
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

  const { data, isLoading, isFetching } = useOrganizations({
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
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Logical groupings of users, teams, and resources
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Link to="/organizations/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['organizations'] })}
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
