import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration } from '@/lib/utils'
import type { JobDetail } from '@/api/types'

interface JobDetailsTabProps {
  job: JobDetail
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm border-b last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium truncate">{children}</span>
    </div>
  )
}

function formatDateTime(date: string | null): string {
  if (!date) return '–'
  return new Date(date).toLocaleString()
}

const verbosityLabels: Record<number, string> = {
  0: '0 (Normal)',
  1: '1 (Verbose)',
  2: '2 (More Verbose)',
  3: '3 (Debug)',
  4: '4 (Connection Debug)',
  5: '5 (WinRM Debug)',
}

export function JobDetailsTab({ job }: JobDetailsTabProps) {
  const sf = job.summary_fields

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          {sf.job_template && (
            <DetailRow label="Template">{sf.job_template.name}</DetailRow>
          )}
          {sf.inventory && (
            <DetailRow label="Inventory">{sf.inventory.name}</DetailRow>
          )}
          {sf.project && (
            <DetailRow label="Project">{sf.project.name}</DetailRow>
          )}
          {job.playbook && (
            <DetailRow label="Playbook">{job.playbook}</DetailRow>
          )}
          {job.scm_branch && (
            <DetailRow label="SCM Branch">{job.scm_branch}</DetailRow>
          )}
          {job.scm_revision && (
            <DetailRow label="SCM Revision">
              <span className="font-mono text-xs">{job.scm_revision.slice(0, 10)}</span>
            </DetailRow>
          )}
          {sf.execution_environment && (
            <DetailRow label="Execution Environment">
              {sf.execution_environment.name}
            </DetailRow>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Execution Details</CardTitle>
        </CardHeader>
        <CardContent>
          {sf.launched_by && (
            <DetailRow label="Launched By">{sf.launched_by.name}</DetailRow>
          )}
          <DetailRow label="Started">{formatDateTime(job.started)}</DetailRow>
          <DetailRow label="Finished">{formatDateTime(job.finished)}</DetailRow>
          <DetailRow label="Duration">{formatDuration(job.elapsed)}</DetailRow>
          <DetailRow label="Forks">{job.forks}</DetailRow>
          <DetailRow label="Verbosity">
            {verbosityLabels[job.verbosity] ?? job.verbosity}
          </DetailRow>
          {job.execution_node && (
            <DetailRow label="Execution Node">{job.execution_node}</DetailRow>
          )}
          {job.controller_node && (
            <DetailRow label="Controller Node">{job.controller_node}</DetailRow>
          )}
        </CardContent>
      </Card>

      {/* Credentials */}
      {sf.credentials && sf.credentials.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sf.credentials.map((cred) => (
                <Badge key={cred.id} variant="secondary">
                  {cred.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Labels */}
      {sf.labels && sf.labels.count > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sf.labels.results.map((label) => (
                <Badge key={label.id} variant="outline">
                  {label.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extra Variables */}
      {job.extra_vars && job.extra_vars !== '{}' && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Extra Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs font-mono">
              {job.extra_vars}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
