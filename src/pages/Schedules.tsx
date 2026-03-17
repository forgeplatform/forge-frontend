import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table'
import { Search, RefreshCw, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useSchedules } from '@/api/hooks/useSchedules'
import { typeLabels } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'
import type { Schedule } from '@/api/types'

const columnHelper = createColumnHelper<Schedule>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/schedules/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor(
    (row) => row.summary_fields?.unified_job_template?.name ?? '',
    {
      id: 'template',
      header: 'Template',
      cell: (info) => info.getValue() || <span className="text-muted-foreground">–</span>,
    },
  ),
  columnHelper.accessor(
    (row) => row.summary_fields?.unified_job_template?.unified_job_type ?? '',
    {
      id: 'type',
      header: 'Type',
      cell: (info) => (typeLabels[info.getValue()] ?? info.getValue()) || '–',
    },
  ),
  columnHelper.accessor('enabled', {
    header: 'Enabled',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'success' : 'secondary'}>
        {info.getValue() ? 'On' : 'Off'}
      </Badge>
    ),
  }),
  columnHelper.accessor('next_run', {
    header: 'Next Run',
    cell: (info) => {
      const v = info.getValue()
      return v ? (
        <span className="text-muted-foreground">{formatRelativeTime(v)}</span>
      ) : (
        <span className="text-muted-foreground">–</span>
      )
    },
  }),
  columnHelper.accessor('dtstart', {
    header: 'Start Date',
    cell: (info) => (
      <span className="text-muted-foreground text-xs">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
]

export function Schedules() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useSchedules({
    page,
    page_size: pageSize,
    search: search || undefined,
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
        <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
        <p className="text-sm text-muted-foreground">
          Scheduled automation runs
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search schedules..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['schedules'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`} />
          Refresh
        </Button>
        <Link to="/schedules/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create Schedule
          </Button>
        </Link>
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
