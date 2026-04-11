import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRecommendations } from '@/api/hooks/useRecommendations'
import type { Recommendation, RecommendationScope, RecommendationSeverity } from '@/api/types'

interface RecommendationsPanelProps {
  scope: RecommendationScope
}

const severityStyles: Record<RecommendationSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

export function RecommendationsPanel({ scope }: RecommendationsPanelProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const { data } = useRecommendations(scope)

  const recs: Recommendation[] = (data?.results ?? []).filter((r) => !dismissed.has(r.id))

  if (recs.length === 0) return null

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {t('recommendations.title')} ({recs.length})
            </span>
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {open && (
          <ul className="mt-3 space-y-2">
            {recs.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-md border bg-background p-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-[10px]', severityStyles[r.severity])}>
                      {t(`recommendations.severity_${r.severity}`)}
                    </Badge>
                    <span className="text-sm font-medium">{r.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.why}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed((prev) => new Set(prev).add(r.id))}
                >
                  {t('recommendations.dismiss')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
