import type { JobHostSummary } from '@/api/types'

interface HostSummaryBarProps {
  summaries: JobHostSummary[]
}

const segments = [
  { key: 'ok', label: 'OK', color: 'bg-emerald-500' },
  { key: 'changed', label: 'Changed', color: 'bg-amber-500' },
  { key: 'failures', label: 'Failed', color: 'bg-red-500' },
  { key: 'dark', label: 'Unreachable', color: 'bg-zinc-400 dark:bg-zinc-500' },
  { key: 'skipped', label: 'Skipped', color: 'bg-blue-500' },
] as const

export function HostSummaryBar({ summaries }: HostSummaryBarProps) {
  if (summaries.length === 0) return null

  const totals = summaries.reduce(
    (acc, s) => ({
      ok: acc.ok + s.ok,
      changed: acc.changed + s.changed,
      failures: acc.failures + s.failures,
      dark: acc.dark + s.dark,
      skipped: acc.skipped + s.skipped,
    }),
    { ok: 0, changed: 0, failures: 0, dark: 0, skipped: 0 },
  )

  const total = totals.ok + totals.changed + totals.failures + totals.dark + totals.skipped
  if (total === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        {segments.map(({ key, color }) => {
          const value = totals[key]
          if (value === 0) return null
          const pct = (value / total) * 100
          return (
            <div
              key={key}
              className={color}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
            {label}: {totals[key]}
          </span>
        ))}
      </div>
    </div>
  )
}
