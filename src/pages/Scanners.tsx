import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, Plus, Loader2, Pencil, Trash, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import {
  useScanners,
  useDeleteScanner,
  useToggleScanner,
} from '@/api/hooks/useScanners'
import { formatRelativeTime } from '@/lib/utils'

const ENFORCEMENT_VARIANT: Record<string, 'outline' | 'secondary' | 'error'> = {
  warn: 'outline',
  enforce: 'error',
}

const TOOL_VARIANT: Record<string, 'secondary' | 'outline'> = {
  'ansible-lint': 'secondary',
  checkov: 'secondary',
  'pip-audit': 'secondary',
}

export function Scanners() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [enabled, setEnabled] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useScanners({
    page, page_size: pageSize,
    enabled: enabled || undefined,
    search: search || undefined,
  })
  const deleteMutation = useDeleteScanner()
  const toggleMutation = useToggleScanner()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ScanLine className="h-6 w-6" /> Scanners
          </h1>
          <p className="text-sm text-muted-foreground">
            IaC static scanners that run on every launch.
          </p>
        </div>
        <Link to="/scanners/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> New Scanner
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }}
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scanners..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={enabled}
          onChange={(e) => { setEnabled(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All scanners' },
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
            No scanners yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Tool</th>
                  <th className="p-3">Threshold</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Enabled</th>
                  <th className="p-3">Last run</th>
                  <th className="p-3">Triggers</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link to={`/scanners/${s.id}/edit`} className="font-medium text-primary hover:underline">
                        {s.name}
                      </Link>
                      {s.description && (
                        <div className="text-xs text-muted-foreground">{s.description}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={TOOL_VARIANT[s.tool] ?? 'outline'} className="text-xs">
                        {s.tool}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">{s.severity_threshold}</td>
                    <td className="p-3">
                      <Badge variant={ENFORCEMENT_VARIANT[s.enforcement] ?? 'outline'}>
                        {s.enforcement}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: s.id, enabled: v })}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {s.last_run_at ? (
                        <div>
                          <div>{formatRelativeTime(s.last_run_at)}</div>
                          {s.last_run_status && (
                            <div className="text-[10px] uppercase">{s.last_run_status}</div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">{s.trigger_count}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/scanners/${s.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete scanner "${s.name}"?`)) {
                              deleteMutation.mutate(s.id)
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
