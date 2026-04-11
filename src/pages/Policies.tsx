import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileLock2, Plus, Loader2, Pencil, Trash, Search, Wand2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import {
  usePolicies,
  useDeletePolicy,
  useTogglePolicy,
} from '@/api/hooks/usePolicies'
import { formatRelativeTime } from '@/lib/utils'

const ENFORCEMENT_VARIANT: Record<string, 'outline' | 'secondary' | 'error'> = {
  warn: 'outline',
  enforce: 'error',
}

export function Policies() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [enabled, setEnabled] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = usePolicies({
    page, page_size: pageSize,
    enabled: enabled || undefined,
    search: search || undefined,
  })
  const deleteMutation = useDeletePolicy()
  const toggleMutation = useTogglePolicy()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileLock2 className="h-6 w-6" /> Policies
          </h1>
          <p className="text-sm text-muted-foreground">
            Open Policy Agent (Rego) rules evaluated before every launch.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/wizards/compliance">
            <Button variant="outline">
              <Wand2 className="mr-1 h-4 w-4" /> Wizard
            </Button>
          </Link>
          <Link to="/policies/new">
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New Policy
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }}
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={enabled}
          onChange={(e) => { setEnabled(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All policies' },
            { value: 'true', label: 'Enabled only' },
            { value: 'false', label: 'Disabled only' },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No policies yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Applies to</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Enabled</th>
                  <th className="p-3">Sync</th>
                  <th className="p-3">Triggers</th>
                  <th className="p-3">Last triggered</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link to={`/policies/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.name}
                      </Link>
                      {p.description && (
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.applies_to.length === 0 ? ['all'] : p.applies_to).map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={ENFORCEMENT_VARIANT[p.enforcement] ?? 'outline'}>
                        {p.enforcement}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={p.enabled}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, enabled: v })}
                      />
                    </td>
                    <td className="p-3 text-xs">
                      {p.last_sync_status === 'ok' ? (
                        <Badge variant="success" className="text-xs">ok</Badge>
                      ) : p.last_sync_status === 'failed' ? (
                        <Badge variant="error" className="text-xs">failed</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{p.trigger_count}</td>
                    <td className="p-3 text-muted-foreground">
                      {p.last_triggered_at ? formatRelativeTime(p.last_triggered_at) : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/policies/${p.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete policy "${p.name}"?`)) {
                              deleteMutation.mutate(p.id)
                            }
                          }}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        />
      )}
    </div>
  )
}
