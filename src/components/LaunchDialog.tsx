import { useState, useEffect } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CodeEditor } from '@/components/CodeEditor'
import type { JobTemplate } from '@/api/types'

const verbosityOptions = [
  { value: '0', label: '0 (Normal)' },
  { value: '1', label: '1 (Verbose)' },
  { value: '2', label: '2 (More Verbose)' },
  { value: '3', label: '3 (Debug)' },
  { value: '4', label: '4 (Connection Debug)' },
  { value: '5', label: '5 (WinRM Debug)' },
]

const jobTypeOptions = [
  { value: 'run', label: 'Run' },
  { value: 'check', label: 'Check' },
]

interface LaunchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: JobTemplate
  isPending: boolean
  onLaunch: (payload: Record<string, unknown>) => void
}

export function LaunchDialog({
  open,
  onOpenChange,
  template,
  isPending,
  onLaunch,
}: LaunchDialogProps) {
  const [limit, setLimit] = useState(template.limit ?? '')
  const [jobTags, setJobTags] = useState(template.job_tags ?? '')
  const [skipTags, setSkipTags] = useState(template.skip_tags ?? '')
  const [verbosity, setVerbosity] = useState(String(template.verbosity ?? 0))
  const [jobType, setJobType] = useState('run')
  const [extraVars, setExtraVars] = useState(template.extra_vars || '---')
  const [forks, setForks] = useState(String(template.forks ?? 0))
  const [jobSliceCount, setJobSliceCount] = useState(String(template.job_slice_count ?? 1))

  useEffect(() => {
    if (open) {
      setLimit(template.limit ?? '')
      setJobTags(template.job_tags ?? '')
      setSkipTags(template.skip_tags ?? '')
      setVerbosity(String(template.verbosity ?? 0))
      setExtraVars(template.extra_vars || '---')
      setForks(String(template.forks ?? 0))
      setJobSliceCount(String(template.job_slice_count ?? 1))
    }
  }, [open, template])

  const hasPrompts =
    template.ask_limit_on_launch ||
    template.ask_tags_on_launch ||
    template.ask_skip_tags_on_launch ||
    template.ask_verbosity_on_launch ||
    template.ask_job_type_on_launch ||
    template.ask_variables_on_launch ||
    template.ask_forks_on_launch ||
    template.ask_job_slice_count_on_launch

  const handleLaunch = () => {
    const payload: Record<string, unknown> = {}
    if (template.ask_limit_on_launch && limit) payload.limit = limit
    if (template.ask_tags_on_launch && jobTags) payload.job_tags = jobTags
    if (template.ask_skip_tags_on_launch && skipTags) payload.skip_tags = skipTags
    if (template.ask_verbosity_on_launch) payload.verbosity = Number(verbosity)
    if (template.ask_job_type_on_launch) payload.job_type = jobType
    if (template.ask_variables_on_launch && extraVars && extraVars !== '---') payload.extra_vars = extraVars
    if (template.ask_forks_on_launch) payload.forks = Number(forks)
    if (template.ask_job_slice_count_on_launch) payload.job_slice_count = Number(jobSliceCount)
    onLaunch(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Launch: {template.name}</DialogTitle>
        </DialogHeader>

        {hasPrompts ? (
          <div className="space-y-4 py-2">
            {template.ask_job_type_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_job_type">Job Type</Label>
                <Select id="launch_job_type" value={jobType} onChange={(e) => setJobType(e.target.value)} options={jobTypeOptions} />
              </div>
            )}
            {template.ask_limit_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_limit">Limit</Label>
                <Input id="launch_limit" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. webservers" />
              </div>
            )}
            {template.ask_tags_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_tags">Job Tags</Label>
                <Input id="launch_tags" value={jobTags} onChange={(e) => setJobTags(e.target.value)} placeholder="Comma-separated" />
              </div>
            )}
            {template.ask_skip_tags_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_skip_tags">Skip Tags</Label>
                <Input id="launch_skip_tags" value={skipTags} onChange={(e) => setSkipTags(e.target.value)} placeholder="Comma-separated" />
              </div>
            )}
            {template.ask_verbosity_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_verbosity">Verbosity</Label>
                <Select id="launch_verbosity" value={verbosity} onChange={(e) => setVerbosity(e.target.value)} options={verbosityOptions} />
              </div>
            )}
            {template.ask_forks_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_forks">Forks</Label>
                <Input id="launch_forks" type="number" min="0" value={forks} onChange={(e) => setForks(e.target.value)} />
              </div>
            )}
            {template.ask_job_slice_count_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_slices">Job Slices</Label>
                <Input id="launch_slices" type="number" min="1" value={jobSliceCount} onChange={(e) => setJobSliceCount(e.target.value)} />
              </div>
            )}
            {template.ask_variables_on_launch && (
              <div className="space-y-2">
                <Label htmlFor="launch_vars">Extra Variables</Label>
                <CodeEditor
                  value={extraVars}
                  onChange={setExtraVars}
                  language="yaml"
                  height="200px"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            This template will be launched with its default settings.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleLaunch} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-1 h-4 w-4" />
            )}
            Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
