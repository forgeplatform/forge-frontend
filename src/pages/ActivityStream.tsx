import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useActivityStream } from '@/api/hooks/useActivityStream'
import { formatRelativeTime } from '@/lib/utils'

const operationColors: Record<string, 'default' | 'success' | 'error' | 'warning' | 'secondary'> = {
  create: 'success',
  update: 'default',
  delete: 'error',
  associate: 'secondary',
  disassociate: 'warning',
}

export function ActivityStream() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useActivityStream({ page, page_size: pageSize })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Stream</h1>
          <p className="text-sm text-muted-foreground">
            Audit log of all platform changes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['activity_stream'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1 h-4 w-4${isFetching ? ' animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No activity recorded yet
        </div>
      ) : (
        <div className="space-y-2">
          {data.results.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
            >
              <Badge
                variant={operationColors[entry.operation] ?? 'secondary'}
                className="mt-0.5 shrink-0 text-[10px] uppercase"
              >
                {entry.operation}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {entry.summary_fields?.actor?.username && (
                    <span className="font-medium">{entry.summary_fields.actor.username}</span>
                  )}{' '}
                  <span className="text-muted-foreground">
                    {entry.operation === 'associate' || entry.operation === 'disassociate'
                      ? `${entry.operation}d ${entry.object1} with ${entry.object2}`
                      : `${entry.operation}d ${entry.object1}`}
                    {entry.object2 && entry.operation !== 'associate' && entry.operation !== 'disassociate' && (
                      <> on {entry.object2}</>
                    )}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(entry.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
