import { Skeleton } from '@/components/ui/skeleton'

export function FormPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <span className="sr-only">Loading</span>
      {/* Back link */}
      <Skeleton className="h-4 w-24" />
      {/* Title */}
      <Skeleton className="h-8 w-48" />
      {/* Form card */}
      <div className="rounded-lg border p-6 space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}
