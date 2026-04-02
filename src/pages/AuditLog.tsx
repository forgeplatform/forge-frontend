import { useState } from 'react'
import { Download, RefreshCw, Shield, ShieldAlert, ShieldCheck, Info } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useAuditEvents, useAuditEventsCsvUrl } from '@/api/hooks/useAuditEvents'
import { formatRelativeTime } from '@/lib/utils'
import type { AuditEvent } from '@/api/types'

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'auth', label: 'Authentication' },
  { value: 'credential_access', label: 'Credential Access' },
  { value: 'permission_change', label: 'Permission Change' },
  { value: 'resource_change', label: 'Resource Change' },
  { value: 'system', label: 'System' },
]

const severityOptions = [
  { value: '', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
]

const severityColors: Record<string, 'default' | 'warning' | 'error'> = {
  info: 'default',
  warning: 'warning',
  critical: 'error',
}

const categoryIcons: Record<string, typeof Shield> = {
  auth: ShieldCheck,
  credential_access: ShieldAlert,
  permission_change: Shield,
  resource_change: Info,
  system: Info,
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant={severityColors[severity] ?? 'default'} className="text-[10px] uppercase">
      {severity}
    </Badge>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const Icon = categoryIcons[category] ?? Info
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {category.replace('_', ' ')}
    </span>
  )
}

function AuditEventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-md border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <SeverityBadge severity={event.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{event.actor_username || 'system'}</span>
            <span className="text-muted-foreground">{event.action}</span>
            {event.resource_name && (
              <span className="text-muted-foreground">
                on <span className="font-mono text-xs">{event.resource_type}/{event.resource_name}</span>
              </span>
            )}
          </div>
          {event.description && (
            <div className="mt-0.5 text-xs text-muted-foreground truncate">{event.description}</div>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <CategoryBadge category={event.category} />
            <span>{formatRelativeTime(event.timestamp)}</span>
            {event.actor_ip && <span className="font-mono">{event.actor_ip}</span>}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t pt-3 space-y-1 text-xs">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">IP:</span>{' '}
              <span className="font-mono">{event.actor_ip || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Node:</span>{' '}
              <span className="font-mono">{event.action_node || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Session:</span>{' '}
              <span className="font-mono">{event.actor_session_id ? event.actor_session_id.slice(0, 12) + '...' : '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Resource ID:</span>{' '}
              <span className="font-mono">{event.resource_id ?? '—'}</span>
            </div>
          </div>
          {event.actor_user_agent && (
            <div>
              <span className="text-muted-foreground">User-Agent:</span>{' '}
              <span className="font-mono text-[10px] break-all">{event.actor_user_agent}</span>
            </div>
          )}
          {Object.keys(event.detail).length > 0 && (
            <div>
              <span className="text-muted-foreground">Detail:</span>
              <pre className="mt-1 rounded bg-muted p-2 text-[10px] overflow-auto max-h-32">
                {JSON.stringify(event.detail, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AuditLog() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('')
  const [username, setUsername] = useState('')
  const [resourceType, setResourceType] = useState('')
  const queryClient = useQueryClient()

  const filters = {
    category: category || undefined,
    severity: severity || undefined,
    actor__username: username || undefined,
    resource_type: resourceType || undefined,
  }

  const { data, isLoading, isFetching } = useAuditEvents({ page, page_size: pageSize, ...filters })
  const csvUrl = useAuditEventsCsvUrl(filters)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Immutable security audit trail — credential access, authentication, and permission changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(csvUrl, '_blank')}
          >
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['audit_events'] })}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} options={categoryOptions} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Severity</Label>
          <Select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} options={severityOptions} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Username</Label>
          <Input
            placeholder="Filter by username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setPage(1) }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Resource Type</Label>
          <Input
            placeholder="e.g. credential, job_template"
            value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No audit events found
        </div>
      ) : (
        <div className="space-y-2">
          {data.results.map((event) => (
            <AuditEventRow key={event.id} event={event} />
          ))}
        </div>
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
