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
import { useProjects } from '@/api/hooks/useProjects'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'
import type { Project, JobStatus } from '@/api/types'

const scmTypeLabels: Record<string, string> = {
  '': 'Manual',
  git: 'Git',
  svn: 'Subversion',
  archive: 'Archive',
  insights: 'Insights',
}

const columnHelper = createColumnHelper<Project>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/projects/${info.row.original.id}`}
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
      if (status === 'never updated' || status === 'ok' || status === 'missing') {
        const label = status === 'never updated' ? 'Never Updated' : status === 'ok' ? 'OK' : 'Missing'
        const variant = status === 'ok' ? 'success' : status === 'missing' ? 'error' : 'secondary'
        return <Badge variant={variant}>{label}</Badge>
      }
      const config = statusConfig[status as JobStatus]
      if (!config) return <Badge variant="secondary">{status}</Badge>
      const Icon = config.icon
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className={`h-3 w-3${status === 'running' ? ' animate-spin' : ''}`} />
          {config.label}
        </Badge>
      )
    },
  }),
  columnHelper.accessor('scm_type', {
    header: 'Type',
    cell: (info) => scmTypeLabels[info.getValue()] ?? info.getValue(),
  }),
  columnHelper.accessor('scm_url', {
    header: 'Source',
    enableSorting: false,
    cell: (info) => {
      const url = info.getValue()
      if (!url) return <span className="text-muted-foreground">–</span>
      const short = url.replace(/^https?:\/\//, '').replace(/\.git$/, '')
      return (
        <span className="font-mono text-xs text-muted-foreground" title={url}>
          {short.length > 50 ? short.slice(0, 47) + '...' : short}
        </span>
      )
    },
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
  columnHelper.accessor('last_job_run', {
    header: 'Last Updated',
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

export function Projects() {
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

  const { data, isLoading, isFetching } = useProjects({
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
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Source control repositories for playbooks
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Link to="/projects/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create Project
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
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
