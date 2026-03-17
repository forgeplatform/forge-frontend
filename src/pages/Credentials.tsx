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
import { useCredentials } from '@/api/hooks/useCredentials'
import { formatRelativeTime } from '@/lib/utils'
import type { Credential } from '@/api/types'

const kindLabels: Record<string, string> = {
  ssh: 'Machine',
  vault: 'Vault',
  net: 'Network',
  scm: 'Source Control',
  cloud: 'Cloud',
  registry: 'Container Registry',
  token: 'Personal Access Token',
  insights: 'Insights',
  external: 'External',
  kubernetes: 'Kubernetes',
  galaxy: 'Galaxy/Automation Hub',
  cryptography: 'Cryptography',
}

const columnHelper = createColumnHelper<Credential>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/credentials/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor(
    (row) => row.summary_fields?.credential_type?.name ?? '',
    {
      id: 'credential_type',
      header: 'Type',
      enableSorting: false,
      cell: (info) => (
        <Badge variant="outline">{info.getValue() || '–'}</Badge>
      ),
    },
  ),
  columnHelper.accessor(
    (row) => row.summary_fields?.credential_type?.kind ?? row.kind ?? '',
    {
      id: 'kind',
      header: 'Kind',
      enableSorting: false,
      cell: (info) => (kindLabels[info.getValue()] ?? info.getValue()) || '–',
    },
  ),
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
  columnHelper.accessor('created', {
    header: 'Created',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function Credentials() {
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

  const { data, isLoading, isFetching } = useCredentials({
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
        <h1 className="text-2xl font-bold tracking-tight">Credentials</h1>
        <p className="text-sm text-muted-foreground">
          Authentication credentials for automation
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search credentials..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Link to="/credentials/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Create Credential
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['credentials'] })}
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
