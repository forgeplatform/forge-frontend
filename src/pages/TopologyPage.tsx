import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { TopologyView } from '@/components/topology/TopologyView'
import { TopologyLegend } from '@/components/topology/TopologyLegend'

export function TopologyPage() {
  const queryClient = useQueryClient()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Topology</h1>
          <p className="text-sm text-muted-foreground">Receptor mesh network visualization</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['instance-topology'] })}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <TopologyLegend />
      <TopologyView />
    </div>
  )
}
