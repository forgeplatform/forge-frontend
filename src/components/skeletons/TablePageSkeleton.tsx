import { Skeleton } from '@/components/ui/skeleton'

export function TablePageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <span className="sr-only">Loading</span>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      {/* Table */}
      <div className="rounded-md border">
        {/* Header row */}
        <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
        {/* Data rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
