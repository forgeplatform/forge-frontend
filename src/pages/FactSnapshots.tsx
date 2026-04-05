import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useFactSnapshots } from '@/api/hooks/useDrift'
import { formatRelativeTime } from '@/lib/utils'
import type { HostFactSnapshot } from '@/api/types'

const columnHelper = createColumnHelper<HostFactSnapshot>()

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: (info) => (
      <span className="text-muted-foreground">#{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('host', {
    header: 'Host',
    cell: (info) => (
      <Link
        to={`/hosts/${info.getValue()}`}
        className="text-primary hover:underline"
      >
        Host #{info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('job', {
    header: 'Job',
    cell: (info) => {
      const val = info.getValue()
      if (!val) return <span className="text-muted-foreground">-</span>
      return (
        <Link to={`/jobs/${val}`} className="text-primary hover:underline">
          #{val}
        </Link>
      )
    },
  }),
  columnHelper.accessor('facts_hash', {
    header: 'Hash',
    cell: (info) => (
      <code className="text-xs text-muted-foreground">{info.getValue().slice(0, 12)}...</code>
    ),
  }),
  columnHelper.accessor('captured_at', {
    header: 'Captured',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function FactSnapshots() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useFactSnapshots({
    page,
    page_size: pageSize,
  })

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fact Snapshots</h1>
        <p className="text-sm text-muted-foreground">
          Point-in-time captures of host ansible_facts for drift comparison
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['fact_snapshots'] })}
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
