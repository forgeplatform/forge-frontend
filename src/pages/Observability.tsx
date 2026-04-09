import { Activity, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useObservability } from '@/api/hooks/useObservability'
import { formatRelativeTime } from '@/lib/utils'

export function Observability() {
  const { t } = useTranslation()
  const { data, isLoading } = useObservability()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6" /> {t('observability.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('observability.help_text')}
        </p>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="text-xs uppercase text-muted-foreground">
                {t('observability.status')}
              </div>
              <Badge variant={data.enabled ? 'success' : 'outline'}>
                {data.enabled ? t('observability.enabled') : t('observability.disabled')}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="text-xs uppercase text-muted-foreground">
                {t('observability.collector_health')}
              </div>
              <Badge variant={data.collector_healthy ? 'success' : 'error'}>
                {data.collector_healthy
                  ? t('observability.healthy')
                  : t('observability.unhealthy')}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {t('observability.last_check')}:{' '}
                {data.collector_last_check
                  ? formatRelativeTime(data.collector_last_check)
                  : '—'}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-6 space-y-3">
              <div className="text-xs uppercase text-muted-foreground">
                {t('observability.configuration')}
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('observability.service_name')}
                  </dt>
                  <dd className="font-mono">{data.service_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('observability.exporter_endpoint')}
                  </dt>
                  <dd className="font-mono break-all">{data.exporter_endpoint}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('observability.sampler')}
                  </dt>
                  <dd className="font-mono">{data.sampler}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('observability.sampler_arg')}
                  </dt>
                  <dd className="font-mono">{data.sampler_arg}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
