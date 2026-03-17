import { useRef, useEffect } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import '@xterm/xterm/css/xterm.css'

interface JobOutputTabProps {
  stdout: string | undefined
  isLoading: boolean
  isActive: boolean
}

export function JobOutputTab({ stdout, isLoading, isActive }: JobOutputTabProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const searchRef = useRef<SearchAddon | null>(null)
  const prevStdoutRef = useRef<string>('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      convertEol: true,
      disableStdin: true,
      cursorStyle: 'bar',
      cursorBlink: false,
      scrollback: 50000,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      theme: {
        background: '#09090b',
        foreground: '#e4e4e7',
        cursor: '#e4e4e7',
        selectionBackground: '#3f3f46',
        black: '#18181b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e4e4e7',
        brightBlack: '#52525b',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#fafafa',
      },
    })

    const fit = new FitAddon()
    const search = new SearchAddon()
    term.loadAddon(fit)
    term.loadAddon(search)

    term.open(containerRef.current)
    fit.fit()

    termRef.current = term
    fitRef.current = fit
    searchRef.current = search

    const observer = new ResizeObserver(() => {
      fit.fit()
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      term.dispose()
      termRef.current = null
      fitRef.current = null
      searchRef.current = null
      prevStdoutRef.current = ''
    }
  }, [])

  // Write stdout to terminal
  useEffect(() => {
    const term = termRef.current
    if (!term || !stdout) return

    // Only write new content
    if (stdout !== prevStdoutRef.current) {
      if (stdout.startsWith(prevStdoutRef.current) && prevStdoutRef.current.length > 0) {
        // Incremental update — write only the new part
        const newContent = stdout.slice(prevStdoutRef.current.length)
        term.write(newContent)
      } else {
        // Full reset
        term.clear()
        term.write(stdout)
      }
      prevStdoutRef.current = stdout

      // Auto-scroll to bottom for active jobs
      if (isActive) {
        term.scrollToBottom()
      }
    }
  }, [stdout, isActive])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchInputRef.current?.value
    if (query && searchRef.current) {
      searchRef.current.findNext(query)
    }
  }

  if (isLoading && !stdout) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg bg-zinc-950 dark:bg-zinc-900">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search output..."
            className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </form>
      <div
        ref={containerRef}
        className="h-[600px] rounded-lg bg-[#09090b] p-1"
      />
    </div>
  )
}
