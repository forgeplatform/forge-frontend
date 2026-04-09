import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gauge, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useTenantQuotaEvents, useTenants } from '@/api/hooks/useTenants'
import { formatRelativeTime } from '@/lib/utils'
import type { TenantQuotaKind, TenantQuotaDecision } from '@/api/types'

export function TenantQuotaEvents() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [organization, setOrganization] = useState<string>('')
  const [quotaKind, setQuotaKind] = useState<string>('')
  const [decision, setDecision] = useState<string>('')
  const [since, setSince] = useState<string>('')

  const { data, isLoading } = useTenantQuotaEvents({
    page,
    page_size: pageSize,
    organization: organization || undefined,
    quota_kind: (quotaKind || undefined) as TenantQuotaKind | undefined,
    decision: (decision || undefined) as TenantQuotaDecision | undefined,
    since: since || undefined,
  })

  const { data: tenants } = useTenants({ page_size: 100 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gauge className="h-6 w-6" /> {t('tenants.quota_events')}
        </h1>
        <p className="text-sm text-muted-foreground">
          Audit trail of quota checks and blocks across tenants.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={organization}
          onChange={(e) => { setOrganization(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All tenants' },
            ...((tenants?.results ?? []).map((o) => ({ value: String(o.id), label: o.name }))),
          ]}
        />
        <Select
          value={quotaKind}
          onChange={(e) => { setQuotaKind(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All kinds' },
            { value: 'concurrent_jobs', label: t('tenants.quota_kind_concurrent_jobs') },
            { value: 'daily_launches', label: t('tenants.quota_kind_daily_launches') },
            { value: 'hosts', label: t('tenants.quota_kind_hosts') },
            { value: 'storage_mb', label: t('tenants.quota_kind_storage_mb') },
          ]}
        />
        <Select
          value={decision}
          onChange={(e) => { setDecision(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All decisions' },
            { value: 'allowed', label: t('tenants.decision_allowed') },
            { value: 'blocked', label: t('tenants.decision_blocked') },
          ]}
        />
        <Input
          type="date"
          value={since}
          onChange={(e) => { setSince(e.target.value); setPage(1) }}
          className="max-w-[180px]"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quota events logged yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Tenant</th>
                  <th className="p-3">Kind</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Current / Limit</th>
                  <th className="p-3">Triggered by</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatRelativeTime(e.created)}
                    </td>
                    <td className="p-3">{e.organization_name || '—'}</td>
                    <td className="p-3 text-xs">{t(`tenants.quota_kind_${e.quota_kind}`)}</td>
                    <td className="p-3">
                      <Badge variant={e.decision === 'blocked' ? 'error' : 'success'}>
                        {t(`tenants.decision_${e.decision}`)}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs">
                      {e.current_value} / {e.limit_value ?? '∞'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {e.triggered_by ?? '—'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{e.message}</td>
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
