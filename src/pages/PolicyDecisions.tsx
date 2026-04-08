import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gavel, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { usePolicyDecisions } from '@/api/hooks/usePolicies'
import { formatRelativeTime } from '@/lib/utils'
import type { PolicyDecisionKind } from '@/api/types'

const DECISION_VARIANT: Record<PolicyDecisionKind, 'success' | 'outline' | 'error'> = {
  allow: 'success',
  warn: 'outline',
  deny: 'error',
}

export function PolicyDecisions() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [decision, setDecision] = useState<string>('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data, isLoading } = usePolicyDecisions({
    page, page_size: pageSize,
    decision: (decision || undefined) as PolicyDecisionKind | undefined,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Gavel className="h-6 w-6" /> Policy Decisions
        </h1>
        <p className="text-sm text-muted-foreground">
          Audit trail of every policy hit on a launch attempt.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={decision}
          onChange={(e) => { setDecision(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All decisions' },
            { value: 'deny', label: 'Deny' },
            { value: 'warn', label: 'Warn' },
            { value: 'allow', label: 'Allow' },
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
            No policy decisions logged yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Policy</th>
                  <th className="p-3">Job</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((d) => (
                  <>
                    <tr
                      key={d.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                    >
                      <td className="p-3 text-muted-foreground">{formatRelativeTime(d.created)}</td>
                      <td className="p-3">
                        <Badge variant={DECISION_VARIANT[d.decision]}>{d.decision}</Badge>
                      </td>
                      <td className="p-3">
                        {d.policy ? (
                          <Link to={`/policies/${d.policy}`} className="text-primary hover:underline">
                            {d.policy_name}
                          </Link>
                        ) : (
                          <span>{d.policy_name || '—'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {d.unified_job ? (
                          <Link to={`/jobs/${d.unified_job}`} className="text-primary hover:underline">
                            #{d.unified_job}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{d.message}</td>
                    </tr>
                    {expanded === d.id && (
                      <tr key={`${d.id}-detail`} className="border-b bg-muted/20">
                        <td colSpan={5} className="p-3">
                          <div className="text-xs">
                            <div className="font-medium mb-1">Context</div>
                            <pre className="overflow-x-auto rounded bg-background p-2">
                              {JSON.stringify(d.context, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
