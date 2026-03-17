import { lazy, Suspense } from 'react'
import { useThemeStore } from '@/stores/theme'
import { Loader2 } from 'lucide-react'

const MonacoEditor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.default })))

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: 'yaml' | 'json'
  height?: string
  readOnly?: boolean
  minimap?: boolean
}

export function CodeEditor({
  value,
  onChange,
  language = 'yaml',
  height = '200px',
  readOnly = false,
  minimap = false,
}: CodeEditorProps) {
  const theme = useThemeStore((s) => s.theme)

  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center rounded-md border bg-muted"
          style={{ height }}
        >
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <div className="overflow-hidden rounded-md border">
        <MonacoEditor
          height={height}
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          options={{
            readOnly,
            minimap: { enabled: minimap },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: readOnly ? 'off' : 'on',
            renderLineHighlight: readOnly ? 'none' : 'line',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </Suspense>
  )
}
