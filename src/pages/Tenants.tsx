import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Plus, Loader2, Pencil, Trash, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useTenants, useDeleteTenant } from '@/api/hooks/useTenants'
import type { Tenant } from '@/api/types'

function QuotaBar({ current, limit }: { current: number; limit: number | null }) {
  if (limit === null || limit === 0) {
    return <span className="text-xs text-muted-foreground">{current} / ∞</span>
  }
  const pct = Math.min(100, Math.round((current / limit) * 100))
  const color = pct > 90 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="min-w-[80px]">
      <div className="text-xs text-muted-foreground">{current} / {limit}</div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function BrandingPreview({ tenant }: { tenant: Tenant }) {
  return (
    <div className="flex items-center gap-2">
      {tenant.branding.logo_url ? (
        <img src={tenant.branding.logo_url} alt="" className="h-6 w-6 rounded object-contain" />
      ) : (
        <div className="h-6 w-6 rounded bg-muted" />
      )}
      <div className="flex gap-1">
        {tenant.branding.primary_color && (
          <span
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: tenant.branding.primary_color }}
          />
        )}
        {tenant.branding.secondary_color && (
          <span
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: tenant.branding.secondary_color }}
          />
        )}
      </div>
    </div>
  )
}

export function Tenants() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null)

  const { data, isLoading } = useTenants({ page, page_size: pageSize })
  const deleteMutation = useDeleteTenant()

  const onConfirmDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" /> {t('tenants.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            Provision and manage tenants, quotas and branding.
          </p>
        </div>
        <Link to="/tenants/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> {t('tenants.new')}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tenants yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">{t('tenants.name')}</th>
                  <th className="p-3">{t('tenants.custom_domain')}</th>
                  <th className="p-3">{t('tenants.max_concurrent_jobs')}</th>
                  <th className="p-3">{t('tenants.max_daily_launches')}</th>
                  <th className="p-3">{t('tenants.max_hosts')}</th>
                  <th className="p-3">{t('tenants.max_storage_mb')}</th>
                  <th className="p-3">{t('tenants.branding')}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link to={`/tenants/${tenant.id}`} className="font-medium text-primary hover:underline">
                        {tenant.name}
                      </Link>
                      {tenant.contact_email && (
                        <div className="text-xs text-muted-foreground">{tenant.contact_email}</div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {tenant.branding.custom_domain || '—'}
                    </td>
                    <td className="p-3">
                      <QuotaBar
                        current={tenant.usage.concurrent_jobs_count}
                        limit={tenant.quota.max_concurrent_jobs}
                      />
                    </td>
                    <td className="p-3">
                      <QuotaBar
                        current={tenant.usage.launches_today_count}
                        limit={tenant.quota.max_daily_launches}
                      />
                    </td>
                    <td className="p-3">
                      <QuotaBar
                        current={tenant.usage.hosts_count}
                        limit={tenant.quota.max_hosts}
                      />
                    </td>
                    <td className="p-3">
                      <QuotaBar
                        current={tenant.usage.storage_mb_used}
                        limit={tenant.quota.max_storage_mb}
                      />
                    </td>
                    <td className="p-3">
                      <BrandingPreview tenant={tenant} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/tenants/${tenant.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link to={`/tenants/${tenant.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(tenant)}
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

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">{t('tenants.delete_confirm')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('tenants.delete_warning')}
            </p>
            <p className="text-sm font-medium mb-4">{deleteTarget.name}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={onConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
