import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { applyBranding } from './branding/applyBranding'
import './i18n'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      const msg =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || error.message
        || 'An unexpected error occurred'
      toast.error(msg)
    },
  }),
})

void (async () => {
  await applyBranding()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster position="bottom-right" richColors closeButton />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
})()
