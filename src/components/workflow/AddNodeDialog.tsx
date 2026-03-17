import { useState, useMemo } from 'react'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useJobTemplates, useWorkflowJobTemplates } from '@/api/hooks/useTemplates'

interface AddNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (templateId: number, templateName: string, templateType: string) => void
}

export function AddNodeDialog({ open, onOpenChange, onSelect }: AddNodeDialogProps) {
  const [search, setSearch] = useState('')
  const { data: jobTemplates, isLoading: jLoading } = useJobTemplates({ page_size: 200 })
  const { data: workflowTemplates, isLoading: wLoading } = useWorkflowJobTemplates({ page_size: 200 })

  const isLoading = jLoading || wLoading

  const items = useMemo(() => {
    const results: Array<{ id: number; name: string; type: string }> = []
    for (const t of jobTemplates?.results ?? []) {
      results.push({ id: t.id, name: t.name, type: 'job' })
    }
    for (const t of workflowTemplates?.results ?? []) {
      results.push({ id: t.id, name: t.name, type: 'workflow_job' })
    }
    if (!search) return results
    const q = search.toLowerCase()
    return results.filter((r) => r.name.toLowerCase().includes(q))
  }, [jobTemplates, workflowTemplates, search])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof items> = {}
    for (const item of items) {
      const key = item.type === 'job' ? 'Job Templates' : 'Workflow Templates'
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }, [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Node</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No templates found.</p>
          ) : (
            Object.entries(grouped).map(([group, templates]) => (
              <div key={group}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                <ul className="space-y-0.5">
                  {templates.map((t) => (
                    <li key={`${t.type}-${t.id}`}>
                      <button
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelect(t.id, t.name, t.type)
                          onOpenChange(false)
                          setSearch('')
                        }}
                      >
                        {t.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
