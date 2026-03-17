import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface CopyDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  originalName: string
  isPending: boolean
  onCopy: (name: string) => void
}

export function CopyDialog({
  open,
  onOpenChange,
  originalName,
  isPending,
  onCopy,
}: CopyDialogProps) {
  const [name, setName] = useState(`${originalName} @ ${new Date().toISOString().slice(0, 16)}`)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>New Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onCopy(name)} disabled={isPending || !name}>
            {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
