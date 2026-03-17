export function TopologyLegend() {
  const items = [
    { label: 'Control', color: 'bg-blue-500', shape: 'rounded-full' },
    { label: 'Execution', color: 'bg-green-500', shape: 'rounded-sm' },
    { label: 'Hybrid', color: 'bg-purple-500', shape: 'rounded-md' },
    { label: 'Hop', color: 'bg-gray-400', shape: 'rounded-sm' },
  ]

  const lineStyles = [
    { label: 'Established', style: 'border-solid' },
    { label: 'Adding', style: 'border-dashed' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border bg-card px-4 py-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-3 w-3 ${item.color} ${item.shape}`} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
      <div className="h-4 border-l" />
      {lineStyles.map((ls) => (
        <div key={ls.label} className="flex items-center gap-1.5">
          <div className={`w-6 border-t-2 border-muted-foreground ${ls.style}`} />
          <span className="text-muted-foreground">{ls.label}</span>
        </div>
      ))}
    </div>
  )
}
