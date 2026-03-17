import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { Search, RefreshCw, Rocket, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useJobTemplates } from '@/api/hooks/useTemplates'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'
import type { JobTemplate } from '@/api/types'

const columnHelper = createColumnHelper<JobTemplate>()

export function Templates() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const orderBy = useMemo(() => {
    const s = sorting[0]
    if (!s) return '-last_job_run'
    return s.desc ? `-${s.id}` : s.id
  }, [sorting])

  const { data, isLoading, isFetching } = useJobTemplates({
    page,
    page_size: pageSize,
    order_by: orderBy,
    search: search || undefined,
  })

  const handleLaunch = (id: number) => {
    api.post(`/job_templates/${id}/launch/`).then(({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate(`/jobs/${data.id}`)
    })
  }

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <Link
          to={`/templates/job_template/${info.row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor(
      (row) => row.summary_fields?.last_job?.status,
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: (info) => {
          const status = info.getValue()
          if (!status) return <span className="text-muted-foreground">–</span>
          const config = statusConfig[status]
          const Icon = config.icon
          return (
            <Badge variant={config.variant} className="gap-1">
              <Icon
                className={`h-3 w-3${status === 'running' ? ' animate-spin' : ''}`}
              />
              {config.label}
            </Badge>
          )
        },
      },
    ),
    columnHelper.accessor(
      (row) => row.summary_fields?.inventory?.name ?? '',
      {
        id: 'inventory',
        header: 'Inventory',
        enableSorting: false,
        cell: (info) => info.getValue() || (
          <span className="text-muted-foreground">–</span>
        ),
      },
    ),
    columnHelper.accessor(
      (row) => row.summary_fields?.project?.name ?? '',
      {
        id: 'project',
        header: 'Project',
        enableSorting: false,
        cell: (info) => info.getValue() || (
          <span className="text-muted-foreground">–</span>
        ),
      },
    ),
    columnHelper.accessor('playbook', {
      header: 'Playbook',
      enableSorting: false,
      cell: (info) => (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('last_job_run', {
      header: 'Last Run',
      cell: (info) => {
        const v = info.getValue()
        return v ? (
          <span className="text-muted-foreground">{formatRelativeTime(v)}</span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            handleLaunch(info.row.original.id)
          }}
          title="Launch job"
        >
          <Rocket className="h-4 w-4" />
        </Button>
      ),
    }),
  ], [])

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['job_templates'] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Job templates for launching automation
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <div className="flex items-center gap-2">
          <Link to="/templates/job_template/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Job Template
            </Button>
          </Link>
          <Link to="/templates/workflow_job_template/new">
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Workflow
            </Button>
          </Link>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`}
          />
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
