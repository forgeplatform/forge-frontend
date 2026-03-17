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
import { useNotificationTemplates } from '@/api/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils'
import type { NotificationTemplate } from '@/api/types'

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  awssns: 'AWS SNS',
  email: 'Email',
  slack: 'Slack',
  twilio: 'Twilio',
  pagerduty: 'PagerDuty',
  grafana: 'Grafana',
  webhook: 'Webhook',
  mattermost: 'Mattermost',
  rocketchat: 'Rocket.Chat',
  irc: 'IRC',
}

const columnHelper = createColumnHelper<NotificationTemplate>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Link
        to={`/notification_templates/${info.row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('notification_type', {
    header: 'Type',
    cell: (info) => (
      <Badge variant="outline">
        {NOTIFICATION_TYPE_LABELS[info.getValue()] ?? info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor(
    (row) => row.summary_fields?.organization?.name ?? '',
    {
      id: 'organization',
      header: 'Organization',
      enableSorting: false,
      cell: (info) => info.getValue() || (
        <span className="text-muted-foreground">-</span>
      ),
    },
  ),
  columnHelper.accessor(
    (row) => {
      const recent = row.summary_fields?.recent_notifications
      if (!recent || recent.length === 0) return ''
      return recent[0]!.status
    },
    {
      id: 'last_status',
      header: 'Last Status',
      enableSorting: false,
      cell: (info) => {
        const status = info.getValue()
        if (!status) return <span className="text-muted-foreground">-</span>
        return (
          <Badge variant={status === 'successful' ? 'success' : status === 'failed' ? 'error' : 'secondary'}>
            {status}
          </Badge>
        )
      },
    },
  ),
  columnHelper.accessor('modified', {
    header: 'Modified',
    cell: (info) => (
      <span className="text-muted-foreground">{formatRelativeTime(info.getValue())}</span>
    ),
  }),
]

export function NotificationTemplates() {
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

  const { data, isLoading, isFetching } = useNotificationTemplates({
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
        <h1 className="text-2xl font-bold tracking-tight">Notification Templates</h1>
        <p className="text-sm text-muted-foreground">
          Configure how and when notifications are sent
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notification templates..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <div className="flex items-center gap-2">
          <Link to="/notification_templates/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Create
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['notification_templates'] })}
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
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
