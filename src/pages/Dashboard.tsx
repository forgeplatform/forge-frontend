import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Server,
  Building2,
  FileText,
  FolderGit2,
  KeyRound,
  Users,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboard, useRecentJobs, useJobGraph } from '@/api/hooks/useDashboard'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { statusConfig } from '@/lib/statusConfig'
import { formatRelativeTime } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | undefined
  failed?: number
  icon: React.ComponentType<{ className?: string }>
  href: string
}

function StatCard({ title, value, failed, icon: Icon, href }: StatCardProps) {
  return (
    <Link to={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {value !== undefined ? value.toLocaleString() : '--'}
              </p>
              {failed !== undefined && failed > 0 && (
                <span className="text-xs text-destructive">
                  {failed} failed
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function Dashboard() {
  const { t } = useTranslation()
  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: recentJobs, isLoading: jobsLoading } = useRecentJobs()
  const { data: graphData, isLoading: graphLoading } = useJobGraph()

  if (dashLoading && jobsLoading && graphLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={t('dashboard.hosts')}
          value={dashboard?.hosts.total}
          failed={dashboard?.hosts.failed}
          icon={Server}
          href="/inventories"
        />
        <StatCard
          title={t('dashboard.templates')}
          value={dashboard?.job_templates.total}
          icon={FileText}
          href="/templates"
        />
        <StatCard
          title={t('dashboard.projects')}
          value={dashboard?.projects.total}
          failed={dashboard?.projects.failed}
          icon={FolderGit2}
          href="/projects"
        />
        <StatCard
          title={t('dashboard.credentials')}
          value={dashboard?.credentials.total}
          icon={KeyRound}
          href="/credentials"
        />
        <StatCard
          title={t('dashboard.organizations')}
          value={dashboard?.organizations.total}
          icon={Building2}
          href="/organizations"
        />
        <StatCard
          title={t('dashboard.users')}
          value={dashboard?.users.total}
          icon={Users}
          href="/users"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-base">{t('dashboard.recent_jobs')}</CardTitle>
            <Link to="/jobs">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('dashboard.view_all')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs?.results.length ? (
              <div className="space-y-3">
                {recentJobs.results.map((job) => {
                  const config = statusConfig[job.status]
                  const StatusIcon = config.icon
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {job.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {job.finished
                              ? formatRelativeTime(job.finished)
                              : job.status}
                          </p>
                        </div>
                      </div>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('dashboard.no_recent_jobs')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Job Activity Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{t('dashboard.job_activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {graphData && graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={graphData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => {
                      const date = new Date(d)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="successful"
                    fill="#10B981"
                    radius={[2, 2, 0, 0]}
                    name="Successful"
                  />
                  <Bar
                    dataKey="failed"
                    fill="#F43F5E"
                    radius={[2, 2, 0, 0]}
                    name="Failed"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.no_job_data')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
