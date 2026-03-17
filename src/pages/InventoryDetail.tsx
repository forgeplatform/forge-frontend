import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table'
import { ArrowLeft, Loader2, Search, Trash2, Pencil } from 'lucide-react'
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { RBACPanel } from '@/components/RBACPanel'
import {
  useInventoryDetail,
  useInventoryHosts,
  useInventoryGroups,
  useDeleteInventory,
  useInventorySources,
  useSyncInventorySource,
} from '@/api/hooks/useInventories'
import { formatRelativeTime } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import type { Host, Group, InventorySource } from '@/api/types'

type Tab = 'hosts' | 'groups' | 'sources' | 'details'

const kindLabels: Record<string, string> = {
  '': 'Standard',
  smart: 'Smart',
  constructed: 'Constructed',
}

// --- Hosts table ---

const hostColumnHelper = createColumnHelper<Host>()
const hostColumns = [
  hostColumnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <span className="font-medium">{info.getValue()}</span>
    ),
  }),
  hostColumnHelper.accessor('enabled', {
    header: 'Enabled',
    cell: (info) => (
      <Badge variant={info.getValue() ? 'success' : 'secondary'}>
        {info.getValue() ? 'Yes' : 'No'}
      </Badge>
    ),
  }),
  hostColumnHelper.accessor('has_active_failures', {
    header: 'Health',
    cell: (info) => (
      info.getValue() ? (
        <Badge variant="error">Failures</Badge>
      ) : (
        <Badge variant="success">OK</Badge>
      )
    ),
  }),
  hostColumnHelper.accessor(
    (row) => row.summary_fields?.last_job?.status ?? '',
    {
      id: 'last_job',
      header: 'Last Job',
      cell: (info) => {
        const status = info.getValue()
        if (!status) return <span className="text-muted-foreground">–</span>
        return <Badge variant={status === 'successful' ? 'success' : status === 'failed' ? 'error' : 'secondary'}>{status}</Badge>
      },
    },
  ),
]

// --- Groups table ---

const groupColumnHelper = createColumnHelper<Group>()
const groupColumns = [
  groupColumnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <span className="font-medium">{info.getValue()}</span>
    ),
  }),
  groupColumnHelper.accessor('total_hosts', {
    header: 'Hosts',
    cell: (info) => info.getValue().toLocaleString(),
  }),
  groupColumnHelper.accessor('total_groups', {
    header: 'Child Groups',
    cell: (info) => info.getValue(),
  }),
  groupColumnHelper.accessor('has_active_failures', {
    header: 'Health',
    cell: (info) => (
      info.getValue() ? (
        <Badge variant="error">Failures</Badge>
      ) : (
        <Badge variant="success">OK</Badge>
      )
    ),
  }),
]

export function InventoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('hosts')
  const [showDelete, setShowDelete] = useState(false)
  const [hostsPage, setHostsPage] = useState(1)
  const [hostsPageSize, setHostsPageSize] = useState(25)
  const [hostsSearch, setHostsSearch] = useState('')
  const [hostsSearchInput, setHostsSearchInput] = useState('')
  const [groupsPage, setGroupsPage] = useState(1)
  const [groupsPageSize, setGroupsPageSize] = useState(25)
  const [groupsSearch, setGroupsSearch] = useState('')
  const [groupsSearchInput, setGroupsSearchInput] = useState('')

  const { data: inventory, isLoading } = useInventoryDetail(id!)
  const deleteMutation = useDeleteInventory(id!)
  const { data: hosts, isLoading: hostsLoading } = useInventoryHosts(id!, {
    page: hostsPage,
    page_size: hostsPageSize,
    search: hostsSearch || undefined,
  })
  const { data: groups, isLoading: groupsLoading } = useInventoryGroups(id!, {
    page: groupsPage,
    page_size: groupsPageSize,
    search: groupsSearch || undefined,
  })
  const { data: sources, isLoading: sourcesLoading } = useInventorySources(id!)

  const hostsTable = useReactTable({
    data: hosts?.results ?? [],
    columns: hostColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const groupsTable = useReactTable({
    data: groups?.results ?? [],
    columns: groupColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!inventory) {
    return (
      <div className="space-y-4">
        <Link to="/inventories" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Inventories
        </Link>
        <p className="text-muted-foreground">Inventory not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/inventories"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Inventories
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{inventory.name}</h1>
              <Badge variant="outline">
                {kindLabels[inventory.kind] ?? inventory.kind}
              </Badge>
              {inventory.has_active_failures ? (
                <Badge variant="error">Failures</Badge>
              ) : (
                <Badge variant="success">Healthy</Badge>
              )}
            </div>
            {inventory.description && (
              <p className="text-sm text-muted-foreground">{inventory.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {inventory.total_hosts} hosts &middot; {inventory.total_groups} groups
              &middot; Org: {inventory.summary_fields?.organization?.name ?? '–'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/inventories/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b">
          {(['hosts', 'groups', 'sources', 'details'] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === 'hosts' && (
            <div className="space-y-4">
              <form
                onSubmit={(e) => { e.preventDefault(); setHostsSearch(hostsSearchInput); setHostsPage(1) }}
                className="relative max-w-sm"
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search hosts..."
                  value={hostsSearchInput}
                  onChange={(e) => setHostsSearchInput(e.target.value)}
                  className="pl-9"
                />
              </form>
              <DataTable table={hostsTable} isLoading={hostsLoading} />
              {hosts && (
                <DataTablePagination
                  page={hostsPage}
                  pageSize={hostsPageSize}
                  totalCount={hosts.count}
                  onPageChange={setHostsPage}
                  onPageSizeChange={(size) => { setHostsPageSize(size); setHostsPage(1) }}
                />
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-4">
              <form
                onSubmit={(e) => { e.preventDefault(); setGroupsSearch(groupsSearchInput); setGroupsPage(1) }}
                className="relative max-w-sm"
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={groupsSearchInput}
                  onChange={(e) => setGroupsSearchInput(e.target.value)}
                  className="pl-9"
                />
              </form>
              <DataTable table={groupsTable} isLoading={groupsLoading} />
              {groups && (
                <DataTablePagination
                  page={groupsPage}
                  pageSize={groupsPageSize}
                  totalCount={groups.count}
                  onPageChange={setGroupsPage}
                  onPageSizeChange={(size) => { setGroupsPageSize(size); setGroupsPage(1) }}
                />
              )}
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-4">
              {sourcesLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !sources || sources.results.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No inventory sources configured.
                </div>
              ) : (
                sources.results.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <DetailRow label="Type" value={kindLabels[inventory.kind]} />
                  <DetailRow label="Organization" value={inventory.summary_fields?.organization?.name} link={`/organizations/${inventory.summary_fields?.organization?.id}`} />
                  <DetailRow label="Total Hosts" value={String(inventory.total_hosts)} />
                  <DetailRow label="Failed Hosts" value={String(inventory.hosts_with_active_failures)} />
                  <DetailRow label="Total Groups" value={String(inventory.total_groups)} />
                  <DetailRow label="Sources" value={String(inventory.total_inventory_sources)} />
                  <DetailRow label="Created" value={formatRelativeTime(inventory.created)} />
                  <DetailRow label="Modified" value={formatRelativeTime(inventory.modified)} />
                  <DetailRow label="Created By" value={inventory.summary_fields?.created_by?.username} />
                </CardContent>
              </Card>

              {inventory.variables && inventory.variables !== '---' && inventory.variables !== '{}' && (
                <Card>
                  <CardHeader><CardTitle>Variables</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto rounded bg-muted p-3 text-xs font-mono">
                      {inventory.variables}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <RBACPanel objectRoles={inventory.summary_fields?.object_roles} />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Inventory"
        description={`Are you sure you want to delete "${inventory.name}"? All hosts and groups will be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(undefined, {
            onSuccess: () => navigate('/inventories'),
          })
        }}
      />
    </div>
  )
}

function SourceCard({ source }: { source: InventorySource }) {
  const sync = useSyncInventorySource(String(source.id))
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{source.name}</span>
            <Badge variant="outline">{source.source}</Badge>
            {source.status && (
              <Badge variant={source.status === 'successful' ? 'success' : source.status === 'failed' ? 'error' : 'secondary'}>
                {source.status}
              </Badge>
            )}
          </div>
          {source.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
        >
          <RefreshCw className={`mr-1 h-4 w-4${sync.isPending ? ' animate-spin' : ''}`} />
          Sync
        </Button>
      </CardContent>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  link,
}: {
  label: string
  value?: string
  link?: string
}) {
  const display = value || '–'
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      {link ? (
        <Link to={link} className="text-primary hover:underline">{display}</Link>
      ) : (
        <span>{display}</span>
      )}
    </div>
  )
}
